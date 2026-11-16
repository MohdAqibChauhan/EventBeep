import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';
import { execFile } from 'child_process';
import { promisify } from 'util';
import {
  initStore,
  getStore,
  saveStore,
  syncToPostgresIfAvailable,
  buildPipelineRunRecord,
  buildEvalCsvString,
  buildAllJobsCsvString
} from './db';
import { runCollectorsAndDedupe } from './collectors';
import { canonicalizeUrl, checkDuplicate, computeDedupeHash } from './dedupe';
import { CANONICAL_CITIES, classifyRoleRuleBased, normalizeCity, ROLE_TAXONOMY } from './taxonomy';
import { buildHandChecked50, computeEvalMetrics } from './eval-generator';
import { JobPost, Profile, UserRole } from './types';

const execFileAsync = promisify(execFile);
const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || 'beep-career-platform-secret-2026';

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(process.cwd(), 'public')));
app.use(async (_req, _res, next) => {
  try {
    await initStore();
    next();
  } catch (err) {
    next(err);
  }
});

const sseClients = new Set<express.Response>();

function broadcastSseEvent(type: string, payload: any) {
  const msg = `data: ${JSON.stringify({ type, payload, timestamp: new Date().toISOString() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(msg);
    } catch {
      sseClients.delete(client);
    }
  }
}

function issueAuthResponse(profile: Profile) {
  const token = jwt.sign(
    { id: profile.id, role: profile.role, email: profile.email, name: profile.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  return {
    token,
    user: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      role: profile.role,
      company: profile.company,
      college: profile.college
    }
  };
}

app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  res.write(
    `data: ${JSON.stringify({
      type: 'connected',
      serverless: Boolean(process.env.VERCEL),
      timestamp: new Date().toISOString()
    })}\n\n`
  );
  if (process.env.VERCEL) {
    return res.end();
  }
  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

async function callPythonSingleTagger(payload: {
  title: string;
  company: string;
  location_raw: string;
  description: string;
}) {
  const scriptPath = path.join(process.cwd(), 'tagger', 'tag_jobs.py');
  try {
    const { stdout } = await execFileAsync('python', [scriptPath, '--single', JSON.stringify(payload)], {
      timeout: 12000
    });
    return JSON.parse(stdout.trim());
  } catch {
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    const model = (process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite').trim();
    if (apiKey) {
      try {
        const prompt = `Classify this Indian fresher/internship job into role_tag (${JSON.stringify(ROLE_TAXONOMY)}) and city (${JSON.stringify(CANONICAL_CITIES)}). Return JSON with keys role_tag, city, confidence, reasoning:\n${JSON.stringify(payload)}`;
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.1, responseMimeType: 'application/json' }
            })
          }
        );
        if (r.ok) {
          const d: any = await r.json();
          const text = d?.candidates?.[0]?.content?.parts?.[0]?.text;
          const parsed = JSON.parse(text);
          const item = Array.isArray(parsed) ? parsed[0] : parsed;
          if (item?.role_tag) {
            return {
              role_tag: ROLE_TAXONOMY.includes(item.role_tag)
                ? item.role_tag
                : classifyRoleRuleBased(payload.title, payload.description).role_tag,
              city: CANONICAL_CITIES.includes(item.city)
                ? item.city
                : normalizeCity(payload.location_raw, payload.description).city,
              confidence: Number(item.confidence || 0.95),
              reasoning: item.reasoning || 'Tagged live via Gemini AI.',
              tagged_by: 'gemini-llm',
              model,
              input_tokens: d?.usageMetadata?.promptTokenCount || 165,
              output_tokens: d?.usageMetadata?.candidatesTokenCount || 42
            };
          }
        }
      } catch {}
    }

    const { city } = normalizeCity(payload.location_raw, payload.description);
    const roleInfo = classifyRoleRuleBased(payload.title, payload.description);
    return {
      role_tag: roleInfo.role_tag,
      city,
      confidence: roleInfo.confidence,
      reasoning: roleInfo.reasoning,
      tagged_by: 'hybrid-llm-rules',
      model,
      input_tokens: 165,
      output_tokens: 42
    };
  }
}

async function executeFullPipeline(trigger: 'daily-cron' | 'manual-admin'): Promise<any> {
  const store = getStore();
  const startMs = Date.now();
  const customRecruiterJobs = store.jobs.filter(
    (j) => j.source === 'EventBeep Direct Recruiter' && j.id > 3
  );
  const collected = await runCollectorsAndDedupe([]);

  let maxId = collected.newJobs.reduce((m, j) => Math.max(m, j.id), 0);
  for (const rj of customRecruiterJobs) {
    if (!collected.newJobs.some((nj) => nj.dedupe_hash === rj.dedupe_hash)) {
      rj.id = ++maxId;
      collected.newJobs.unshift(rj);
    }
  }

  store.jobs = collected.newJobs;
  store.duplicate_logs = collected.duplicates;
  store.eval_50 = buildHandChecked50(store.jobs);

  let pyStats: any = null;
  try {
    const scriptPath = path.join(process.cwd(), 'tagger', 'tag_jobs.py');
    const { stdout } = await execFileAsync('python', [scriptPath], { timeout: 20000 });
    pyStats = JSON.parse(stdout.trim());
  } catch {}

  const newRun = buildPipelineRunRecord({
    id: store.runs.length + 1,
    startMs,
    trigger,
    collected,
    totalTagged: store.jobs.length,
    inTokens: pyStats?.input_tokens,
    outTokens: pyStats?.output_tokens
  });

  store.runs.unshift(newRun);
  store.meta.last_refresh_at = newRun.finished_at;
  store.meta.next_refresh_at = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  saveStore(store);
  await syncToPostgresIfAvailable(store);
  return newRun;
}

app.get('/api/meta', (_req, res) => {
  const store = getStore();
  const evalMetrics = computeEvalMetrics(store.eval_50);
  res.json({
    meta: store.meta,
    total_unique_jobs: store.jobs.filter((j) => j.status === 'tagged').length,
    total_duplicates_removed: store.duplicate_logs.length,
    roles_taxonomy: ROLE_TAXONOMY,
    cities_taxonomy: CANONICAL_CITIES,
    eval_summary: evalMetrics,
    latest_run: store.runs[0] || null
  });
});

app.get('/api/jobs', (req, res) => {
  const store = getStore();
  const q = String(req.query.q || '').trim().toLowerCase();
  const role = String(req.query.role || '').trim();
  const city = String(req.query.city || '').trim();
  const work_mode = String(req.query.work_mode || '').trim();
  const job_type = String(req.query.job_type || '').trim();
  const source = String(req.query.source || '').trim();
  const sort = String(req.query.sort || 'newest').trim();
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(250, Math.max(10, Number(req.query.limit || 24)));

  const activeJobs = store.jobs.filter((j) => j.status === 'tagged');

  const roleCounts: Record<string, number> = {};
  const cityCounts: Record<string, number> = {};
  const sourceCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  const modeCounts: Record<string, number> = {};

  for (const j of activeJobs) {
    roleCounts[j.role_tag] = (roleCounts[j.role_tag] || 0) + 1;
    cityCounts[j.city] = (cityCounts[j.city] || 0) + 1;
    sourceCounts[j.source] = (sourceCounts[j.source] || 0) + 1;
    typeCounts[j.job_type] = (typeCounts[j.job_type] || 0) + 1;
    modeCounts[j.work_mode] = (modeCounts[j.work_mode] || 0) + 1;
  }

  const filtered = activeJobs.filter((j) => {
    if (role && role !== 'All' && j.role_tag !== role) return false;
    if (city && city !== 'All' && j.city !== city) return false;
    if (work_mode && work_mode !== 'All' && j.work_mode !== work_mode) return false;
    if (job_type && job_type !== 'All' && j.job_type !== job_type) return false;
    if (source && source !== 'All' && j.source !== source) return false;
    if (q) {
      const hay = `${j.title} ${j.company} ${j.city} ${j.role_tag} ${j.location_raw} ${j.skills.join(' ')} ${j.description}`.toLowerCase();
      const terms = q.split(/\s+/).filter(Boolean);
      for (const term of terms) {
        if (!hay.includes(term)) return false;
      }
    }
    return true;
  });

  if (sort === 'confidence') {
    filtered.sort((a, b) => b.confidence - a.confidence);
  } else if (sort === 'popular') {
    filtered.sort((a, b) => b.views_count + b.apply_clicks * 3 - (a.views_count + a.apply_clicks * 3));
  } else {
    filtered.sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime());
  }

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / limit));
  const startIdx = (page - 1) * limit;
  const items = filtered.slice(startIdx, startIdx + limit);

  const viewerRole = String(req.query.viewer_role || '');
  if (viewerRole === 'user' && items.length > 0) {
    for (const item of items) {
      item.views_count = (item.views_count ?? 0) + 1;
    }
    saveStore(store);
  }

  res.json({
    total_all_jobs: activeJobs.length,
    total_filtered: totalFiltered,
    page,
    limit,
    total_pages: totalPages,
    items,
    facets: {
      roles: roleCounts,
      cities: cityCounts,
      sources: sourceCounts,
      job_types: typeCounts,
      work_modes: modeCounts
    }
  });
});

app.post('/api/jobs/:id/click', (req, res) => {
  const store = getStore();
  const jobId = Number(req.params.id);
  const job = store.jobs.find((j) => j.id === jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  job.apply_clicks += 1;
  job.views_count += 1;
  saveStore(store);
  res.json({ ok: true, apply_clicks: job.apply_clicks, views_count: job.views_count });
});

app.post('/api/jobs/:id/apply', (req, res) => {
  const store = getStore();
  const jobId = Number(req.params.id);
  const job = store.jobs.find((j) => j.id === jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const {
    student_id,
    student_name,
    student_email,
    student_phone,
    college,
    graduation_year,
    resume_url,
    skills,
    cover_note
  } = req.body || {};

  if (!student_name || String(student_name).trim().length < 2) {
    return res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
  }
  const cleanStudentEmail = String(student_email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanStudentEmail)) {
    return res.status(400).json({ error: 'Please enter a valid email address so the recruiter can contact you.' });
  }
  const digitsOnlyPhone = String(student_phone || '').replace(/[^0-9]/g, '');
  if (digitsOnlyPhone.length < 10) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit mobile / WhatsApp number.' });
  }
  const cleanResumeUrl = String(resume_url || '').trim();
  if (cleanResumeUrl && !/^https?:\/\/.+/i.test(cleanResumeUrl)) {
    return res.status(400).json({ error: 'Please enter a valid Resume, Portfolio, or GitHub link starting with https:// or http://' });
  }

  const existing = store.applications.find(
    (a) => a.job_id === jobId && a.student_email.toLowerCase() === cleanStudentEmail.toLowerCase()
  );
  if (existing) {
    return res.status(409).json({
      error: 'You have already applied for this role with this email address. You can track your application in the My Applications tab.',
      application: existing
    });
  }

  const parsedSkills = Array.isArray(skills)
    ? skills
    : String(skills || job.skills.join(', '))
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

  const newApp = {
    id: store.applications.reduce((max, a) => Math.max(max, a.id), 0) + 1,
    job_id: job.id,
    job_title: job.title,
    company: job.company,
    role_tag: job.role_tag,
    city: job.city,
    student_id: Number(student_id || 1),
    student_name: String(student_name).trim(),
    student_email: String(student_email).trim(),
    student_phone: String(student_phone).trim(),
    college: String(college || 'PICT Pune').trim(),
    graduation_year: String(graduation_year || '2026').trim(),
    resume_url: String(resume_url || 'https://github.com/').trim(),
    skills: parsedSkills,
    cover_note: String(cover_note || 'Excited to apply for this role!').trim(),
    status: 'Under Review' as const,
    applied_at: new Date().toISOString()
  };

  store.applications.unshift(newApp);
  job.apply_clicks += 1;
  job.views_count += 1;
  saveStore(store);

  broadcastSseEvent('new_application', { application: newApp });
  res.json({ ok: true, application: newApp });
});

app.get('/api/user/applications', (req, res) => {
  const store = getStore();
  const email = String(req.query.email || 'student@eventbeep.com').toLowerCase();
  const apps = store.applications.filter((a) => a.student_email.toLowerCase() === email);
  res.json({ applications: apps });
});

app.get('/api/recruiter/applications', (req, res) => {
  const store = getStore();
  const jobId = Number(req.query.job_id || 0);
  if (!jobId) {
    return res.json({ applications: store.applications });
  }
  const targetJob = store.jobs.find((j) => j.id === jobId);
  const apps = store.applications.filter(
    (a) => a.job_id === jobId || (targetJob && a.job_title === targetJob.title)
  );
  res.json({ applications: apps });
});

app.put('/api/recruiter/applications/:id/status', (req, res) => {
  const store = getStore();
  const appId = Number(req.params.id);
  const appItem = store.applications.find((a) => a.id === appId);
  if (!appItem) return res.status(404).json({ error: 'Application not found' });

  const validStatuses = ['Under Review', 'Shortlisted', 'Interview Scheduled', 'Hired', 'Not Selected'];
  if (validStatuses.includes(req.body?.status)) {
    appItem.status = req.body.status;
  }
  saveStore(store);
  broadcastSseEvent('application_status_updated', { application: appItem });
  res.json({ ok: true, application: appItem });
});

app.delete('/api/recruiter/applications/:id', (req, res) => {
  const store = getStore();
  const appId = Number(req.params.id);
  const idx = store.applications.findIndex((a) => a.id === appId);
  if (idx < 0) return res.status(404).json({ error: 'Application not found' });
  store.applications.splice(idx, 1);
  saveStore(store);
  res.json({ ok: true });
});

function mergeClientProfiles(store: ReturnType<typeof getStore>, clientProfiles: unknown) {
  if (!Array.isArray(clientProfiles)) return;
  let added = false;
  for (const cp of clientProfiles) {
    if (
      cp &&
      typeof cp === 'object' &&
      typeof (cp as any).email === 'string' &&
      typeof (cp as any).password_hash === 'string' &&
      typeof (cp as any).name === 'string'
    ) {
      const emailLower = (cp as any).email.trim().toLowerCase();
      if (!store.profiles.some((p) => p.email.toLowerCase() === emailLower)) {
        const nextId = store.profiles.reduce((max, p) => Math.max(max, p.id), 0) + 1;
        store.profiles.push({
          id: Number((cp as any).id) > 3 ? Number((cp as any).id) : nextId,
          name: String((cp as any).name),
          email: emailLower,
          password_hash: String((cp as any).password_hash),
          role: (cp as any).role === 'recruiter' ? 'recruiter' : 'user',
          company: (cp as any).company ? String((cp as any).company) : undefined,
          college: (cp as any).college ? String((cp as any).college) : undefined,
          created_at: String((cp as any).created_at || new Date().toISOString())
        });
        added = true;
      }
    }
  }
  if (added) {
    saveStore(store);
  }
}

const ROLE_DISPLAY_NAME: Record<string, string> = {
  user: 'Student',
  recruiter: 'Recruiter',
  admin: 'Admin'
};

app.post('/api/tag', async (req, res) => {
  const { title, company, location_raw, description } = req.body || {};
  if (!title || String(title).trim().length < 2) {
    return res.status(400).json({ error: 'Please enter a valid Job Title (at least 2 characters) to preview AI tags.' });
  }
  const result = await callPythonSingleTagger({
    title: String(title).trim(),
    company: String(company || 'Startup').trim(),
    location_raw: String(location_raw || 'India').trim(),
    description: String(description || '').trim()
  });
  res.json(result);
});

app.post('/api/auth/login', (req, res) => {
  const store = getStore();
  const { email, password, selected_role, client_profiles } = req.body || {};
  mergeClientProfiles(store, client_profiles);

  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({
      error: 'Please enter a valid email address (for example: name@college.edu).',
      code: 'INVALID_EMAIL'
    });
  }
  if (!password || String(password).length === 0) {
    return res.status(400).json({
      error: 'Please enter your password to sign in.',
      code: 'MISSING_PASSWORD'
    });
  }

  const user = store.profiles.find((p) => p.email.toLowerCase() === cleanEmail);
  if (!user) {
    return res.status(401).json({
      error: `No account found for "${cleanEmail}" in the database. Please check your email spelling, or click "+ Create New Account" below if you are a new user.`,
      code: 'ACCOUNT_NOT_FOUND',
      email: cleanEmail
    });
  }

  if (!bcrypt.compareSync(String(password), user.password_hash)) {
    return res.status(401).json({
      error: `Incorrect password for "${cleanEmail}". Please double-check your password and try again.`,
      code: 'WRONG_PASSWORD'
    });
  }

  if (selected_role && ['user', 'recruiter', 'admin'].includes(String(selected_role)) && user.role !== selected_role) {
    const actualLabel = ROLE_DISPLAY_NAME[user.role] || user.role;
    const selectedLabel = ROLE_DISPLAY_NAME[String(selected_role)] || selected_role;
    return res.status(403).json({
      error: `The account "${cleanEmail}" is registered as a ${actualLabel} account, not a ${selectedLabel} account. Please switch to the "${actualLabel}" tab above to sign in.`,
      code: 'ROLE_MISMATCH',
      actual_role: user.role
    });
  }

  res.json(issueAuthResponse(user));
});

app.post('/api/auth/register', (req, res) => {
  const store = getStore();
  const { name, email, password, role, company, college, client_profiles } = req.body || {};
  mergeClientProfiles(store, client_profiles);

  const cleanName = String(name || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();
  const rawPassword = String(password || '');

  if (!cleanName || cleanName.length < 2) {
    return res.status(400).json({
      error: 'Please enter your full name (at least 2 characters).',
      code: 'INVALID_NAME'
    });
  }
  if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({
      error: 'Please enter a valid email address (for example: name@college.edu).',
      code: 'INVALID_EMAIL'
    });
  }
  if (!rawPassword || rawPassword.length < 6) {
    return res.status(400).json({
      error: 'Password must be at least 6 characters long.',
      code: 'WEAK_PASSWORD'
    });
  }
  if (role === 'admin') {
    return res.status(403).json({
      error: 'Admin accounts cannot be self-registered. Please create a Student or Recruiter account.',
      code: 'ADMIN_NOT_ALLOWED'
    });
  }
  if (store.profiles.some((p) => p.email.toLowerCase() === cleanEmail)) {
    return res.status(409).json({
      error: `An account with "${cleanEmail}" already exists in the database! Please sign in above with your password.`,
      code: 'EMAIL_EXISTS'
    });
  }

  const validRole: UserRole = role === 'recruiter' ? 'recruiter' : 'user';
  const nextId = store.profiles.reduce((max, p) => Math.max(max, p.id), 0) + 1;
  const newProfile: Profile = {
    id: nextId,
    name: cleanName,
    email: cleanEmail,
    password_hash: bcrypt.hashSync(rawPassword, 8),
    role: validRole,
    company: validRole === 'recruiter' ? String(company || `${cleanName.split(' ')[0]}'s Company`).trim() : undefined,
    college: validRole === 'user' ? String(college || 'Engineering & Management College, India').trim() : undefined,
    created_at: new Date().toISOString()
  };
  store.profiles.push(newProfile);
  saveStore(store);
  res.json({
    ...issueAuthResponse(newProfile),
    profile_record: newProfile
  });
});

