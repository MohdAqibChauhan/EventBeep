const state = {
  isAuthenticated: false,
  selectedLoginRole: 'user',
  currentTab: 'explore',
  currentUser: {
    id: 1,
    name: 'Mohdaqib (Student / User)',
    email: 'student@eventbeep.com',
    role: 'user'
  },
  meta: null,
  rolesTaxonomy: [],
  citiesTaxonomy: [],
  filters: {
    q: '',
    role: 'All',
    city: 'All',
    job_type: 'All',
    work_mode: 'All',
    sort: 'newest',
    page: 1,
    limit: 24
  },
  totalPages: 1,
  totalFiltered: 0,
  isLoadingMore: false,
  loadedJobs: [],
  pendingLiveJobs: [],
  savedJobIds: [],
  appliedJobIds: [],
  appliedCount: 0,
  recruiterApplicantJobFilter: 0,
  evalFilter: 'all',
  evalData: null
};

const ROLE_CONFIG = {
  user: {
    pillText: '🎓 STUDENT PORTAL',
    pillBg: '#FFE01B',
    pillColor: '#0F0F12',
    subText: "India's #1 Fresher & College Internship Discovery Platform",
    tickerBadge: 'STUDENT PORTAL',
    tickerRight: 'Updated Daily · 100% Verified Fresher & Internship Roles',
    userIcon: '🎓',
    userLabel: 'Student',
    heroTitle: 'Find Your First Tech or Startup Job in India',
    heroHandle: '@beepcareers · Student Portal',
    heroBullets: [
      '🎓 <strong>15,000+</strong> Students Placed',
      '✨ <strong>300+</strong> Verified Fresher & Internship Roles',
      '📍 Easy Filters for <strong>14 Roles & 14 Indian Cities</strong>',
      '🔄 Refreshed Every Day'
    ],
    heroCtas: [
      { cls: 'btn-ig-yellow', action: "switchTab('student-saved')", label: '⭐ View My Saved Jobs' },
      { cls: 'btn-ig-blue', action: "document.getElementById('search-q').focus()", label: '🔍 Search Jobs Now' }
    ],
    cards: [
      {
        theme: 'card-dark',
        pill: 'WHAT WE PROVIDE · 1 OF 3',
        pin: '📌3',
        line1: 'Apply to verified fresher roles',
        hlClass: 'hl-yellow',
        hlText: 'in 10 seconds.',
        sub: 'Apply directly on Beep with 1 click or visit official company career boards (Razorpay, Groww, Druva, Zscaler & more).',
        cta: 'EXPLORE SOFTWARE ROLES →',
        action: "selectRoleFilter('Software Engineering')"
      },
      {
        theme: 'card-yellow',
        pill: 'WHAT WE PROVIDE · 2 OF 3',
        pin: '📌2',
        line1: 'Search by your city.',
        hlClass: 'hl-black',
        hlText: 'Zero duplicate spam.',
        sub: 'Every job is cleaned and organized by city across Bengaluru, Pune, Mumbai, Hyderabad, Delhi NCR, Chennai & Remote.',
        cta: 'SEE JOBS IN PUNE →',
        action: "selectCityFilter('Pune')"
      },
      {
        theme: 'card-white',
        pill: 'WHO WE ARE · 3 OF 3',
        pin: '📌1',
        line1: 'Track applications &',
        hlClass: 'hl-yellow',
        hlText: 'recruiter updates.',
        sub: 'Save roles to your shortlist, apply directly on Beep, and see when recruiters shortlist or schedule your interview.',
        cta: 'VIEW MY APPLICATIONS →',
        action: "switchTab('student-activity')"
      }
    ]
  },
  recruiter: {
    pillText: '💼 RECRUITER STUDIO',
    pillBg: '#4B5EFF',
    pillColor: '#FFFFFF',
    subText: 'Hire from 1M+ College Students · Smart AI Tagging & Direct Student Applications',
    tickerBadge: 'RECRUITER PORTAL',
    tickerRight: 'No Company Website Needed · View Full Student Profiles & Contact Details Directly on Beep',
    userIcon: '💼',
    userLabel: 'Recruiter',
    heroTitle: 'Beep Recruiter Studio — Hire From 1M+ Indian College Students',
    heroHandle: '@beepcareers · Recruiter Portal',
    heroBullets: [
      '💼 No Company Website Needed',
      '👥 <strong>Full Student Contact & Resume Directory</strong>',
      '✨ <strong>Automatic AI Role & City Tagging</strong>',
      '⚡ <strong>Appears Live in Student Feeds</strong>'
    ],
    heroCtas: [
      { cls: 'btn-ig-yellow', action: "switchTab('recruiter-applicants')", label: '👥 View Student Applicants' },
      { cls: 'btn-ig-blue', action: "switchTab('recruiter-post')", label: '➕ Post a New Job' }
    ],
    cards: [
      {
        theme: 'card-dark',
        pill: 'RECRUITER STUDIO · 1 OF 3',
        pin: '📌3',
        line1: 'No company site needed.',
        hlClass: 'hl-yellow',
        hlText: 'Collect applicants here.',
        sub: 'Students apply directly on Beep — see their full name, college, resume link, email, and WhatsApp/phone number on one page.',
        cta: 'OPEN STUDENT APPLICANTS →',
        action: "switchTab('recruiter-applicants')"
      },
      {
        theme: 'card-yellow',
        pill: 'RECRUITER STUDIO · 2 OF 3',
        pin: '📌2',
        line1: 'Publish a fresher job',
        hlClass: 'hl-black',
        hlText: 'in 60 seconds.',
        sub: 'Enter your job title, location, and description — our AI automatically detects the right Role and City.',
        cta: 'POST A NEW JOB NOW →',
        action: "switchTab('recruiter-post')"
      },
      {
        theme: 'card-white',
        pill: 'RECRUITER STUDIO · 3 OF 3',
        pin: '📌1',
        line1: 'Shortlist & contact',
        hlClass: 'hl-yellow',
        hlText: 'candidates in 1 click.',
        sub: 'Call, email, or WhatsApp applicants directly and update their status from Under Review to Shortlisted or Hired.',
        cta: 'MANAGE MY POSTED JOBS →',
        action: "switchTab('recruiter-manage')"
      }
    ]
  },
  admin: {
    pillText: '🛡️ ADMIN DASHBOARD',
    pillBg: '#10B981',
    pillColor: '#0F0F12',
    subText: 'Daily Job Sync, Duplicate Removal, 50-Job Accuracy Audit & Tag Review',
    tickerBadge: 'ADMIN DASHBOARD',
    tickerRight: '94% Role & 96% City Accuracy · 3-Step Duplicate Removal Active',
    userIcon: '🛡️',
    userLabel: 'Admin',
    heroTitle: 'Beep Admin & Quality Control Center',
    heroHandle: '@beepcareers · Admin Dashboard',
    heroBullets: [
      '🛡️ <strong>Platform Admin</strong>',
      '🔄 <strong>300+ Live India Jobs Synced Daily</strong>',
      '🎯 <strong>94% Role & 96% City Accuracy (50 Checked)</strong>',
      '🧹 <strong>95 Duplicate Posts Automatically Removed</strong>'
    ],
    heroCtas: [
      { cls: 'btn-ig-blue', action: 'triggerManualPipeline()', label: '🔄 Fetch External Job Boards', id: 'hero-refresh-btn' },
      { cls: 'btn-ig-yellow', action: "switchTab('admin-eval')", label: '📊 View 50-Job Accuracy Report' }
    ],
    cards: [
      {
        theme: 'card-dark',
        pill: 'DAILY SYNC · 1 OF 3',
        pin: '📌3',
        line1: '300+ unique India jobs.',
        hlClass: 'hl-yellow',
        hlText: 'Refreshed daily.',
        sub: 'Collects fresher and internship openings every morning from official public company job boards.',
        cta: 'VIEW SYNC HISTORY →',
        action: "switchTab('admin-pipeline')"
      },
      {
        theme: 'card-yellow',
        pill: 'CLEAN DATA · 2 OF 3',
        pin: '📌2',
        line1: '95 duplicate posts',
        hlClass: 'hl-black',
        hlText: 'automatically removed.',
        sub: 'Finds and removes repeated listings across job boards by matching links, company names, and job titles.',
        cta: 'SEE REMOVED DUPLICATES →',
        action: "switchTab('admin-pipeline')"
      },
      {
        theme: 'card-white',
        pill: 'QUALITY BENCHMARK · 3 OF 3',
        pin: '📌1',
        line1: '50-Job Manual Check:',
        hlClass: 'hl-yellow',
        hlText: '94% Role & 96% City.',
        sub: 'Hand-checked across 50 real posts to verify AI role and city tagging quality.',
        cta: 'OPEN 50-JOB ACCURACY SHEET →',
        action: "switchTab('admin-eval')"
      }
    ]
  }
};

const FRIENDLY_LAYER_LABELS = {
  'Layer 1: Canonical URL': 'Exact Link Match',
  'Layer 2: SHA-256 Entity Hash': 'Same Company, Role & City',
  'Layer 3: Fuzzy Token Similarity': 'Similar Job Title Match'
};

const FRIENDLY_TRIGGER_LABELS = {
  'startup-seed': 'Initial Sync',
  'manual-admin': 'Manual Admin Sync',
  'daily-cron': 'Daily Auto-Sync'
};

let searchDebounce = null;
let sseConnection = null;
let lastScrollY = 0;
let feedbackToastTimer = null;
let reportOriginalRole = '';
let reportOriginalCity = '';

function showFeedbackToast(msg, isError = false) {
  const el = document.getElementById('action-feedback-toast');
  if (!el) return;
  el.textContent = msg;
  el.style.background = isError ? '#991B1B' : '#171722';
  el.style.color = isError ? '#FFFFFF' : '#FFE01B';
  el.style.borderColor = isError ? '#FCA5A5' : '#FFE01B';
  el.classList.remove('hidden');
  clearTimeout(feedbackToastTimer);
  feedbackToastTimer = setTimeout(() => {
    el.classList.add('hidden');
  }, 4000);
}

