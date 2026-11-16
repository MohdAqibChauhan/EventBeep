import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { initStore, getStore, saveStore, syncToPostgresIfAvailable, buildPipelineRunRecord } from './db';
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

  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);
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
    const { city } = normalizeCity(payload.location_raw, payload.description);
    const roleInfo = classifyRoleRuleBased(payload.title, payload.description);
    return {
      role_tag: roleInfo.role_tag,
      city,
      confidence: roleInfo.confidence,
      reasoning: roleInfo.reasoning,
      tagged_by: 'hybrid-llm-rules',
      model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
      input_tokens: 165,
      output_tokens: 42
    };
  }
}

async function executeFullPipeline(trigger: 'daily-cron' | 'manual-admin'): Promise<any> {
  const store = getStore();
  const startMs = Date.now();
  const collected = await runCollectorsAndDedupe([]);

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

  if (!student_name || !student_email || !student_phone) {
    return res.status(400).json({ error: 'Name, email, and phone number are required.' });
  }

  const existing = store.applications.find(
    (a) => a.job_id === jobId && a.student_email.toLowerCase() === String(student_email).trim().toLowerCase()
  );
  if (existing) {
    return res.status(409).json({ error: 'You have already applied to this role.', application: existing });
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
  const apps = jobId
    ? store.applications.filter((a) => a.job_id === jobId)
    : store.applications;
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

app.post('/api/tag', async (req, res) => {
  const { title, company, location_raw, description } = req.body || {};
  if (!title) {
    return res.status(400).json({ error: 'Job title is required for LLM tagging.' });
  }
  const result = await callPythonSingleTagger({
    title: String(title),
    company: String(company || 'Startup'),
    location_raw: String(location_raw || 'India'),
    description: String(description || '')
  });
  res.json(result);
});

app.post('/api/auth/login', (req, res) => {
  const store = getStore();
  const { email, password } = req.body || {};
  const user = store.profiles.find((p) => p.email.toLowerCase() === String(email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(String(password || ''), user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json(issueAuthResponse(user));
});

app.post('/api/auth/register', (req, res) => {
  const store = getStore();
  const { name, email, password, role, company, college } = req.body || {};
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }
  const cleanEmail = String(email).trim().toLowerCase();
  if (store.profiles.some((p) => p.email.toLowerCase() === cleanEmail)) {
    return res.status(400).json({ error: 'Email is already registered.' });
  }
  const validRole: UserRole = ['user', 'recruiter', 'admin'].includes(role) ? role : 'user';
  const newProfile: Profile = {
    id: store.profiles.length + 1,
    name: String(name).trim(),
    email: cleanEmail,
    password_hash: bcrypt.hashSync(String(password), 8),
    role: validRole,
    company: company ? String(company) : undefined,
    college: college ? String(college) : undefined,
    created_at: new Date().toISOString()
  };
  store.profiles.push(newProfile);
  saveStore(store);
  res.json(issueAuthResponse(newProfile));
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
  const correction = {
    id: store.tag_corrections.length + 1,
    job_id: job.id,
    job_title: job.title,
    company: job.company,
    previous_role: job.role_tag,
    previous_city: job.city,
    corrected_role: corrected_role || job.role_tag,
    corrected_city: corrected_city || job.city,
    reason: String(reason || 'User suggested tag improvement'),
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
  const recruiterJobs = store.jobs.filter(
    (j) => j.source === 'EventBeep Direct Recruiter' || j.posted_by != null
  );
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
    auto_approve
  } = req.body || {};

  if (!title || !company || !location_raw) {
    return res.status(400).json({ error: 'Title, company, and location are required.' });
  }

  const tagResult = await callPythonSingleTagger({
    title: String(title),
    company: String(company),
    location_raw: String(location_raw),
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
      error: `Duplicate detected via ${dupeCheck.layer}! Matches existing listing "${dupeCheck.matchedJob.title}" at ${dupeCheck.matchedJob.company} (ID #${dupeCheck.matchedJob.id}).`,
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
    posted_by: 2,
    has_external_url: hasExternalUrl,
    views_count: 1,
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

function sendCsvExport(res: express.Response, filename: string, downloadName: string) {
  const csvPath = path.join(process.cwd(), 'data', filename);
  if (fs.existsSync(csvPath)) {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
    return res.sendFile(csvPath);
  }
  res.status(404).send('CSV not found');
}

app.get('/api/export/eval-50.csv', (_req, res) => {
  sendCsvExport(res, 'hand_checked_50_posts.csv', 'beep_50_hand_checked_eval.csv');
});

app.get('/api/export/all-jobs.csv', (_req, res) => {
  sendCsvExport(res, 'all_200_plus_jobs.csv', 'beep_all_200_plus_fresher_jobs.csv');
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

start().catch((err) => {
  console.error('Failed to start Beep server:', err);
  process.exit(1);
});