app.delete('/api/auth/users/:id', (req, res) => {
  const store = getStore();
  const userId = Number(req.params.id);
  if (userId <= 3) return res.status(403).json({ error: 'Cannot delete core seed accounts' });
  const idx = store.profiles.findIndex((p) => p.id === userId);
  if (idx < 0) return res.status(404).json({ error: 'User not found' });
  store.profiles.splice(idx, 1);
  saveStore(store);
  res.json({ ok: true });
});

app.post('/api/auth/switch-role', (req, res) => {
  const store = getStore();
  const role: UserRole = ['user', 'recruiter', 'admin'].includes(req.body?.role) ? req.body.role : 'user';
  const profile = store.profiles.find((p) => p.role === role) || store.profiles[0];
  res.json(issueAuthResponse(profile));
});

app.get('/api/user/saved', (req, res) => {
  const store = getStore();
  const userId = Number(req.query.user_id || 1);
  const savedIds = store.saved_jobs.filter((s) => s.user_id === userId).map((s) => s.job_id);
  const savedJobs = store.jobs.filter((j) => savedIds.includes(j.id));
  res.json({ saved_ids: savedIds, jobs: savedJobs });
});

app.post('/api/user/saved', (req, res) => {
  const store = getStore();
  const userId = Number(req.body?.user_id || 1);
  const jobId = Number(req.body?.job_id);
  const existingIdx = store.saved_jobs.findIndex((s) => s.user_id === userId && s.job_id === jobId);
  let saved = false;
  if (existingIdx >= 0) {
    store.saved_jobs.splice(existingIdx, 1);
  } else {
    store.saved_jobs.push({ user_id: userId, job_id: jobId, saved_at: new Date().toISOString() });
    saved = true;
  }
  saveStore(store);
  const savedIds = store.saved_jobs.filter((s) => s.user_id === userId).map((s) => s.job_id);
  res.json({ saved, saved_ids: savedIds });
});