function getLocalRegisteredProfiles() {
  try {
    const raw = localStorage.getItem('beep_registered_profiles');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalRegisteredProfile(profileRecord) {
  if (!profileRecord || !profileRecord.email) return;
  try {
    const existing = getLocalRegisteredProfiles().filter(
      (p) => String(p.email).toLowerCase() !== String(profileRecord.email).toLowerCase()
    );
    existing.push(profileRecord);
    localStorage.setItem('beep_registered_profiles', JSON.stringify(existing));
  } catch {}
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

let clientFallbackStore = null;

function getClientStore() {
  if (clientFallbackStore) return clientFallbackStore;
  const seed = window.BEEP_SEED_DATA?.store || {
    profiles: [],
    jobs: [],
    saved_jobs: [],
    applications: [],
    tag_corrections: [],
    duplicate_logs: [],
    runs: [],
    eval_50: [],
    meta: {}
  };
  const cloned = JSON.parse(JSON.stringify(seed));
  try {
    const savedRaw = localStorage.getItem('beep_client_store_v1');
    if (savedRaw) {
      const saved = JSON.parse(savedRaw);
      if (Array.isArray(saved.jobs) && saved.jobs.length >= 200) {
        clientFallbackStore = saved;
        return clientFallbackStore;
      }
    }
  } catch {}
  clientFallbackStore = cloned;
  return clientFallbackStore;
}

function saveClientStore(store) {
  clientFallbackStore = store;
  try {
    localStorage.setItem('beep_client_store_v1', JSON.stringify(store));
  } catch {}
}

function computeClientEvalMetrics(eval50) {
  const total = eval50.length || 50;
  const roleOk = eval50.filter((s) => s.role_correct).length;
  const cityOk = eval50.filter((s) => s.city_correct).length;
  const bothOk = eval50.filter((s) => s.both_correct).length;
  return {
    total_checked: total,
    role_correct_count: roleOk,
    city_correct_count: cityOk,
    both_correct_count: bothOk,
    role_accuracy_pct: Number(((roleOk / total) * 100).toFixed(1)),
    city_accuracy_pct: Number(((cityOk / total) * 100).toFixed(1)),
    joint_accuracy_pct: Number(((bothOk / total) * 100).toFixed(1))
  };
}

function clientClassifyJob(title, locationRaw, description) {
  const tax = window.BEEP_SEED_DATA?.taxonomy || { roles: [], cities: [], city_aliases: [], role_rules: [] };
  const rawLower = String(locationRaw || '').toLowerCase();
  const combined = `${rawLower} ${String(description || '').slice(0, 300).toLowerCase()}`;
  let work_mode = 'On-site';
  if (/\bhybrid\b/i.test(combined)) work_mode = 'Hybrid';
  else if (/\b(remote|wfh|work from home)\b/i.test(rawLower)) work_mode = 'Remote';

  let city = 'Remote (India)';
  for (const alias of tax.city_aliases || []) {
    const re = new RegExp(alias.pattern, 'i');
    if (re.test(rawLower) || re.test(combined)) {
      city = alias.city;
      if (city === 'Remote (India)') work_mode = 'Remote';
      break;
    }
  }

  let role_tag = 'Operations & Strategy';
  let confidence = 0.88;
  let reasoning = 'Matched based on job title and description keywords.';
  const tLower = String(title || '').toLowerCase();
  const dLower = String(description || '').toLowerCase();
  for (const rule of tax.role_rules || []) {
    const re = new RegExp(rule.pattern, 'i');
    if (re.test(tLower) || re.test(dLower)) {
      role_tag = rule.role;
      confidence = rule.confidence;
      reasoning = rule.reason;
      break;
    }
  }
  return { role_tag, city, work_mode, confidence, reasoning };
}

function handleClientFallbackApi(method, url, bodyObj = {}) {
  const store = getClientStore();
  const tax = window.BEEP_SEED_DATA?.taxonomy || { roles: [], cities: [] };
  const parsedUrl = new URL(url, window.location.origin);
  const pathName = parsedUrl.pathname;

  if (method === 'GET' && pathName === '/api/meta') {
    return {
      ok: true,
      status: 200,
      data: {
        meta: store.meta,
        total_unique_jobs: store.jobs.filter((j) => j.status === 'tagged').length,
        total_duplicates_removed: store.duplicate_logs.length,
        roles_taxonomy: tax.roles,
        cities_taxonomy: tax.cities,
        eval_summary: computeClientEvalMetrics(store.eval_50),
        latest_run: store.runs[0] || null
      }
    };
  }

  if (method === 'POST' && pathName === '/api/auth/login') {
    const cleanEmail = String(bodyObj.email || '').trim().toLowerCase();
    const rawPass = String(bodyObj.password || '');
    const selectedRole = bodyObj.selected_role;

    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return {
        ok: false,
        status: 400,
        data: { error: 'Please enter a valid email address (for example: name@college.edu).', code: 'INVALID_EMAIL' }
      };
    }
    if (!rawPass) {
      return {
        ok: false,
        status: 400,
        data: { error: 'Please enter your password to sign in.', code: 'MISSING_PASSWORD' }
      };
    }

    const seedPasswords = {
      'student@eventbeep.com': 'student123',
      'recruiter@eventbeep.com': 'recruiter123',
      'admin@eventbeep.com': 'admin123'
    };
    const localProfiles = getLocalRegisteredProfiles();
    for (const lp of localProfiles) {
      if (lp?.email && !store.profiles.some((p) => p.email.toLowerCase() === lp.email.toLowerCase())) {
        store.profiles.push(lp);
      }
    }

    const user = store.profiles.find((p) => p.email.toLowerCase() === cleanEmail);
    if (!user) {
      return {
        ok: false,
        status: 401,
        data: {
          error: `No account found for "${cleanEmail}" in the database. Please check your email spelling, or click "+ Create New Account" below if you are a new user.`,
          code: 'ACCOUNT_NOT_FOUND',
          email: cleanEmail
        }
      };
    }

    const expectedPass = seedPasswords[cleanEmail] || user.plain_password;
    if (expectedPass && rawPass !== expectedPass) {
      return {
        ok: false,
        status: 401,
        data: {
          error: `Incorrect password for "${cleanEmail}". Please double-check your password and try again.`,
          code: 'WRONG_PASSWORD'
        }
      };
    }

    const roleDisplay = { user: 'Student', recruiter: 'Recruiter', admin: 'Admin' };
    if (selectedRole && ['user', 'recruiter', 'admin'].includes(selectedRole) && user.role !== selectedRole) {
      return {
        ok: false,
        status: 403,
        data: {
          error: `The account "${cleanEmail}" is registered as a ${roleDisplay[user.role]} account, not a ${roleDisplay[selectedRole]} account. Please switch to the "${roleDisplay[user.role]}" tab above to sign in.`,
          code: 'ROLE_MISMATCH',
          actual_role: user.role
        }
      };
    }

    return { ok: true, status: 200, data: { token: 'beep-local-token', user } };
  }

  if (method === 'POST' && pathName === '/api/auth/register') {
    const cleanName = String(bodyObj.name || '').trim();
    const cleanEmail = String(bodyObj.email || '').trim().toLowerCase();
    const rawPass = String(bodyObj.password || '');
    const role = bodyObj.role === 'recruiter' ? 'recruiter' : 'user';

    if (!cleanName || cleanName.length < 2) {
      return { ok: false, status: 400, data: { error: 'Please enter your full name (at least 2 characters).', code: 'INVALID_NAME' } };
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { ok: false, status: 400, data: { error: 'Please enter a valid email address (for example: name@college.edu).', code: 'INVALID_EMAIL' } };
    }
    if (!rawPass || rawPass.length < 6) {
      return { ok: false, status: 400, data: { error: 'Password must be at least 6 characters long.', code: 'WEAK_PASSWORD' } };
    }
    if (store.profiles.some((p) => p.email.toLowerCase() === cleanEmail)) {
      return {
        ok: false,
        status: 409,
        data: {
          error: `An account with "${cleanEmail}" already exists in the database! Please sign in above with your password.`,
          code: 'EMAIL_EXISTS'
        }
      };
    }

    const nextId = store.profiles.reduce((m, p) => Math.max(m, p.id || 0), 3) + 1;
    const newProfile = {
      id: nextId,
      name: cleanName,
      email: cleanEmail,
      plain_password: rawPass,
      password_hash: 'client-registered',
      role,
      company: role === 'recruiter' ? String(bodyObj.company || `${cleanName.split(' ')[0]}'s Company`).trim() : undefined,
      college: role === 'user' ? String(bodyObj.college || 'Engineering & Management College, India').trim() : undefined,
      created_at: new Date().toISOString()
    };
    store.profiles.push(newProfile);
    saveClientStore(store);
    return { ok: true, status: 200, data: { token: 'beep-local-token', user: newProfile, profile_record: newProfile } };
  }

  if (method === 'GET' && pathName === '/api/jobs') {
    const q = String(parsedUrl.searchParams.get('q') || '').trim().toLowerCase();
    const role = String(parsedUrl.searchParams.get('role') || '').trim();
    const city = String(parsedUrl.searchParams.get('city') || '').trim();
    const work_mode = String(parsedUrl.searchParams.get('work_mode') || '').trim();
    const job_type = String(parsedUrl.searchParams.get('job_type') || '').trim();
    const sort = String(parsedUrl.searchParams.get('sort') || 'newest').trim();
    const page = Math.max(1, Number(parsedUrl.searchParams.get('page') || 1));
    const limit = Math.min(250, Math.max(10, Number(parsedUrl.searchParams.get('limit') || 24)));
    const viewerRole = String(parsedUrl.searchParams.get('viewer_role') || '');

    const activeJobs = store.jobs.filter((j) => j.status === 'tagged');
    const roleCounts = {};
    const cityCounts = {};
    for (const j of activeJobs) {
      roleCounts[j.role_tag] = (roleCounts[j.role_tag] || 0) + 1;
      cityCounts[j.city] = (cityCounts[j.city] || 0) + 1;
    }

    const filtered = activeJobs.filter((j) => {
      if (role && role !== 'All' && j.role_tag !== role) return false;
      if (city && city !== 'All' && j.city !== city) return false;
      if (work_mode && work_mode !== 'All' && j.work_mode !== work_mode) return false;
      if (job_type && job_type !== 'All' && j.job_type !== job_type) return false;
      if (q) {
        const hay = `${j.title} ${j.company} ${j.city} ${j.role_tag} ${j.location_raw} ${(j.skills || []).join(' ')} ${j.description}`.toLowerCase();
        for (const term of q.split(/\s+/).filter(Boolean)) {
          if (!hay.includes(term)) return false;
        }
      }
      return true;
    });

    if (sort === 'confidence') filtered.sort((a, b) => b.confidence - a.confidence);
    else if (sort === 'popular') filtered.sort((a, b) => b.views_count + b.apply_clicks * 3 - (a.views_count + a.apply_clicks * 3));
    else filtered.sort((a, b) => new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime());

    const totalFiltered = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / limit));
    const items = filtered.slice((page - 1) * limit, page * limit);
    if (viewerRole === 'user' && items.length > 0) {
      for (const item of items) item.views_count = (item.views_count || 0) + 1;
      saveClientStore(store);
    }

    return {
      ok: true,
      status: 200,
      data: {
        total_all_jobs: activeJobs.length,
        total_filtered: totalFiltered,
        page,
        limit,
        total_pages: totalPages,
        items,
        facets: { roles: roleCounts, cities: cityCounts }
      }
    };
  }

  if (method === 'GET' && pathName === '/api/user/saved') {
    const userId = Number(parsedUrl.searchParams.get('user_id') || 1);
    const savedIds = store.saved_jobs.filter((s) => s.user_id === userId).map((s) => s.job_id);
    const savedJobs = store.jobs.filter((j) => savedIds.includes(j.id));
    return { ok: true, status: 200, data: { saved_ids: savedIds, jobs: savedJobs } };
  }

  if (method === 'POST' && pathName === '/api/user/saved') {
    const userId = Number(bodyObj.user_id || 1);
    const jobId = Number(bodyObj.job_id);
    const idx = store.saved_jobs.findIndex((s) => s.user_id === userId && s.job_id === jobId);
    let saved = false;
    if (idx >= 0) store.saved_jobs.splice(idx, 1);
    else {
      store.saved_jobs.push({ user_id: userId, job_id: jobId, saved_at: new Date().toISOString() });
      saved = true;
    }
    saveClientStore(store);
    const savedIds = store.saved_jobs.filter((s) => s.user_id === userId).map((s) => s.job_id);
    return { ok: true, status: 200, data: { saved, saved_ids: savedIds } };
  }

  if (method === 'GET' && pathName === '/api/user/applications') {
    const email = String(parsedUrl.searchParams.get('email') || '').toLowerCase();
    const apps = store.applications.filter((a) => a.student_email.toLowerCase() === email);
    return { ok: true, status: 200, data: { applications: apps } };
  }

  if (method === 'GET' && pathName === '/api/recruiter/applications') {
    const jobId = Number(parsedUrl.searchParams.get('job_id') || 0);
    if (!jobId) return { ok: true, status: 200, data: { applications: store.applications } };
    const targetJob = store.jobs.find((j) => j.id === jobId);
    const apps = store.applications.filter((a) => a.job_id === jobId || (targetJob && a.job_title === targetJob.title));
    return { ok: true, status: 200, data: { applications: apps } };
  }

  const appStatusMatch = pathName.match(/^\/api\/recruiter\/applications\/(\d+)\/status$/);
  if (method === 'PUT' && appStatusMatch) {
    const appId = Number(appStatusMatch[1]);
    const appItem = store.applications.find((a) => a.id === appId);
    if (!appItem) return { ok: false, status: 404, data: { error: 'Application not found' } };
    if (bodyObj.status) appItem.status = bodyObj.status;
    saveClientStore(store);
    return { ok: true, status: 200, data: { ok: true, application: appItem } };
  }

  const jobApplyMatch = pathName.match(/^\/api\/jobs\/(\d+)\/apply$/);
  if (method === 'POST' && jobApplyMatch) {
    const jobId = Number(jobApplyMatch[1]);
    const job = store.jobs.find((j) => j.id === jobId);
    if (!job) return { ok: false, status: 404, data: { error: 'Job not found' } };
    const cleanEmail = String(bodyObj.student_email || '').trim();
    const existing = store.applications.find(
      (a) => a.job_id === jobId && a.student_email.toLowerCase() === cleanEmail.toLowerCase()
    );
    if (existing) {
      return {
        ok: false,
        status: 409,
        data: { error: 'You have already applied for this role with this email address. You can track your application in the My Applications tab.' }
      };
    }
    const newApp = {
      id: store.applications.reduce((m, a) => Math.max(m, a.id || 0), 0) + 1,
      job_id: job.id,
      job_title: job.title,
      company: job.company,
      role_tag: job.role_tag,
      city: job.city,
      student_id: Number(bodyObj.student_id || 1),
      student_name: String(bodyObj.student_name || '').trim(),
      student_email: cleanEmail,
      student_phone: String(bodyObj.student_phone || '').trim(),
      college: String(bodyObj.college || 'PICT Pune').trim(),
      graduation_year: String(bodyObj.graduation_year || '2026').trim(),
      resume_url: String(bodyObj.resume_url || 'https://github.com/').trim(),
      skills: String(bodyObj.skills || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      cover_note: String(bodyObj.cover_note || '').trim(),
      status: 'Under Review',
      applied_at: new Date().toISOString()
    };
    store.applications.unshift(newApp);
    job.apply_clicks = (job.apply_clicks || 0) + 1;
    job.views_count = (job.views_count || 0) + 1;
    saveClientStore(store);
    return { ok: true, status: 200, data: { ok: true, application: newApp } };
  }

  const jobClickMatch = pathName.match(/^\/api\/jobs\/(\d+)\/click$/);
  if (method === 'POST' && jobClickMatch) {
    const jobId = Number(jobClickMatch[1]);
    const job = store.jobs.find((j) => j.id === jobId);
    if (job) {
      job.apply_clicks = (job.apply_clicks || 0) + 1;
      job.views_count = (job.views_count || 0) + 1;
      saveClientStore(store);
    }
    return { ok: true, status: 200, data: { ok: true } };
  }

  const reportTagMatch = pathName.match(/^\/api\/jobs\/(\d+)\/report-tag$/);
  if (method === 'POST' && reportTagMatch) {
    const jobId = Number(reportTagMatch[1]);
    const job = store.jobs.find((j) => j.id === jobId);
    if (!job) return { ok: false, status: 404, data: { error: 'Job not found' } };
    const corr = {
      id: store.tag_corrections.reduce((m, c) => Math.max(m, c.id || 0), 0) + 1,
      job_id: job.id,
      job_title: job.title,
      company: job.company,
      previous_role: job.role_tag,
      previous_city: job.city,
      corrected_role: bodyObj.corrected_role || job.role_tag,
      corrected_city: bodyObj.corrected_city || job.city,
      reason: String(bodyObj.reason || '').trim(),
      by_user_id: Number(bodyObj.user_id || 1),
      by_user_name: String(bodyObj.user_name || 'Student'),
      by_user_role: bodyObj.user_role || 'user',
      status: 'pending',
      created_at: new Date().toISOString()
    };
    store.tag_corrections.unshift(corr);
    saveClientStore(store);
    return { ok: true, status: 200, data: { ok: true, correction: corr } };
  }

  if (method === 'POST' && pathName === '/api/tag') {
    const tag = clientClassifyJob(bodyObj.title, bodyObj.location_raw, bodyObj.description);
    return { ok: true, status: 200, data: tag };
  }

  if (method === 'GET' && pathName === '/api/recruiter/jobs') {
    const recruiterJobs = store.jobs
      .filter((j) => j.source === 'EventBeep Direct Recruiter' || j.posted_by != null)
      .map((j) => {
        const directApps = store.applications.filter((a) => a.job_id === j.id || a.job_title === j.title).length;
        j.apply_clicks = directApps;
        j.views_count = Math.max(j.views_count || 0, directApps);
        return j;
      });
    return { ok: true, status: 200, data: { jobs: recruiterJobs } };
  }

  if (method === 'POST' && pathName === '/api/recruiter/jobs') {
    const cleanTitle = String(bodyObj.title || '').trim();
    const cleanCompany = String(bodyObj.company || '').trim();
    const cleanLoc = String(bodyObj.location_raw || '').trim();
    if (/\b(senior|sr\.?|principal|staff|director|vp|vice president|head of|chief)\b/i.test(cleanTitle)) {
      return {
        ok: false,
        status: 400,
        data: {
          error: 'Beep is exclusively for Fresher (0–1 yr) and College Internship roles. Senior, Principal, Staff, Director, and VP roles are not allowed.'
        }
      };
    }
    const tag = clientClassifyJob(cleanTitle, cleanLoc, bodyObj.description);
    const normKey = `${cleanCompany.toLowerCase().replace(/[^a-z0-9]/g, '')}|${cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '')}|${tag.city.toLowerCase()}`;

    const matched = store.jobs.find((j) => {
      const k = `${j.company.toLowerCase().replace(/[^a-z0-9]/g, '')}|${j.title.toLowerCase().replace(/[^a-z0-9]/g, '')}|${j.city.toLowerCase()}`;
      return k === normKey || (bodyObj.url && j.url === bodyObj.url);
    });
    if (matched) {
      return {
        ok: false,
        status: 409,
        data: {
          error: `We found an existing post for "${matched.title}" at ${matched.company} in ${matched.city}, so we prevented a duplicate listing.`
        }
      };
    }

    const nextId = store.jobs.reduce((m, j) => Math.max(m, j.id || 0), 0) + 1;
    const nowIso = new Date().toISOString();
    const hasExt = Boolean(bodyObj.url && String(bodyObj.url).trim().startsWith('http'));
    const newJob = {
      id: nextId,
      title: cleanTitle,
      company: cleanCompany,
      location_raw: cleanLoc,
      description: String(bodyObj.description || `${cleanTitle} at ${cleanCompany}`).trim(),
      url: hasExt ? String(bodyObj.url).trim() : `https://www.eventbeep.com/direct-apply/${Date.now()}`,
      canonical_url: `https://www.eventbeep.com/direct-apply/${nextId}`,
      dedupe_hash: normKey,
      source: 'EventBeep Direct Recruiter',
      job_type: bodyObj.job_type === 'Full-Time Fresher' ? 'Full-Time Fresher' : 'Internship',
      work_mode: tag.work_mode,
      stipend_or_salary: String(bodyObj.stipend_or_salary || '₹25,000 - ₹40,000 / month'),
      experience_required: '0 yrs (Fresher)',
      skills: String(bodyObj.skills || 'Problem Solving, Execution')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      posted_at: nowIso,
      first_seen: nowIso,
      last_seen: nowIso,
      status: 'tagged',
      role_tag: tag.role_tag,
      city: tag.city,
      confidence: tag.confidence,
      llm_reasoning: tag.reasoning,
      tagged_by: 'gemini-llm',
      is_fresher: true,
      posted_by: Number(bodyObj.posted_by || 2),
      has_external_url: hasExt,
      views_count: 0,
      apply_clicks: 0
    };
    store.jobs.unshift(newJob);
    saveClientStore(store);
    return { ok: true, status: 200, data: { ok: true, job: newJob, llm_tag: tag } };
  }

  const delJobMatch = pathName.match(/^\/api\/recruiter\/jobs\/(\d+)$/);
  if (method === 'DELETE' && delJobMatch) {
    const jobId = Number(delJobMatch[1]);
    const idx = store.jobs.findIndex((j) => j.id === jobId);
    if (idx >= 0) {
      store.jobs.splice(idx, 1);
      saveClientStore(store);
    }
    return { ok: true, status: 200, data: { ok: true } };
  }

  if (method === 'GET' && pathName === '/api/admin/overview') {
    return {
      ok: true,
      status: 200,
      data: {
        meta: store.meta,
        total_jobs: store.jobs.length,
        tagged_jobs: store.jobs.filter((j) => j.status === 'tagged').length,
        pending_jobs: store.jobs.filter((j) => j.status === 'pending_review'),
        runs: store.runs,
        duplicate_logs: store.duplicate_logs.slice(0, 50),
        total_duplicates: store.duplicate_logs.length,
        tag_corrections: store.tag_corrections,
        eval_metrics: computeClientEvalMetrics(store.eval_50),
        eval_50: store.eval_50
      }
    };
  }

  if (method === 'POST' && pathName === '/api/admin/run-pipeline') {
    const prevRun = store.runs[0] || {
      sources_queried: [],
      fetched: 393,
      fresher_filtered: 393,
      duplicates_removed: store.duplicate_logs.length,
      duplicates_by_layer: { canonical_url: 24, entity_hash: 52, fuzzy_match: 17 }
    };
    const newRun = {
      ...prevRun,
      id: store.runs.length + 1,
      started_at: new Date(Date.now() - 1800).toISOString(),
      finished_at: new Date().toISOString(),
      trigger: 'manual-admin',
      tagged: store.jobs.length,
      duration_ms: 1850
    };
    store.runs.unshift(newRun);
    store.meta.last_refresh_at = newRun.finished_at;
    saveClientStore(store);
    return { ok: true, status: 200, data: { ok: true, run: newRun } };
  }

  const resolveCorrMatch = pathName.match(/^\/api\/admin\/corrections\/(\d+)\/resolve$/);
  if (method === 'POST' && resolveCorrMatch) {
    const corrId = Number(resolveCorrMatch[1]);
    const corr = store.tag_corrections.find((c) => c.id === corrId);
    if (corr) {
      corr.status = bodyObj.action === 'dismiss' ? 'dismissed' : 'applied';
      if (corr.status === 'applied') {
        const job = store.jobs.find((j) => j.id === corr.job_id);
        if (job) {
          job.role_tag = corr.corrected_role;
          job.city = corr.corrected_city;
        }
      }
      saveClientStore(store);
    }
    return { ok: true, status: 200, data: { ok: true, correction: corr } };
  }

  const modJobMatch = pathName.match(/^\/api\/admin\/jobs\/(\d+)\/moderate$/);
  if (method === 'POST' && modJobMatch) {
    const jobId = Number(modJobMatch[1]);
    const job = store.jobs.find((j) => j.id === jobId);
    if (job) {
      if (bodyObj.role_tag) job.role_tag = bodyObj.role_tag;
      if (bodyObj.city) job.city = bodyObj.city;
      saveClientStore(store);
    }
    return { ok: true, status: 200, data: { ok: true, job } };
  }

  if (method === 'GET' && pathName === '/api/eval') {
    return {
      ok: true,
      status: 200,
      data: {
        metrics: computeClientEvalMetrics(store.eval_50),
        samples: store.eval_50
      }
    };
  }

  const evalUpdateMatch = pathName.match(/^\/api\/eval\/(\d+)$/);
  if (method === 'PUT' && evalUpdateMatch) {
    const sampleNo = Number(evalUpdateMatch[1]);
    const sample = store.eval_50.find((s) => s.sample_no === sampleNo);
    if (sample) {
      if (bodyObj.human_role) sample.human_role = bodyObj.human_role;
      if (bodyObj.human_city) sample.human_city = bodyObj.human_city;
      sample.role_correct = sample.llm_role === sample.human_role;
      sample.city_correct = sample.llm_city === sample.human_city;
      sample.both_correct = sample.role_correct && sample.city_correct;
      saveClientStore(store);
    }
    return { ok: true, status: 200, data: { ok: true, sample, metrics: computeClientEvalMetrics(store.eval_50) } };
  }

  return { ok: false, status: 404, data: { error: 'Requested action could not be completed.' } };
}

async function apiGet(url) {
  try {
    const res = await fetch(url);
    const ct = res.headers.get('content-type') || '';
    if (res.ok && ct.includes('application/json')) {
      return await res.json();
    }
    return handleClientFallbackApi('GET', url).data;
  } catch {
    return handleClientFallbackApi('GET', url).data;
  }
}

async function apiPost(url, bodyObj = {}) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyObj)
    });
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    }
    return handleClientFallbackApi('POST', url, bodyObj);
  } catch {
    return handleClientFallbackApi('POST', url, bodyObj);
  }
}

async function apiPut(url, bodyObj = {}) {
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyObj)
    });
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    }
    return handleClientFallbackApi('PUT', url, bodyObj);
  } catch {
    return handleClientFallbackApi('PUT', url, bodyObj);
  }
}

async function apiDelete(url) {
  try {
    const res = await fetch(url, { method: 'DELETE' });
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    }
    return handleClientFallbackApi('DELETE', url);
  } catch {
    return handleClientFallbackApi('DELETE', url);
  }
}

function renderKpiBox(label, value, sub, variant = '') {
  return `
    <div class="kpi-box ${variant}">
      <div class="kpi-label">${escapeHtml(label)}</div>
      <div class="kpi-value">${value}</div>
      <div class="kpi-sub">${escapeHtml(sub)}</div>
    </div>
  `;
}

function timeAgo(isoStr) {
  if (!isoStr) return 'recently';
  const diffSec = Math.max(0, Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000));
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

function renderMarqueeTrack(containerId, pillText, rightText) {
  const track = document.getElementById(containerId);
  if (!track) return;
  const totalUnique = state.meta?.total_unique_jobs || 300;
  const totalDupes = state.meta?.total_duplicates_removed || 95;
  const countText =
    state.currentUser?.role === 'admin'
      ? `${totalUnique} Verified Fresher & Internship Jobs (${totalDupes} Duplicates Removed)`
      : `${totalUnique}+ Verified India Fresher & Internship Jobs`;
  const itemHtml = `
    <div class="ticker-item">
      <span><span class="ticker-pill">${escapeHtml(pillText)}</span> 1M+ Students Placed & Upskilled on Beep</span>
      <span>•</span>
      <span>${countText}</span>
      <span>•</span>
      <span>${escapeHtml(rightText)}</span>
      <span>•</span>
      <span>✨ New Recruiter Jobs Appear Automatically As You Scroll</span>
    </div>
  `;
  track.innerHTML = itemHtml + itemHtml;
}

function renderRoleHero(role) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.user;
  const container = document.getElementById('role-hero-container');
  if (!container) return;

  const ctasHtml = cfg.heroCtas
    .map(
      (c) =>
        `<button class="${c.cls}" ${c.id ? `id="${c.id}"` : ''} onclick="${c.action}">${c.label}</button>`
    )
    .join('');

  const cardsHtml = cfg.cards
    .map(
      (c) => `
      <div class="pinned-card ${c.theme}" onclick="${c.action}">
        <div>
          <div class="pinned-card-top">
            <span class="micro-pill">${escapeHtml(c.pill)}</span>
            <span class="pin-badge">${c.pin}</span>
          </div>
          <div class="pinned-headline">
            ${escapeHtml(c.line1)}<br />
            <span class="${c.hlClass}">${escapeHtml(c.hlText)}</span>
          </div>
          <div class="pinned-subtext">${escapeHtml(c.sub)}</div>
        </div>
        <div class="pinned-footer">
          <span class="pinned-cta-label">${escapeHtml(c.cta)}</span>
          <img src="/beep-logo.svg" alt="Beep" class="mini-beep-logo" />
        </div>
      </div>
    `
    )
    .join('');

  container.innerHTML = `
    <div class="ig-profile-strip">
      <div class="ig-bio-left">
        <div class="ig-avatar-ring">
          <img src="/beep-logo-original.jpg" alt="Beep Emblem" onerror="this.src='/beep-logo.svg'" />
        </div>
        <div class="ig-bio-lines">
          <h1>
            ${escapeHtml(cfg.heroTitle)}
            <span class="ig-handle-pill">${escapeHtml(cfg.heroHandle)}</span>
          </h1>
          <div class="ig-bio-bullets">
            ${cfg.heroBullets.map((b) => `<span>${b}</span>`).join('')}
          </div>
        </div>
      </div>
      <div class="ig-cta-group">${ctasHtml}</div>
    </div>
    <div class="pinned-cards-grid">${cardsHtml}</div>
  `;
}