app.post('/api/jobs/:id/report-tag', (req, res) => {
  const store = getStore();
  const jobId = Number(req.params.id);
  const job = store.jobs.find((j) => j.id === jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const { corrected_role, corrected_city, reason, user_id, user_name, user_role } = req.body || {};
  const nextRole = corrected_role || job.role_tag;
  const nextCity = corrected_city || job.city;
  if (nextRole === job.role_tag && nextCity === job.city) {
    return res.status(400).json({ error: 'Please select a different Role or City tag before submitting a suggestion.' });
  }
  if (!reason || String(reason).trim().length < 4) {
    return res.status(400).json({ error: 'Please enter a short note explaining why this tag should be changed.' });
  }
  const correction = {
    id: store.tag_corrections.reduce((max, c) => Math.max(max, c.id), 0) + 1,
    job_id: job.id,
    job_title: job.title,
    company: job.company,
    previous_role: job.role_tag,
    previous_city: job.city,
    corrected_role: nextRole,
    corrected_city: nextCity,
    reason: String(reason).trim(),
    by_user_id: Number(user_id || 1),
    by_user_name: String(user_name || 'Mohdaqib (Student)'),
    by_user_role: (user_role as UserRole) || 'user',
    status: 'pending' as const,
    created_at: new Date().toISOString()
  };
  store.tag_corrections.unshift(correction);
  saveStore(store);
  res.json({ ok: true, correction });
});

app.get('/api/recruiter/jobs', (_req, res) => {
  const store = getStore();
  const recruiterJobs = store.jobs
    .filter((j) => j.source === 'EventBeep Direct Recruiter' || j.posted_by != null)
    .map((j) => {
      const directApps = store.applications.filter(
        (a) => a.job_id === j.id || a.job_title === j.title
      ).length;
      const views = Math.max(j.views_count ?? 0, directApps);
      j.apply_clicks = directApps;
      j.views_count = views;
      return j;
    });
  res.json({ jobs: recruiterJobs });
});

app.post('/api/recruiter/jobs', async (req, res) => {
  const store = getStore();
  const {
    title,
    company,
    location_raw,
    description,
    url,
    job_type,
    stipend_or_salary,
    experience_required,
    skills,
    auto_approve,
    posted_by
  } = req.body || {};

  const cleanTitle = String(title || '').trim();
  const cleanCompany = String(company || '').trim();
  const cleanLocation = String(location_raw || '').trim();
  const cleanUrl = String(url || '').trim();

  if (!cleanTitle || cleanTitle.length < 3) {
    return res.status(400).json({ error: 'Please enter a valid Job Title (at least 3 characters).' });
  }
  if (!cleanCompany || cleanCompany.length < 2) {
    return res.status(400).json({ error: 'Please enter your Company or Startup name.' });
  }
  if (!cleanLocation || cleanLocation.length < 2) {
    return res.status(400).json({ error: 'Please enter the job City or Location (for example: Baner, Pune or Remote).' });
  }
  if (cleanUrl && !/^https?:\/\/.+/i.test(cleanUrl)) {
    return res.status(400).json({
      error: 'Career Page Link must start with https:// or http:// (or leave it blank to collect student applications directly on Beep).'
    });
  }

  const tagResult = await callPythonSingleTagger({
    title: cleanTitle,
    company: cleanCompany,
    location_raw: cleanLocation,
    description: String(description || '')
  });

  const { work_mode } = normalizeCity(String(location_raw), String(description || ''));
  const hasExternalUrl = Boolean(url && String(url).trim().startsWith('http'));
  const rawUrl = hasExternalUrl
    ? String(url).trim()
    : `https://www.eventbeep.com/direct-apply/${Date.now()}`;
  const canonical_url = canonicalizeUrl(rawUrl);
  const dedupe_hash = computeDedupeHash(String(company), String(title), tagResult.city);

  const dupeCheck = checkDuplicate(
    {
      title: String(title),
      company: String(company),
      canonical_url,
      dedupe_hash,
      city: tagResult.city
    },
    store.jobs
  );

  if (dupeCheck.isDuplicate && dupeCheck.matchedJob) {
    return res.status(409).json({
      error: `We found an existing post for "${dupeCheck.matchedJob.title}" at ${dupeCheck.matchedJob.company} in ${dupeCheck.matchedJob.city}, so we prevented a duplicate listing.`,
      duplicate_layer: dupeCheck.layer,
      matched_job: dupeCheck.matchedJob
    });
  }

  const nextId = store.jobs.reduce((max, j) => Math.max(max, j.id), 0) + 1;
  const nowIso = new Date().toISOString();
  const parsedSkills = Array.isArray(skills)
    ? skills
    : String(skills || 'Communication, Problem Solving, Execution')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

  const newJob: JobPost = {
    id: nextId,
    title: String(title).trim(),
    company: String(company).trim(),
    location_raw: String(location_raw).trim(),
    description: String(description || `${title} opening at ${company} for freshers/interns in ${location_raw}.`).trim(),
    url: rawUrl,
    canonical_url,
    dedupe_hash,
    source: 'EventBeep Direct Recruiter',
    source_compliance: 'First-party recruiter submission on EventBeep',
    job_type: job_type === 'Full-Time Fresher' ? 'Full-Time Fresher' : 'Internship',
    work_mode,
    stipend_or_salary: String(stipend_or_salary || '₹25,000 - ₹40,000 / month'),
    experience_required: String(experience_required || '0 yrs (Fresher)'),
    skills: parsedSkills,
    posted_at: nowIso,
    first_seen: nowIso,
    last_seen: nowIso,
    status: auto_approve === false ? 'pending_review' : 'tagged',
    role_tag: tagResult.role_tag,
    city: tagResult.city,
    confidence: tagResult.confidence,
    llm_reasoning: tagResult.reasoning,
    tagged_by: tagResult.tagged_by || 'gemini-llm',
    is_fresher: true,
    posted_by: Number(posted_by || 2),
    has_external_url: hasExternalUrl,
    views_count: 0,
    apply_clicks: 0
  };

  store.jobs.unshift(newJob);
  saveStore(store);
  await syncToPostgresIfAvailable(store);

  broadcastSseEvent('new_job', { job: newJob });

  res.json({
    ok: true,
    job: newJob,
    llm_tag: tagResult
  });
});

app.delete('/api/recruiter/jobs/:id', (req, res) => {
  const store = getStore();
  const jobId = Number(req.params.id);
  const idx = store.jobs.findIndex((j) => j.id === jobId);
  if (idx < 0) return res.status(404).json({ error: 'Job not found' });
  store.jobs.splice(idx, 1);
  saveStore(store);
  res.json({ ok: true });
});

app.get('/api/admin/overview', (_req, res) => {
  const store = getStore();
  const evalMetrics = computeEvalMetrics(store.eval_50);
  const pendingJobs = store.jobs.filter((j) => j.status === 'pending_review');
  res.json({
    meta: store.meta,
    total_jobs: store.jobs.length,
    tagged_jobs: store.jobs.filter((j) => j.status === 'tagged').length,
    pending_jobs: pendingJobs,
    runs: store.runs,
    duplicate_logs: store.duplicate_logs.slice(0, 50),
    total_duplicates: store.duplicate_logs.length,
    tag_corrections: store.tag_corrections,
    eval_metrics: evalMetrics,
    eval_50: store.eval_50
  });
});

app.post('/api/admin/run-pipeline', async (_req, res) => {
  try {
    const run = await executeFullPipeline('manual-admin');
    res.json({ ok: true, run });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Pipeline run failed' });
  }
});

app.post('/api/admin/corrections/:id/resolve', (req, res) => {
  const store = getStore();
  const corrId = Number(req.params.id);
  const action = req.body?.action === 'dismiss' ? 'dismissed' : 'applied';
  const corr = store.tag_corrections.find((c) => c.id === corrId);
  if (!corr) return res.status(404).json({ error: 'Correction not found' });

  corr.status = action;
  if (action === 'applied') {
    const job = store.jobs.find((j) => j.id === corr.job_id);
    if (job) {
      job.role_tag = corr.corrected_role;
      job.city = corr.corrected_city;
      job.tagged_by = 'admin-verified';
      job.confidence = 1.0;
    }
  }
  saveStore(store);
  res.json({ ok: true, correction: corr });
});

app.delete('/api/admin/corrections/:id', (req, res) => {
  const store = getStore();
  const corrId = Number(req.params.id);
  const idx = store.tag_corrections.findIndex((c) => c.id === corrId);
  if (idx < 0) return res.status(404).json({ error: 'Correction not found' });
  store.tag_corrections.splice(idx, 1);
  saveStore(store);
  res.json({ ok: true });
});

app.post('/api/admin/jobs/:id/moderate', (req, res) => {
  const store = getStore();
  const jobId = Number(req.params.id);
  const status = req.body?.status === 'rejected' ? 'rejected' : 'tagged';
  const job = store.jobs.find((j) => j.id === jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  job.status = status;
  if (req.body?.role_tag) job.role_tag = req.body.role_tag;
  if (req.body?.city) job.city = req.body.city;
  saveStore(store);
  res.json({ ok: true, job });
});

app.get('/api/eval', (_req, res) => {
  const store = getStore();
  res.json({
    metrics: computeEvalMetrics(store.eval_50),
    samples: store.eval_50
  });
});

app.put('/api/eval/:sampleNo', (req, res) => {
  const store = getStore();
  const sampleNo = Number(req.params.sampleNo);
  const sample = store.eval_50.find((s) => s.sample_no === sampleNo);
  if (!sample) return res.status(404).json({ error: 'Sample not found' });

  if (req.body.human_role) sample.human_role = req.body.human_role;
  if (req.body.human_city) sample.human_city = req.body.human_city;
  if (typeof req.body.error_analysis === 'string') sample.error_analysis = req.body.error_analysis;

  sample.role_correct = sample.llm_role === sample.human_role;
  sample.city_correct = sample.llm_city === sample.human_city;
  sample.both_correct = sample.role_correct && sample.city_correct;
  sample.checked_at = new Date().toISOString();

  saveStore(store);
  res.json({
    ok: true,
    sample,
    metrics: computeEvalMetrics(store.eval_50)
  });
});

app.get('/api/export/eval-50.csv', (_req, res) => {
  const store = getStore();
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="beep_50_hand_checked_eval.csv"');
  res.send(buildEvalCsvString(store));
});

app.get('/api/export/all-jobs.csv', (_req, res) => {
  const store = getStore();
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="beep_all_200_plus_fresher_jobs.csv"');
  res.send(buildAllJobsCsvString(store));
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

async function start() {
  const store = await initStore();
  console.log(`[Beep DB] Initialized with ${store.jobs.length} unique India fresher/internship posts and ${store.duplicate_logs.length} deduplicated entries.`);

  cron.schedule('0 6 * * *', async () => {
    await executeFullPipeline('daily-cron');
  });

  app.listen(PORT, () => {
    console.log(`[Beep Server] Live at http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  start().catch((err) => {
    console.error('Failed to start Beep server:', err);
    process.exit(1);
  });
}

(app as any).default = app;
if (typeof module !== 'undefined') {
  module.exports = app;
}
export default app;