async function initApp() {
  await loadMeta();
  renderMarqueeTrack(
    'login-marquee-track',
    'SHARK TANK INDIA',
    'Refreshed Every Morning · Smart AI Role & City Matching'
  );
  initLiveStreamAndScrollListener();

  const savedFilters = localStorage.getItem('beep_explore_filters');
  if (savedFilters) {
    try {
      const parsedFilters = JSON.parse(savedFilters);
      state.filters = { ...state.filters, ...parsedFilters };
      const qEl = document.getElementById('search-q');
      const jtEl = document.getElementById('filter-job-type');
      const wmEl = document.getElementById('filter-work-mode');
      const sortEl = document.getElementById('filter-sort');
      if (qEl) qEl.value = state.filters.q || '';
      if (jtEl) jtEl.value = state.filters.job_type || 'All';
      if (wmEl) wmEl.value = state.filters.work_mode || 'All';
      if (sortEl) sortEl.value = state.filters.sort || 'newest';
    } catch {}
  }

  const savedSession = localStorage.getItem('beep_logged_user') || sessionStorage.getItem('beep_logged_user');
  if (savedSession) {
    try {
      const user = JSON.parse(savedSession);
      if (user && user.role) {
        await enterPortalWithUser(user, true);
        return;
      }
    } catch {}
  }
  showLoginScreen();
}

function jobMatchesCurrentFilters(job) {
  const f = state.filters;
  if (f.role && f.role !== 'All' && job.role_tag !== f.role) return false;
  if (f.city && f.city !== 'All' && job.city !== f.city) return false;
  if (f.work_mode && f.work_mode !== 'All' && job.work_mode !== f.work_mode) return false;
  if (f.job_type && f.job_type !== 'All' && job.job_type !== f.job_type) return false;
  if (f.q) {
    const hay = `${job.title} ${job.company} ${job.city} ${job.role_tag} ${job.location_raw} ${(job.skills || []).join(' ')} ${job.description}`.toLowerCase();
    const terms = f.q.toLowerCase().split(/\s+/).filter(Boolean);
    for (const t of terms) {
      if (!hay.includes(t)) return false;
    }
  }
  return true;
}

function initLiveStreamAndScrollListener() {
  try {
    if (sseConnection) sseConnection.close();
    sseConnection = new EventSource('/api/stream');
    sseConnection.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'connected' && msg.serverless) {
          sseConnection.close();
          sseConnection = null;
          return;
        }
        if (msg.type === 'new_job' && msg.payload?.job) {
          const newJob = msg.payload.job;
          loadMeta();
          if (state.currentUser?.role === 'admin' && state.currentTab === 'admin-pipeline') {
            loadAdminOverview();
          }
          if (state.isAuthenticated && state.currentUser?.role === 'user') {
            const alreadyLoaded = state.loadedJobs.some((j) => j.id === newJob.id);
            const alreadyPending = state.pendingLiveJobs.some((j) => j.id === newJob.id);
            if (!alreadyLoaded && !alreadyPending) {
              state.pendingLiveJobs.push(newJob);
              updateLiveScrollToast();
            }
          }
        } else if (msg.type === 'new_application' && state.currentUser?.role === 'recruiter') {
          loadRecruiterApplicants();
        } else if (msg.type === 'application_status_updated' && state.currentUser?.role === 'user') {
          if (state.currentTab === 'student-activity') loadStudentActivity();
        }
      } catch {}
    };
  } catch {}

  window.addEventListener('storage', (e) => {
    if (e.key === 'beep_latest_live_job' && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        const newJob = parsed?.job;
        if (newJob && state.isAuthenticated && state.currentUser?.role === 'user') {
          const alreadyLoaded = state.loadedJobs.some((j) => j.id === newJob.id);
          const alreadyPending = state.pendingLiveJobs.some((j) => j.id === newJob.id);
          if (!alreadyLoaded && !alreadyPending) {
            state.pendingLiveJobs.push(newJob);
            updateLiveScrollToast();
          }
        }
      } catch {}
    }
  });

  window.addEventListener(
    'scroll',
    () => {
      if (!state.isAuthenticated || state.currentTab !== 'explore') return;

      const currentY = window.scrollY;
      const scrolledDown = currentY > lastScrollY + 25;
      lastScrollY = currentY;

      if (scrolledDown && state.pendingLiveJobs.length > 0) {
        injectPendingLiveJobsOnScroll(false);
      }

      const sentinel = document.getElementById('infinite-scroll-sentinel');
      if (sentinel && !state.isLoadingMore && state.filters.page < state.totalPages) {
        const rect = sentinel.getBoundingClientRect();
        if (rect.top <= window.innerHeight + 280) {
          loadNextPageOnScroll();
        }
      }
    },
    { passive: true }
  );
}

function updateLiveScrollToast() {
  const toast = document.getElementById('live-scroll-toast');
  if (!toast) return;

  if (!state.isAuthenticated || state.currentUser?.role !== 'user' || state.pendingLiveJobs.length === 0) {
    toast.classList.add('hidden');
  } else {
    const latest = state.pendingLiveJobs[state.pendingLiveJobs.length - 1];
    setText(
      'live-scroll-toast-text',
      `⚡ New Job Posted: ${latest.title} at ${latest.company} — Click or scroll down to view!`
    );
    toast.classList.remove('hidden');
  }
}

async function onClickLiveJobToast() {
  if (state.currentUser?.role !== 'user') return;
  if (state.currentTab !== 'explore') {
    await switchTab('explore');
  }
  injectPendingLiveJobsOnScroll(true);
}

function injectPendingLiveJobsOnScroll(scrollToCard = false) {
  if (state.currentUser?.role !== 'user' || state.pendingLiveJobs.length === 0) return;
  const grid = document.getElementById('jobs-grid-container');
  if (!grid) return;

  const jobsToInject = [...state.pendingLiveJobs];
  state.pendingLiveJobs = [];
  updateLiveScrollToast();

  const cards = Array.from(grid.querySelectorAll('.job-card'));
  let anchorCard = null;
  if (!scrollToCard) {
    for (const c of cards) {
      const r = c.getBoundingClientRect();
      if (r.top >= 120 && r.top <= window.innerHeight - 80) {
        anchorCard = c;
        break;
      }
    }
  }

  let firstInsertedEl = null;
  for (const job of jobsToInject) {
    if (!scrollToCard && !jobMatchesCurrentFilters(job)) continue;
    if (!state.loadedJobs.some((existing) => existing.id === job.id)) {
      state.loadedJobs.unshift(job);
      state.totalFiltered += 1;
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = renderJobCard(job, false, true).trim();
    const cardEl = wrapper.firstElementChild;

    if (anchorCard && anchorCard.parentNode === grid) {
      grid.insertBefore(cardEl, anchorCard.nextSibling);
    } else {
      grid.prepend(cardEl);
    }
    if (!firstInsertedEl) firstInsertedEl = cardEl;
  }

  setText(
    'results-summary-text',
    `Showing ${state.totalFiltered} Fresher & Internship Jobs in India (Just Updated)`
  );

  if (scrollToCard && firstInsertedEl) {
    firstInsertedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

async function loadNextPageOnScroll() {
  if (state.isLoadingMore || state.filters.page >= state.totalPages) return;
  state.isLoadingMore = true;
  setText('infinite-scroll-sentinel', '⏳ Loading more jobs...');

  state.filters.page += 1;
  const params = new URLSearchParams({
    q: state.filters.q,
    role: state.filters.role,
    city: state.filters.city,
    job_type: state.filters.job_type,
    work_mode: state.filters.work_mode,
    sort: state.filters.sort,
    page: String(state.filters.page),
    limit: String(state.filters.limit),
    viewer_role: state.currentUser?.role || 'user'
  });

  try {
    const data = await apiGet(`/api/jobs?${params.toString()}`);
    const grid = document.getElementById('jobs-grid-container');
    if (grid && Array.isArray(data.items)) {
      for (const j of data.items) {
        if (!state.loadedJobs.some((existing) => existing.id === j.id)) {
          state.loadedJobs.push(j);
          const wrapper = document.createElement('div');
          wrapper.innerHTML = renderJobCard(j).trim();
          grid.appendChild(wrapper.firstElementChild);
        }
      }
    }
    renderPagination(data.page, data.total_pages, data.total_filtered);
  } finally {
    state.isLoadingMore = false;
    updateSentinelText();
  }
}

function updateSentinelText() {
  if (state.filters.page >= state.totalPages) {
    setText(
      'infinite-scroll-sentinel',
      `✓ You've seen all ${state.totalFiltered} matching jobs — New jobs posted by recruiters will appear automatically as you scroll!`
    );
  } else {
    setText(
      'infinite-scroll-sentinel',
      `↓ Scroll down to load more jobs (Showing ${state.loadedJobs.length} of ${state.totalFiltered}) ↓`
    );
  }
}

function showLoginScreen() {
  state.isAuthenticated = false;
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('app-shell').classList.add('hidden');
}

function selectLoginRole(role, preserveInputs = false) {
  state.selectedLoginRole = role;
  document.getElementById('ltab-user').classList.toggle('active', role === 'user');
  document.getElementById('ltab-recruiter').classList.toggle('active', role === 'recruiter');
  document.getElementById('ltab-admin').classList.toggle('active', role === 'admin');

  const emailInput = document.getElementById('login-page-email');
  const passInput = document.getElementById('login-page-password');
  const descBox = document.getElementById('login-role-desc');
  const submitBtn = document.getElementById('login-submit-btn');
  const errEl = document.getElementById('login-error-msg');
  if (errEl) errEl.classList.add('hidden');

  if (!preserveInputs) {
    emailInput.value = '';
    passInput.value = '';
  }

  const regRoleEl = document.getElementById('reg-role');
  if (regRoleEl && (role === 'user' || role === 'recruiter')) {
    regRoleEl.value = role;
    onChangeRegisterRole();
  }

  if (role === 'user') {
    descBox.innerHTML = `<strong>🎓 Student Account:</strong> Explore 300+ verified fresher & internship jobs across India, filter by role and city, save jobs to your shortlist, and apply directly.`;
    submitBtn.textContent = '🚀 Sign In as Student →';
  } else if (role === 'recruiter') {
    descBox.innerHTML = `<strong>💼 Recruiter Account:</strong> Post fresher jobs or internships with automatic AI tagging, and view full student applicant profiles, resumes & contact details on one page.`;
    submitBtn.textContent = '💼 Sign In as Recruiter →';
  } else {
    descBox.innerHTML = `<strong>🛡️ Admin Account:</strong> Sync daily job listings, review removed duplicates, check the 50-job accuracy report, and approve tag suggestions.`;
    submitBtn.textContent = '🛡️ Sign In as Admin →';
  }
}

function onChangeRegisterRole() {
  const regRoleEl = document.getElementById('reg-role');
  const labelEl = document.getElementById('reg-org-label');
  const inputEl = document.getElementById('reg-org');
  if (!regRoleEl || !labelEl || !inputEl) return;
  if (regRoleEl.value === 'recruiter') {
    labelEl.textContent = 'Company / Startup Name';
    inputEl.placeholder = 'e.g. TechNova AI / Beep';
  } else {
    labelEl.textContent = 'College / University';
    inputEl.placeholder = 'e.g. PICT Pune / COEP';
  }
}

function toggleRegisterMode() {
  const regForm = document.getElementById('main-register-form');
  const isHidden = regForm.classList.contains('hidden');
  regForm.classList.toggle('hidden', !isHidden);
  setText('toggle-reg-btn', isHidden ? '✕ Hide Sign Up' : '➕ Create New Account');
  const regErr = document.getElementById('register-error-msg');
  if (regErr) regErr.classList.add('hidden');
}

function openRegisterWithEmail(prefillEmail) {
  const regForm = document.getElementById('main-register-form');
  if (regForm && regForm.classList.contains('hidden')) {
    toggleRegisterMode();
  }
  const regEmail = document.getElementById('reg-email');
  const regName = document.getElementById('reg-name');
  const regRole = document.getElementById('reg-role');
  if (regEmail) regEmail.value = prefillEmail || '';
  if (regRole && (state.selectedLoginRole === 'user' || state.selectedLoginRole === 'recruiter')) {
    regRole.value = state.selectedLoginRole;
    onChangeRegisterRole();
  }
  if (regName) regName.focus();
}

async function switchRoleAndRetryLogin(targetRole) {
  selectLoginRole(targetRole, true);
  const fakeEvent = { preventDefault: () => {} };
  await submitLoginPage(fakeEvent);
}

async function submitLoginPage(e) {
  e.preventDefault();
  const email = document.getElementById('login-page-email').value.trim();
  const password = document.getElementById('login-page-password').value;
  const errEl = document.getElementById('login-error-msg');
  errEl.classList.add('hidden');

  if (!email) {
    errEl.innerHTML = `⚠️ Please enter your email address before signing in.`;
    errEl.classList.remove('hidden');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errEl.innerHTML = `⚠️ "${escapeHtml(email)}" is not a valid email format. Please enter a valid email (for example: name@college.edu).`;
    errEl.classList.remove('hidden');
    return;
  }
  if (!password) {
    errEl.innerHTML = `⚠️ Please enter your password to sign in.`;
    errEl.classList.remove('hidden');
    return;
  }

  const submitBtn = document.getElementById('login-submit-btn');
  const prevBtnText = submitBtn ? submitBtn.textContent : 'Sign In';
  if (submitBtn) submitBtn.textContent = '⏳ Signing in...';

  const { ok, data } = await apiPost('/api/auth/login', {
    email,
    password,
    selected_role: state.selectedLoginRole,
    client_profiles: getLocalRegisteredProfiles()
  });

  if (submitBtn) submitBtn.textContent = prevBtnText;

  if (!ok) {
    if (data.code === 'ACCOUNT_NOT_FOUND') {
      errEl.innerHTML = `
        <div>⚠️ ${escapeHtml(data.error)}</div>
        ${
          state.selectedLoginRole !== 'admin'
            ? `<button type="button" class="btn-ig-yellow" style="margin-top:8px; padding:6px 12px; font-size:0.76rem;" onclick="openRegisterWithEmail('${escapeHtml(email)}')">➕ Create New Account with ${escapeHtml(email)} →</button>`
            : ''
        }
      `;
    } else if (data.code === 'ROLE_MISMATCH' && data.actual_role) {
      const roleLabels = { user: '🎓 Student', recruiter: '💼 Recruiter', admin: '🛡️ Admin' };
      errEl.innerHTML = `
        <div>⚠️ ${escapeHtml(data.error)}</div>
        <button type="button" class="btn-ig-yellow" style="margin-top:8px; padding:6px 12px; font-size:0.76rem;" onclick="switchRoleAndRetryLogin('${escapeHtml(data.actual_role)}')">Switch to ${roleLabels[data.actual_role] || data.actual_role} Tab & Sign In →</button>
      `;
    } else {
      errEl.innerHTML = `⚠️ ${escapeHtml(data.error || 'Unable to sign in. Please check your email and password.')}`;
    }
    errEl.classList.remove('hidden');
    return;
  }

  showFeedbackToast(`✅ Welcome back, ${data.user.name.split('(')[0].trim()}!`);
  await enterPortalWithUser(data.user);
}

async function submitRegisterPage(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const role = document.getElementById('reg-role').value;
  const orgEl = document.getElementById('reg-org');
  const orgValue = orgEl ? orgEl.value.trim() : '';
  const errEl = document.getElementById('register-error-msg') || document.getElementById('login-error-msg');
  errEl.classList.add('hidden');

  if (!name || name.length < 2) {
    errEl.innerHTML = `⚠️ Please enter your full name (at least 2 characters).`;
    errEl.classList.remove('hidden');
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errEl.innerHTML = `⚠️ Please enter a valid email address (for example: rohan@college.edu).`;
    errEl.classList.remove('hidden');
    return;
  }
  if (!password || password.length < 6) {
    errEl.innerHTML = `⚠️ Password must be at least 6 characters long.`;
    errEl.classList.remove('hidden');
    return;
  }

  const { ok, data } = await apiPost('/api/auth/register', {
    name,
    email,
    password,
    role,
    college: role === 'user' ? orgValue : undefined,
    company: role === 'recruiter' ? orgValue : undefined,
    client_profiles: getLocalRegisteredProfiles()
  });
  if (!ok) {
    errEl.innerHTML = `⚠️ ${escapeHtml(data.error || 'Registration failed. Please check your details.')}`;
    errEl.classList.remove('hidden');
    return;
  }

  if (data.profile_record) {
    saveLocalRegisteredProfile(data.profile_record);
  }
  showFeedbackToast(`🎉 Account created! Welcome to Beep, ${data.user.name}!`);
  await enterPortalWithUser(data.user);
}

async function enterPortalWithUser(user, isReload = false) {
  state.isAuthenticated = true;
  state.currentUser = user;
  localStorage.setItem('beep_logged_user', JSON.stringify(user));
  sessionStorage.setItem('beep_logged_user', JSON.stringify(user));

  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');

  const recCompEl = document.getElementById('rec-company');
  if (recCompEl && user.role === 'recruiter') {
    recCompEl.value = user.company || 'Beep Careers';
  }
  const applyCollegeEl = document.getElementById('apply-college');
  if (applyCollegeEl && user.role === 'user' && user.college) {
    applyCollegeEl.value = user.college;
  }

  applyRoleLayout(user.role);
  await loadSavedJobs();
  await loadUserApplicationsList();

  const validTabsByRole = {
    user: ['explore', 'student-saved', 'student-activity'],
    recruiter: ['recruiter-post', 'recruiter-applicants', 'recruiter-manage', 'explore'],
    admin: ['admin-pipeline', 'admin-eval', 'admin-moderation', 'admin-docs', 'explore']
  };
  const defaultTabByRole = {
    user: 'explore',
    recruiter: 'recruiter-post',
    admin: 'admin-pipeline'
  };

  const savedTab = localStorage.getItem(`beep_active_tab_${user.role}`);
  const allowedTabs = validTabsByRole[user.role] || validTabsByRole.user;
  const targetTab = isReload && savedTab && allowedTabs.includes(savedTab)
    ? savedTab
    : defaultTabByRole[user.role] || 'explore';

  if (user.role === 'recruiter') {
    await loadRecruiterApplicants();
  }
  await switchTab(targetTab);
}

function logoutToLoginPage() {
  localStorage.removeItem('beep_logged_user');
  sessionStorage.removeItem('beep_logged_user');
  showLoginScreen();
}

function goHomeForRole() {
  const role = state.currentUser.role;
  if (role === 'recruiter') switchTab('recruiter-post');
  else if (role === 'admin') switchTab('admin-pipeline');
  else switchTab('explore');
}

function applyRoleLayout(role) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.user;
  document.body.setAttribute('data-active-role', role);
  if (role !== 'user') {
    state.pendingLiveJobs = [];
  }
  updateLiveScrollToast();

  document.getElementById('nav-for-user').classList.toggle('hidden', role !== 'user');
  document.getElementById('nav-for-recruiter').classList.toggle('hidden', role !== 'recruiter');
  document.getElementById('nav-for-admin').classList.toggle('hidden', role !== 'admin');

  const pillEl = document.getElementById('header-portal-pill');
  pillEl.textContent = cfg.pillText;
  pillEl.style.background = cfg.pillBg;
  pillEl.style.color = cfg.pillColor;

  setText('header-portal-sub', cfg.subText);

  const shortName = state.currentUser.name.split('(')[0].trim();
  setText('logged-in-user-pill', `${cfg.userIcon} ${shortName} (${cfg.userLabel})`);
  setText('student-profile-name', shortName);

  renderMarqueeTrack('app-marquee-track', cfg.tickerBadge, cfg.tickerRight);
  renderRoleHero(role);
}

async function loadMeta() {
  const data = await apiGet('/api/meta');
  state.meta = data;
  state.rolesTaxonomy = data.roles_taxonomy || [];
  state.citiesTaxonomy = data.cities_taxonomy || [];

  const totalUnique = data.total_unique_jobs || 300;
  setText('nav-jobs-count', totalUnique);
  setText('nav-jobs-count-rec', totalUnique);

  renderMarqueeTrack(
    'login-marquee-track',
    'SHARK TANK INDIA',
    'Refreshed Every Morning · Smart AI Role & City Matching'
  );
  if (state.isAuthenticated) {
    const cfg = ROLE_CONFIG[state.currentUser.role] || ROLE_CONFIG.user;
    renderMarqueeTrack('app-marquee-track', cfg.tickerBadge, cfg.tickerRight);
  }

  if (data.meta?.last_refresh_at) {
    setText('last-refresh-label', `Last refreshed ${timeAgo(data.meta.last_refresh_at)}`);
  }

  const roleSel = document.getElementById('report-role-select');
  const citySel = document.getElementById('report-city-select');
  if (roleSel && state.rolesTaxonomy.length) {
    roleSel.innerHTML = state.rolesTaxonomy.map((r) => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('');
  }
  if (citySel && state.citiesTaxonomy.length) {
    citySel.innerHTML = state.citiesTaxonomy.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  }
}

async function loadSavedJobs() {
  const data = await apiGet(`/api/user/saved?user_id=${state.currentUser.id}`);
  state.savedJobIds = data.saved_ids || [];
  const count = state.savedJobIds.length;
  setText('nav-saved-count', count);
  setText('student-saved-kpi', count);

  const grid = document.getElementById('saved-jobs-grid');
  if (grid) {
    if (!data.jobs || data.jobs.length === 0) {
      grid.innerHTML = `<div style="padding:20px; font-weight:700; color:#555;">No saved jobs yet. Click the ⭐ button on any job card to save it here!</div>`;
    } else {
      grid.innerHTML = data.jobs.map((j) => renderJobCard(j)).join('');
    }
  }
}

async function loadUserApplicationsList() {
  const data = await apiGet(`/api/user/applications?email=${encodeURIComponent(state.currentUser.email || 'student@eventbeep.com')}`);
  const apps = data.applications || [];
  state.appliedJobIds = apps.map((a) => a.job_id);
  state.appliedCount = apps.length;
  setText('nav-applied-count', apps.length);
  setText('student-applied-kpi', apps.length);
  return apps;
}

async function loadStudentActivity() {
  await loadSavedJobs();
  const [apps, overview] = await Promise.all([
    loadUserApplicationsList(),
    apiGet('/api/admin/overview')
  ]);

  const appTbody = document.getElementById('student-applications-tbody');
  if (appTbody) {
    if (apps.length === 0) {
      appTbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:18px; color:#555;">You haven't submitted any direct applications yet. Click <strong>⚡ Apply on Beep</strong> on any job card!</td></tr>`;
    } else {
      appTbody.innerHTML = apps
        .map(
          (a) => `
        <tr>
          <td><strong>${escapeHtml(a.job_title)}</strong><br/><span style="color:#555;">${escapeHtml(a.company)}</span></td>
          <td>📍 ${escapeHtml(a.city)}</td>
          <td>
            ${escapeHtml(a.college)} (${escapeHtml(a.graduation_year)})<br/>
            <span style="font-size:0.75rem; color:#555;">📞 ${escapeHtml(a.student_phone)} · <a href="${escapeHtml(a.resume_url)}" target="_blank">Resume/Portfolio ↗</a></span>
          </td>
          <td>${timeAgo(a.applied_at)}</td>
          <td><span class="badge-ok">${escapeHtml(a.status)}</span></td>
        </tr>
      `
        )
        .join('');
    }
  }

  const allCorrections = overview.tag_corrections || [];
  const myCorrections = allCorrections.filter((c) => c.by_user_id === state.currentUser.id);
  setText('student-corrections-kpi', myCorrections.length);

  const tbody = document.getElementById('student-corrections-tbody');
  if (tbody) {
    if (myCorrections.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:18px; color:#555;">You haven't suggested any tag edits yet. Click <strong>🛠️ Suggest Edit</strong> on any job card if you spot a Role or City tag that could be improved!</td></tr>`;
    } else {
      tbody.innerHTML = myCorrections
        .map(
          (c) => `
        <tr>
          <td><strong>${escapeHtml(c.job_title)}</strong><br/><span style="color:#555;">${escapeHtml(c.company)}</span></td>
          <td>${escapeHtml(c.previous_role)} · 📍 ${escapeHtml(c.previous_city)}</td>
          <td><strong style="color:#065F46;">${escapeHtml(c.corrected_role)} · 📍 ${escapeHtml(c.corrected_city)}</strong></td>
          <td>${escapeHtml(c.reason)}</td>
          <td><span class="badge-ok">${escapeHtml(c.status === 'pending' ? 'Under Review' : c.status === 'applied' ? 'Approved' : 'Reviewed')}</span></td>
        </tr>
      `
        )
        .join('');
    }
  }
}

async function loadJobs() {
  const params = new URLSearchParams({
    q: state.filters.q,
    role: state.filters.role,
    city: state.filters.city,
    job_type: state.filters.job_type,
    work_mode: state.filters.work_mode,
    sort: state.filters.sort,
    page: String(state.filters.page),
    limit: String(state.filters.limit),
    viewer_role: state.currentUser?.role || 'user'
  });

  const data = await apiGet(`/api/jobs?${params.toString()}`);

  state.loadedJobs = data.items || [];
  state.totalPages = data.total_pages || 1;
  state.totalFiltered = data.total_filtered || 0;

  renderFilterChips(data.facets, data.total_all_jobs);

  setText(
    'results-summary-text',
    `Showing ${data.total_filtered} of ${data.total_all_jobs} Fresher & Internship Jobs in India`
  );

  const grid = document.getElementById('jobs-grid-container');
  if (!data.items || data.items.length === 0) {
    grid.innerHTML = `
      <div class="section-card" style="grid-column: 1 / -1; text-align:center;">
        <h3 style="font-family:var(--font-display); font-weight:900;">No matching fresher jobs found</h3>
        <p style="margin:8px 0 14px; color:#555;">Try clearing a filter or searching a broader skill or city.</p>
        <button class="btn-ig-yellow" onclick="resetAllFilters()">Reset All Filters</button>
      </div>
    `;
  } else {
    grid.innerHTML = data.items.map((j) => renderJobCard(j)).join('');
  }

  updateSentinelText();
  renderPagination(data.page, data.total_pages, data.total_filtered);
}

function renderFilterChips(facets, totalAll) {
  const roleContainer = document.getElementById('role-chips-container');
  const cityContainer = document.getElementById('city-chips-container');

  const allRoleActive = state.filters.role === 'All' ? 'active' : '';
  let roleHtml = `<button class="filter-chip ${allRoleActive}" onclick="selectRoleFilter('All')">All Roles <span class="chip-num">(${totalAll})</span></button>`;
  for (const r of state.rolesTaxonomy) {
    const count = facets?.roles?.[r] || 0;
    if (count === 0) continue;
    const isAct = state.filters.role === r ? 'active' : '';
    roleHtml += `<button class="filter-chip ${isAct}" onclick="selectRoleFilter('${escapeHtml(r)}')">${escapeHtml(r)} <span class="chip-num">(${count})</span></button>`;
  }
  roleContainer.innerHTML = roleHtml;

  const allCityActive = state.filters.city === 'All' ? 'active' : '';
  let cityHtml = `<button class="filter-chip ${allCityActive}" onclick="selectCityFilter('All')">All Cities <span class="chip-num">(${totalAll})</span></button>`;
  for (const c of state.citiesTaxonomy) {
    const count = facets?.cities?.[c] || 0;
    if (count === 0) continue;
    const isAct = state.filters.city === c ? 'active' : '';
    cityHtml += `<button class="filter-chip ${isAct}" onclick="selectCityFilter('${escapeHtml(c)}')">📍 ${escapeHtml(c)} <span class="chip-num">(${count})</span></button>`;
  }
  cityContainer.innerHTML = cityHtml;
}

function formatSourceLabel(rawSource) {
  return String(rawSource || 'Verified Board')
    .replace('Greenhouse API', 'Official Careers')
    .replace('Public API', 'Careers Feed')
    .replace('EventBeep Direct Recruiter', 'Posted Directly on Beep');
}

function renderJobCard(job, isRecruiterManage = false, isLiveInjected = false) {
  const isSaved = state.savedJobIds.includes(job.id);
  const hasApplied = state.appliedJobIds.includes(job.id);
  const isDirectBeepJob = job.source === 'EventBeep Direct Recruiter' || job.has_external_url === false;
  const role = state.currentUser.role;
  const initials = (job.company || 'B')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const confPct = Math.round((job.confidence || 0.94) * 100);
  const safeTitle = escapeHtml(job.title).replace(/'/g, "\\'");
  const safeComp = escapeHtml(job.company).replace(/'/g, "\\'");

  let actionButtonsHtml = '';
  if (role === 'admin') {
    actionButtonsHtml = `
      <button class="btn-flag-tag" onclick="openReportModal(${job.id}, '${safeTitle}', '${safeComp}', '${escapeHtml(job.role_tag)}', '${escapeHtml(job.city)}')">
        ✏️ Edit Tag
      </button>
      <button class="btn-flag-tag" style="color:#991B1B; border-color:#FCA5A5;" onclick="deleteJobListing(${job.id})">
        🗑️ Remove
      </button>
      <a href="${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer" class="btn-apply">
        Open Link ↗
      </a>
    `;
  } else if (role === 'recruiter' || isRecruiterManage) {
    const views = job.views_count ?? 0;
    const applies = job.apply_clicks ?? 0;
    actionButtonsHtml = `
      <span class="meta-item" style="font-size:0.72rem;">👁️ ${views} ${views === 1 ? 'view' : 'views'} · 👥 ${applies} ${applies === 1 ? 'apply' : 'applies'}</span>
      <button class="btn-apply" onclick="filterRecruiterApplicants(${job.id})">👥 View Applicants</button>
      ${
        isRecruiterManage
          ? `<button class="btn-flag-tag" style="color:#991B1B; border-color:#FCA5A5;" onclick="deleteJobListing(${job.id})">🗑️ Close</button>`
          : ''
      }
    `;
  } else {
    const applyBtn = hasApplied
      ? `<button class="btn-apply" style="background:#10B981; color:#0F0F12; border-color:#0F0F12;" onclick="switchTab('student-activity')">✓ Applied on Beep</button>`
      : isDirectBeepJob
      ? `<button class="btn-apply" onclick="openApplyModal(${job.id}, '${safeTitle}', '${safeComp}', '${escapeHtml(job.city)}')">⚡ Apply on Beep →</button>`
      : `<button class="btn-flag-tag" style="background:#FFFBE6; border-color:#171722; color:#171722;" onclick="openApplyModal(${job.id}, '${safeTitle}', '${safeComp}', '${escapeHtml(job.city)}')">⚡ Quick Apply</button>
         <a href="${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer" class="btn-apply" onclick="trackJobClick(${job.id})">Apply on Site ↗</a>`;

    actionButtonsHtml = `
      <button class="btn-flag-tag" onclick="openReportModal(${job.id}, '${safeTitle}', '${safeComp}', '${escapeHtml(job.role_tag)}', '${escapeHtml(job.city)}')" title="Suggest a better role or city tag">
        🛠️ Suggest Edit
      </button>
      ${applyBtn}
    `;
  }

  return `
    <article class="job-card ${isLiveInjected ? 'live-injected' : ''}">
      <div>
        ${
          isLiveInjected
            ? `<div class="live-new-ribbon">⚡ NEW · JUST POSTED BY RECRUITER</div>`
            : ''
        }
        <div class="job-card-header">
          <div class="company-avatar">${escapeHtml(initials)}</div>
          <div class="job-head-info">
            <div class="job-company-line">
              <span>${escapeHtml(job.company)}</span>
              <span>•</span>
              <span style="color:#666;">${timeAgo(job.posted_at)}</span>
            </div>
            <h3 class="job-title">${escapeHtml(job.title)}</h3>
          </div>
          ${
            role === 'user'
              ? `<button class="save-btn ${isSaved ? 'saved' : ''}" onclick="toggleSaveJob(${job.id})" title="Save Job">
                  ${isSaved ? '⭐' : '☆'}
                 </button>`
              : ''
          }
        </div>

        <div class="ai-tags-bar" title="${escapeHtml(job.llm_reasoning || '')}">
          <span class="tag-role-yellow">💼 ${escapeHtml(job.role_tag)}</span>
          <span class="tag-city-dark">📍 ${escapeHtml(job.city)}</span>
          ${role === 'admin' ? `<span class="tag-conf">${confPct}% Match</span>` : ''}
        </div>

        <div class="job-meta-grid">
          <span class="meta-item">💰 ${escapeHtml(job.stipend_or_salary)}</span>
          <span class="meta-item">🎓 ${escapeHtml(job.job_type)}</span>
          <span class="meta-item">🏢 ${escapeHtml(job.work_mode)}</span>
        </div>

        <p class="job-desc-snippet">${escapeHtml(job.description)}</p>

        <div class="skills-row">
          ${(job.skills || []).map((s) => `<span class="skill-pill">${escapeHtml(s)}</span>`).join('')}
        </div>
      </div>

      <div class="job-card-footer">
        <span class="source-badge">
          🔗 ${escapeHtml(formatSourceLabel(job.source))}
        </span>
        <div class="card-actions">
          ${actionButtonsHtml}
        </div>
      </div>
    </article>
  `;
}

function renderPagination(page, totalPages, totalFiltered) {
  const container = document.getElementById('pagination-container');
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }
  container.innerHTML = `
    <button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="goToPage(${page - 1})">← Previous</button>
    <span style="font-family:var(--font-mono); font-weight:700; font-size:0.85rem;">
      Page ${page} of ${totalPages} (${totalFiltered} jobs)
    </span>
    <button class="page-btn" ${page >= totalPages ? 'disabled' : ''} onclick="goToPage(${page + 1})">Next →</button>
  `;
}

function saveFiltersState() {
  try {
    localStorage.setItem('beep_explore_filters', JSON.stringify(state.filters));
  } catch {}
}

function selectRoleFilter(role) {
  if (state.currentTab !== 'explore') switchTab('explore');
  state.filters.role = role;
  state.filters.page = 1;
  saveFiltersState();
  loadJobs();
}

function selectCityFilter(city) {
  if (state.currentTab !== 'explore') switchTab('explore');
  state.filters.city = city;
  state.filters.page = 1;
  saveFiltersState();
  loadJobs();
}

function onSearchFilterChange() {
  state.filters.q = document.getElementById('search-q').value;
  state.filters.job_type = document.getElementById('filter-job-type').value;
  state.filters.work_mode = document.getElementById('filter-work-mode').value;
  state.filters.sort = document.getElementById('filter-sort').value;
  state.filters.page = 1;
  saveFiltersState();

  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    loadJobs();
  }, 150);
}

function resetAllFilters() {
  document.getElementById('search-q').value = '';
  document.getElementById('filter-job-type').value = 'All';
  document.getElementById('filter-work-mode').value = 'All';
  document.getElementById('filter-sort').value = 'newest';
  state.filters = {
    q: '',
    role: 'All',
    city: 'All',
    job_type: 'All',
    work_mode: 'All',
    sort: 'newest',
    page: 1,
    limit: 24
  };
  saveFiltersState();
  loadJobs();
}

function goToPage(p) {
  state.filters.page = p;
  saveFiltersState();
  loadJobs();
  window.scrollTo({ top: 320, behavior: 'smooth' });
}

async function toggleSaveJob(jobId) {
  await apiPost('/api/user/saved', { user_id: state.currentUser.id, job_id: jobId });
  await loadSavedJobs();
  await loadJobs();
}

async function trackJobClick(jobId) {
  state.appliedCount += 1;
  setText('nav-applied-count', state.appliedCount);
  setText('student-applied-kpi', state.appliedCount);
  apiPost(`/api/jobs/${jobId}/click`).catch(() => {});
}

function openApplyModal(jobId, title, company, city) {
  document.getElementById('apply-job-id').value = jobId;
  setText(
    'apply-modal-job-label',
    `Applying for ${title} at ${company} (${city}) — Your profile & contact details will be shared directly with the recruiter.`
  );
  const shortName = state.currentUser.name.split('(')[0].trim();
  document.getElementById('apply-name').value = shortName;
  document.getElementById('apply-email').value = state.currentUser.email || 'student@eventbeep.com';
  if (state.currentUser.college) {
    document.getElementById('apply-college').value = state.currentUser.college;
  }
  const applyErr = document.getElementById('apply-error-msg');
  if (applyErr) applyErr.classList.add('hidden');
  document.getElementById('apply-modal').classList.add('open');
}

function closeApplyModal() {
  document.getElementById('apply-modal').classList.remove('open');
}

async function submitDirectApplication(e) {
  e.preventDefault();
  const jobId = Number(document.getElementById('apply-job-id').value);
  const errEl = document.getElementById('apply-error-msg');
  if (errEl) errEl.classList.add('hidden');

  const payload = {
    student_id: state.currentUser.id,
    student_name: document.getElementById('apply-name').value.trim(),
    student_email: document.getElementById('apply-email').value.trim(),
    student_phone: document.getElementById('apply-phone').value.trim(),
    graduation_year: document.getElementById('apply-grad-year').value.trim(),
    college: document.getElementById('apply-college').value.trim(),
    resume_url: document.getElementById('apply-resume').value.trim(),
    skills: document.getElementById('apply-skills').value,
    cover_note: document.getElementById('apply-note').value.trim()
  };

  if (!payload.student_name || payload.student_name.length < 2) {
    if (errEl) {
      errEl.textContent = '⚠️ Please enter your full name (at least 2 characters).';
      errEl.classList.remove('hidden');
    }
    return;
  }
  if (!payload.student_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.student_email)) {
    if (errEl) {
      errEl.textContent = '⚠️ Please enter a valid email address so the recruiter can contact you.';
      errEl.classList.remove('hidden');
    }
    return;
  }
  if (payload.student_phone.replace(/[^0-9]/g, '').length < 10) {
    if (errEl) {
      errEl.textContent = '⚠️ Please enter a valid 10-digit mobile / WhatsApp number.';
      errEl.classList.remove('hidden');
    }
    return;
  }
  if (payload.resume_url && !/^https?:\/\/.+/i.test(payload.resume_url)) {
    if (errEl) {
      errEl.textContent = '⚠️ Please enter a valid Resume, Portfolio, or GitHub link starting with https:// or http://';
      errEl.classList.remove('hidden');
    }
    return;
  }

  const { ok, data } = await apiPost(`/api/jobs/${jobId}/apply`, payload);
  if (!ok) {
    if (errEl) {
      errEl.textContent = `⚠️ ${data.error || 'Could not submit application. Please check your details.'}`;
      errEl.classList.remove('hidden');
    }
    return;
  }

  closeApplyModal();
  showFeedbackToast('🚀 Application submitted! The recruiter can now view your profile & contact details.');
  await loadUserApplicationsList();
  await loadJobs();
  if (state.currentTab === 'student-saved') await loadSavedJobs();
}

async function switchTab(tabName) {
  state.currentTab = tabName;
  if (state.currentUser?.role) {
    try {
      localStorage.setItem(`beep_active_tab_${state.currentUser.role}`, tabName);
    } catch {}
  }

  const activeNavId =
    state.currentUser.role === 'admin'
      ? 'nav-for-admin'
      : state.currentUser.role === 'recruiter'
      ? 'nav-for-recruiter'
      : 'nav-for-user';

  document.querySelectorAll(`#${activeNavId} .nav-tab`).forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
  });

  const allViews = [
    'explore',
    'student-saved',
    'student-activity',
    'recruiter-post',
    'recruiter-manage',
    'recruiter-applicants',
    'admin-pipeline',
    'admin-eval',
    'admin-moderation',
    'admin-docs'
  ];

  for (const v of allViews) {
    const el = document.getElementById(`view-${v}`);
    if (el) el.classList.toggle('hidden', v !== tabName);
  }

  if (tabName === 'explore') {
    await loadJobs();
  } else if (tabName === 'student-saved') {
    await loadSavedJobs();
  } else if (tabName === 'student-activity') {
    await loadStudentActivity();
  } else if (tabName === 'recruiter-manage') {
    await loadRecruiterJobs();
  } else if (tabName === 'recruiter-applicants') {
    await loadRecruiterApplicants();
  } else if (tabName === 'admin-pipeline' || tabName === 'admin-moderation') {
    await loadAdminOverview();
  } else if (tabName === 'admin-eval') {
    await loadEvalView();
  }
}

async function previewLlmTagging() {
  const title = document.getElementById('rec-title').value.trim();
  const company = document.getElementById('rec-company').value.trim();
  const location_raw = document.getElementById('rec-location').value.trim();
  const description = document.getElementById('rec-desc').value.trim();

  const box = document.getElementById('rec-llm-preview-box');
  box.classList.remove('hidden');

  if (!title || title.length < 2) {
    box.innerHTML = `<div style="color:#991B1B; font-weight:800;">⚠️ Please enter a Job Title first (at least 2 characters) so AI can suggest the right Role and City.</div>`;
    return;
  }
  if (!location_raw) {
    box.innerHTML = `<div style="color:#991B1B; font-weight:800;">⚠️ Please enter a Location (for example: Baner, Pune or Remote) to preview city normalization.</div>`;
    return;
  }

  box.innerHTML = `<strong>✨ Analyzing your job details to suggest the best Role and City...</strong>`;

  const { data } = await apiPost('/api/tag', { title, company, location_raw, description });
  if (data.error) {
    box.innerHTML = `<div style="color:#991B1B; font-weight:800;">⚠️ ${escapeHtml(data.error)}</div>`;
    return;
  }

  box.innerHTML = `
    <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
      <div>
        <div style="font-family:var(--font-mono); font-size:0.72rem; font-weight:700; text-transform:uppercase; color:#555;">
          ✨ AI SUGGESTED TAGS FOR YOUR JOB POST
        </div>
        <div style="margin-top:6px; display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
          <span class="tag-role-yellow">💼 Role: ${escapeHtml(data.role_tag)}</span>
          <span class="tag-city-dark">📍 City: ${escapeHtml(data.city)}</span>
          <span class="tag-conf">✓ ${Math.round((data.confidence || 0.95) * 100)}% Match Confidence</span>
        </div>
        <div style="font-size:0.84rem; margin-top:7px; color:#333;">
          <strong>Why this match:</strong> ${escapeHtml(data.reasoning)}
        </div>
      </div>
    </div>
  `;
}

async function submitRecruiterJob(e) {
  e.preventDefault();
  const urlField = document.getElementById('rec-url');
  const payload = {
    title: document.getElementById('rec-title').value.trim(),
    company: document.getElementById('rec-company').value.trim(),
    location_raw: document.getElementById('rec-location').value.trim(),
    stipend_or_salary: document.getElementById('rec-stipend').value.trim(),
    job_type: document.getElementById('rec-type').value,
    skills: document.getElementById('rec-skills').value,
    url: urlField ? urlField.value.trim() : '',
    description: document.getElementById('rec-desc').value.trim(),
    posted_by: state.currentUser?.id || 2
  };

  const box = document.getElementById('rec-llm-preview-box');
  box.classList.remove('hidden');

  if (!payload.title || payload.title.length < 3) {
    box.innerHTML = `<div style="color:#991B1B; font-weight:800;">⚠️ Please enter a clear Job Title (at least 3 characters) before publishing.</div>`;
    return;
  }
  if (/\b(senior|sr\.?|principal|staff|director|vp|vice president|head of|chief)\b/i.test(payload.title)) {
    box.innerHTML = `<div style="color:#991B1B; font-weight:800;">⚠️ Beep is exclusively for Fresher (0–1 yr) and College Internship roles. Senior, Principal, Staff, Director, and VP roles are not allowed.</div>`;
    return;
  }
  if (!payload.company || payload.company.length < 2) {
    box.innerHTML = `<div style="color:#991B1B; font-weight:800;">⚠️ Please enter your Company or Startup name before publishing.</div>`;
    return;
  }
  if (!payload.location_raw || payload.location_raw.length < 2) {
    box.innerHTML = `<div style="color:#991B1B; font-weight:800;">⚠️ Please enter the job City or Location (for example: Baner, Pune or Remote).</div>`;
    return;
  }
  if (payload.url && !/^https?:\/\/.+/i.test(payload.url)) {
    box.innerHTML = `<div style="color:#991B1B; font-weight:800;">⚠️ Career Page Link must start with https:// or http:// (or leave it blank to collect student applications directly on Beep).</div>`;
    return;
  }

  box.innerHTML = `<strong>🚀 Checking for duplicates & publishing your job...</strong>`;

  const { ok, data } = await apiPost('/api/recruiter/jobs', payload);

  if (!ok) {
    box.innerHTML = `
      <div style="color:#991B1B; font-weight:800;">
        ⚠️ ${escapeHtml(data.error || 'Could not publish job. Please check your details.')}
      </div>
    `;
    return;
  }

  box.innerHTML = `
    <div style="color:#065F46; font-weight:800; display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
      <span>✅ Your job is now live! Tagged as</span>
      <span class="tag-role-yellow">💼 ${escapeHtml(data.job.role_tag)}</span>
      <span class="tag-city-dark">📍 ${escapeHtml(data.job.city)}</span>
      <button class="btn-ig-blue" style="padding:6px 14px; font-size:0.78rem;" onclick="switchTab('recruiter-manage')">View My Posted Jobs →</button>
    </div>
  `;
  try {
    localStorage.setItem('beep_latest_live_job', JSON.stringify({ job: data.job, ts: Date.now() }));
  } catch {}
  await loadMeta();
  await loadRecruiterJobs();
}

async function loadRecruiterJobs() {
  const data = await apiGet('/api/recruiter/jobs');
  const jobs = data.jobs || [];
  setText('nav-recruiter-count', jobs.length);

  const totalViews = jobs.reduce((sum, j) => sum + (j.views_count || 0), 0);
  const totalClicks = jobs.reduce((sum, j) => sum + (j.apply_clicks || 0), 0);
  const kpiGrid = document.getElementById('recruiter-kpi-grid');
  if (kpiGrid) {
    kpiGrid.innerHTML =
      renderKpiBox('MY ACTIVE JOBS', jobs.length, 'Live on the Student Job Board', 'kpi-yellow') +
      renderKpiBox('STUDENT VIEWS', totalViews, 'Total views from students') +
      renderKpiBox(
        'TOTAL APPLICATIONS',
        totalClicks,
        `Application rate: ${totalViews ? Math.round((totalClicks / totalViews) * 100) : 18}%`,
        'kpi-dark'
      );
  }

  const grid = document.getElementById('recruiter-jobs-grid');
  if (!jobs.length) {
    grid.innerHTML = `<p>You haven't posted any jobs yet.</p>`;
    return;
  }
  grid.innerHTML = jobs.map((j) => renderJobCard(j, true)).join('');
}

function filterRecruiterApplicants(jobId) {
  state.recruiterApplicantJobFilter = Number(jobId || 0);
  switchTab('recruiter-applicants');
}

async function loadRecruiterApplicants() {
  const url = state.recruiterApplicantJobFilter
    ? `/api/recruiter/applications?job_id=${state.recruiterApplicantJobFilter}`
    : '/api/recruiter/applications';
  const data = await apiGet(url);
  const apps = data.applications || [];

  const allData = state.recruiterApplicantJobFilter ? await apiGet('/api/recruiter/applications') : data;
  const allApps = allData.applications || [];
  setText('nav-applicants-count', allApps.length);

  const shortlistedCount = allApps.filter((a) => a.status === 'Shortlisted' || a.status === 'Interview Scheduled' || a.status === 'Hired').length;
  const kpiGrid = document.getElementById('recruiter-app-kpi-grid');
  if (kpiGrid) {
    kpiGrid.innerHTML =
      renderKpiBox('TOTAL APPLICANTS', allApps.length, 'Students applied directly on Beep', 'kpi-yellow') +
      renderKpiBox('SHORTLISTED / INTERVIEW', shortlistedCount, 'Ready to contact via phone or email') +
      renderKpiBox('DIRECT CONTACT ACCESS', '100%', 'Email, Phone/WhatsApp & Resume included', 'kpi-dark');
  }

  const grid = document.getElementById('recruiter-applicants-grid');
  if (!grid) return;

  if (apps.length === 0) {
    grid.innerHTML = `<div style="padding:20px; font-weight:700; color:#555;">No student applications found for this filter yet.</div>`;
    return;
  }

  const statuses = ['Under Review', 'Shortlisted', 'Interview Scheduled', 'Hired', 'Not Selected'];

  grid.innerHTML = apps
    .map((a) => {
      const initials = (a.student_name || 'S')
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      const cleanPhone = String(a.student_phone || '').replace(/[^0-9]/g, '');
      const statusOptions = statuses
        .map((st) => `<option value="${escapeHtml(st)}" ${st === a.status ? 'selected' : ''}>${escapeHtml(st)}</option>`)
        .join('');

      return `
        <article class="job-card">
          <div>
            <div class="job-card-header">
              <div class="company-avatar">${escapeHtml(initials)}</div>
              <div class="job-head-info">
                <div class="job-company-line">
                  <span>🎓 ${escapeHtml(a.college)} (${escapeHtml(a.graduation_year)} Batch)</span>
                  <span>•</span>
                  <span style="color:#666;">Applied ${timeAgo(a.applied_at)}</span>
                </div>
                <h3 class="job-title">${escapeHtml(a.student_name)}</h3>
              </div>
              <span class="badge-ok">${escapeHtml(a.status)}</span>
            </div>

            <div class="ai-tags-bar">
              <span class="tag-role-yellow">Applied For: ${escapeHtml(a.job_title)}</span>
              <span class="tag-city-dark">📍 ${escapeHtml(a.city)}</span>
            </div>

            <div class="job-meta-grid">
              <a href="mailto:${escapeHtml(a.student_email)}" class="meta-item" style="text-decoration:none; color:#171722;">
                ✉️ ${escapeHtml(a.student_email)}
              </a>
              <a href="tel:${escapeHtml(a.student_phone)}" class="meta-item" style="text-decoration:none; color:#171722;">
                📞 ${escapeHtml(a.student_phone)}
              </a>
              <a href="https://wa.me/${escapeHtml(cleanPhone)}" target="_blank" rel="noopener noreferrer" class="meta-item" style="text-decoration:none; background:#D1FAE5; color:#065F46;">
                💬 WhatsApp Student
              </a>
            </div>

            <p class="job-desc-snippet" style="-webkit-line-clamp:3;">
              <strong>Candidate Note:</strong> "${escapeHtml(a.cover_note)}"
            </p>

            <div class="skills-row">
              ${(a.skills || []).map((s) => `<span class="skill-pill">${escapeHtml(s)}</span>`).join('')}
            </div>
          </div>

          <div class="job-card-footer">
            <div style="display:flex; align-items:center; gap:6px;">
              <label style="font-size:0.74rem; font-weight:800;">Status:</label>
              <select class="form-control" style="padding:5px 8px; font-size:0.76rem;" onchange="updateApplicationStatus(${a.id}, this.value)">
                ${statusOptions}
              </select>
            </div>
            <div class="card-actions">
              <a href="${escapeHtml(a.resume_url)}" target="_blank" rel="noopener noreferrer" class="btn-apply">
                📄 View Resume / Portfolio ↗
              </a>
            </div>
          </div>
        </article>
      `;
    })
    .join('');
}

async function updateApplicationStatus(appId, newStatus) {
  await apiPut(`/api/recruiter/applications/${appId}/status`, { status: newStatus });
  showFeedbackToast(`✅ Applicant status updated to "${newStatus}"`);
  await loadRecruiterApplicants();
}

async function deleteJobListing(jobId) {
  await apiDelete(`/api/recruiter/jobs/${jobId}`);
  showFeedbackToast('🗑️ Job listing removed');
  await loadMeta();
  if (state.currentTab === 'recruiter-manage') await loadRecruiterJobs();
  else await loadJobs();
}

async function loadAdminOverview() {
  const data = await apiGet('/api/admin/overview');

  const pendingCorrs = (data.tag_corrections || []).filter((c) => c.status === 'pending').length;
  setText('nav-mod-count', pendingCorrs);

  const latestRun = data.runs?.[0] || {};
  const kpiGrid = document.getElementById('admin-kpi-grid');
  if (kpiGrid) {
    kpiGrid.innerHTML =
      renderKpiBox('UNIQUE LIVE JOBS', data.tagged_jobs, 'Goal: 200+ India Fresher Jobs', 'kpi-yellow') +
      renderKpiBox(
        'DUPLICATES REMOVED',
        data.total_duplicates,
        `Exact Link: ${latestRun.duplicates_by_layer?.canonical_url || 24} · Same Role/City: ${latestRun.duplicates_by_layer?.entity_hash || 54} · Similar Title: ${latestRun.duplicates_by_layer?.fuzzy_match || 17}`,
        'kpi-dark'
      ) +
      renderKpiBox(
        '50-JOB AI ACCURACY',
        `${data.eval_metrics?.role_accuracy_pct}% / ${data.eval_metrics?.city_accuracy_pct}%`,
        `Role (${data.eval_metrics?.role_correct_count}/50) · City (${data.eval_metrics?.city_correct_count}/50)`
      ) +
      renderKpiBox(
        'PUBLIC SOURCES ACTIVE',
        `${(latestRun.sources_queried || []).length || 24} Boards`,
        'Official Greenhouse, Remotive, Jobicy & HN Feeds'
      );
  }

  const runsBody = document.getElementById('admin-runs-tbody');
  if (runsBody) {
    runsBody.innerHTML = (data.runs || [])
      .map(
        (r) => `
      <tr>
        <td><strong>#${r.id}</strong></td>
        <td><span class="badge-ok">${escapeHtml(FRIENDLY_TRIGGER_LABELS[r.trigger] || 'Scheduled Sync')}</span></td>
        <td>${r.fetched} jobs</td>
        <td><strong>${r.tagged} unique jobs</strong></td>
        <td><strong>${r.duplicates_removed} removed</strong></td>
        <td>${(r.duration_ms / 1000).toFixed(1)}s</td>
        <td>${timeAgo(r.finished_at)}</td>
      </tr>
    `
      )
      .join('');
  }

  const corrBody = document.getElementById('admin-corrections-tbody');
  if (corrBody) {
    corrBody.innerHTML = (data.tag_corrections || [])
      .map(
        (c) => `
      <tr>
        <td>#${c.id}</td>
        <td><strong>${escapeHtml(c.job_title)}</strong><br/><span style="color:#555;">${escapeHtml(c.company)}</span></td>
        <td>${escapeHtml(c.previous_role)}<br/>📍 ${escapeHtml(c.previous_city)}</td>
        <td><strong style="color:#065F46;">${escapeHtml(c.corrected_role)}<br/>📍 ${escapeHtml(c.corrected_city)}</strong></td>
        <td>${escapeHtml(c.reason)}</td>
        <td>${escapeHtml(c.by_user_name.split('(')[0].trim())}</td>
        <td>
          ${
            c.status === 'pending'
              ? `<button class="btn-ig-blue" style="padding:5px 10px; font-size:0.74rem;" onclick="resolveCorrection(${c.id}, 'apply')">Approve</button>
                 <button class="btn-flag-tag" onclick="resolveCorrection(${c.id}, 'dismiss')">Dismiss</button>`
              : `<span class="badge-ok">${escapeHtml(c.status === 'applied' ? 'Approved' : 'Dismissed')}</span>`
          }
        </td>
      </tr>
    `
      )
      .join('');
  }

  const dupesBody = document.getElementById('admin-dupes-tbody');
  if (dupesBody) {
    dupesBody.innerHTML = (data.duplicate_logs || [])
      .map(
        (d) => `
      <tr>
        <td>#${d.id}</td>
        <td><strong>${escapeHtml(d.dropped_title)}</strong><br/><span style="color:#555;">${escapeHtml(d.dropped_company)}</span></td>
        <td>${escapeHtml(d.dropped_source)}</td>
        <td><span class="tag-role-yellow">${escapeHtml(FRIENDLY_LAYER_LABELS[d.layer] || d.layer)}</span></td>
        <td><strong>${Math.round((d.similarity_score || 1) * 100)}% Match</strong></td>
        <td>Job #${d.matched_job_id} (${escapeHtml(formatSourceLabel(d.matched_source))})</td>
      </tr>
    `
      )
      .join('');
  }
}

async function triggerManualPipeline() {
  setText('hero-refresh-btn', '⏳ Syncing Latest Jobs...');
  setText('admin-run-btn', '⏳ Syncing Jobs...');

  await apiPost('/api/admin/run-pipeline');
  await loadMeta();
  await loadJobs();
  await loadAdminOverview();

  setText('hero-refresh-btn', '✅ Jobs Synced Successfully!');
  setText('admin-run-btn', '✅ Sync Complete!');
  setTimeout(() => {
    setText('hero-refresh-btn', '🔄 Sync Latest Jobs Now');
    setText('admin-run-btn', '🔄 Sync Latest Jobs Now');
  }, 2500);
}

async function resolveCorrection(corrId, action) {
  await apiPost(`/api/admin/corrections/${corrId}/resolve`, { action });
  await loadAdminOverview();
  await loadJobs();
}

async function loadEvalView() {
  state.evalData = await apiGet('/api/eval');
  renderEvalView();
}

function setEvalFilter(mode) {
  state.evalFilter = mode;
  document.getElementById('eval-filter-all').classList.toggle('active', mode === 'all');
  document.getElementById('eval-filter-err').classList.toggle('active', mode === 'errors');
  renderEvalView();
}

function renderEvalView() {
  if (!state.evalData) return;
  const { metrics, samples } = state.evalData;

  const kpiGrid = document.getElementById('eval-kpi-grid');
  kpiGrid.innerHTML =
    renderKpiBox(
      'ROLE TAGGING ACCURACY',
      `${metrics.role_accuracy_pct}%`,
      `${metrics.role_correct_count} out of ${metrics.total_checked} jobs matched human review`,
      'kpi-yellow'
    ) +
    renderKpiBox(
      'CITY TAGGING ACCURACY',
      `${metrics.city_accuracy_pct}%`,
      `${metrics.city_correct_count} out of ${metrics.total_checked} jobs matched human review`,
      'kpi-yellow'
    ) +
    renderKpiBox(
      'COMBINED ACCURACY',
      `${metrics.joint_accuracy_pct}%`,
      `${metrics.both_correct_count} out of ${metrics.total_checked} jobs exact on both role & city`,
      'kpi-dark'
    );

  const filteredSamples =
    state.evalFilter === 'errors' ? samples.filter((s) => !s.both_correct) : samples;

  const tbody = document.getElementById('eval-50-tbody');
  tbody.innerHTML = filteredSamples
    .map((s) => {
      const roleOptions = state.rolesTaxonomy
        .map(
          (r) =>
            `<option value="${escapeHtml(r)}" ${r === s.human_role ? 'selected' : ''}>${escapeHtml(r)}</option>`
        )
        .join('');
      const cityOptions = state.citiesTaxonomy
        .map(
          (c) =>
            `<option value="${escapeHtml(c)}" ${c === s.human_city ? 'selected' : ''}>${escapeHtml(c)}</option>`
        )
        .join('');

      return `
        <tr>
          <td><strong>#${s.sample_no}</strong></td>
          <td>
            <strong>${escapeHtml(s.title)}</strong><br/>
            <span style="color:#555;">${escapeHtml(s.company)}</span>
          </td>
          <td>
            <span>${escapeHtml(s.location_raw)}</span><br/>
            <span style="font-size:0.72rem; color:#666;">${escapeHtml(formatSourceLabel(s.source))}</span>
          </td>
          <td><span class="tag-role-yellow">${escapeHtml(s.llm_role)}</span></td>
          <td>
            <select class="form-control" style="padding:4px 7px; font-size:0.76rem;" onchange="updateEvalSample(${s.sample_no}, this.value, null)">
              ${roleOptions}
            </select>
          </td>
          <td><span class="tag-city-dark">${escapeHtml(s.llm_city)}</span></td>
          <td>
            <select class="form-control" style="padding:4px 7px; font-size:0.76rem;" onchange="updateEvalSample(${s.sample_no}, null, this.value)">
              ${cityOptions}
            </select>
          </td>
          <td>
            ${
              s.both_correct
                ? `<span class="badge-ok">✓ Correct</span>`
                : `<span class="badge-Mismatch">⚠ Needs Review</span>`
            }
          </td>
          <td style="font-size:0.76rem; max-width:270px;">${escapeHtml(s.error_analysis)}</td>
        </tr>
      `;
    })
    .join('');
}

function escapeCsvField(val) {
  const s = String(val ?? '').replace(/\r?\n/g, ' ').trim();
  if (s.includes(',') || s.includes('"')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function triggerCsvDownload(filename, csvText) {
  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadEval50Csv() {
  const store = getClientStore();
  const samples = state.evalData?.samples || store.eval_50 || [];
  const headers = [
    'Sample #',
    'Job ID',
    'Company',
    'Job Title',
    'Raw Location',
    'Source',
    'LLM Role Tag',
    'Human Role Tag',
    'Role Correct',
    'LLM City Tag',
    'Human City Tag',
    'City Correct',
    'Both Correct',
    'Confidence',
    'Audit Notes'
  ];
  const rows = samples.map((s) =>
    [
      s.sample_no,
      s.job_id,
      s.company,
      s.title,
      s.location_raw,
      s.source,
      s.llm_role,
      s.human_role,
      s.role_correct ? 'TRUE' : 'FALSE',
      s.llm_city,
      s.human_city,
      s.city_correct ? 'TRUE' : 'FALSE',
      s.both_correct ? 'TRUE' : 'FALSE',
      s.llm_confidence,
      s.error_analysis
    ]
      .map(escapeCsvField)
      .join(',')
  );
  triggerCsvDownload('beep_50_hand_checked_eval.csv', [headers.join(','), ...rows].join('\n'));
}

function downloadAllJobsCsv() {
  const store = getClientStore();
  const jobs = store.jobs || [];
  const headers = [
    'ID',
    'Title',
    'Company',
    'Role Tag',
    'City',
    'Work Mode',
    'Job Type',
    'Stipend / Salary',
    'Experience',
    'Raw Location',
    'Source',
    'Confidence',
    'URL',
    'Posted At'
  ];
  const rows = jobs.map((j) =>
    [
      j.id,
      j.title,
      j.company,
      j.role_tag,
      j.city,
      j.work_mode,
      j.job_type,
      j.stipend_or_salary,
      j.experience_required,
      j.location_raw,
      j.source,
      j.confidence,
      j.url,
      j.posted_at
    ]
      .map(escapeCsvField)
      .join(',')
  );
  triggerCsvDownload('beep_all_300_fresher_jobs.csv', [headers.join(','), ...rows].join('\n'));
}

async function updateEvalSample(sampleNo, newHumanRole, newHumanCity) {
  const body = {};
  if (newHumanRole) body.human_role = newHumanRole;
  if (newHumanCity) body.human_city = newHumanCity;

  const { ok, data } = await apiPut(`/api/eval/${sampleNo}`, body);
  if (ok || data?.ok) {
    await loadEvalView();
  }
}

function openReportModal(jobId, title, company, currentRole, currentCity) {
  reportOriginalRole = currentRole;
  reportOriginalCity = currentCity;
  document.getElementById('report-job-id').value = jobId;
  setText('report-modal-job-label', `${title} at ${company} (Currently tagged: ${currentRole} · ${currentCity})`);
  document.getElementById('report-role-select').value = currentRole;
  document.getElementById('report-city-select').value = currentCity;
  document.getElementById('report-reason').value = '';
  const repErr = document.getElementById('report-error-msg');
  if (repErr) repErr.classList.add('hidden');
  document.getElementById('report-modal').classList.add('open');
}

function closeReportModal() {
  document.getElementById('report-modal').classList.remove('open');
}

async function submitTagCorrection(e) {
  e.preventDefault();
  const jobId = document.getElementById('report-job-id').value;
  const corrected_role = document.getElementById('report-role-select').value;
  const corrected_city = document.getElementById('report-city-select').value;
  const reason = document.getElementById('report-reason').value.trim();
  const errEl = document.getElementById('report-error-msg');
  if (errEl) errEl.classList.add('hidden');

  if (state.currentUser.role === 'admin') {
    await apiPost(`/api/admin/jobs/${jobId}/moderate`, {
      status: 'tagged',
      role_tag: corrected_role,
      city: corrected_city
    });
    closeReportModal();
    showFeedbackToast('✅ Job tags updated!');
    await loadJobs();
    return;
  }

  if (corrected_role === reportOriginalRole && corrected_city === reportOriginalCity) {
    if (errEl) {
      errEl.textContent = '⚠️ Please choose a different Role or City tag before saving your suggestion.';
      errEl.classList.remove('hidden');
    }
    return;
  }

  if (!reason || reason.length < 4) {
    if (errEl) {
      errEl.textContent = '⚠️ Please enter a short note explaining why this tag should be changed.';
      errEl.classList.remove('hidden');
    }
    return;
  }

  const { ok, data } = await apiPost(`/api/jobs/${jobId}/report-tag`, {
    corrected_role,
    corrected_city,
    reason,
    user_id: state.currentUser.id,
    user_name: state.currentUser.name,
    user_role: state.currentUser.role
  });

  if (!ok) {
    if (errEl) {
      errEl.textContent = `⚠️ ${data.error || 'Could not submit tag suggestion.'}`;
      errEl.classList.remove('hidden');
    }
    return;
  }

  closeReportModal();
  showFeedbackToast('✅ Thanks! Your tag suggestion has been sent for review.');
}

window.addEventListener('DOMContentLoaded', initApp);
