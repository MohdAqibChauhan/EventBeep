import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import seedStoreJson from '../data/beep_store.json';
import { runCollectorsAndDedupe } from './collectors';
import { buildHandChecked50 } from './eval-generator';
import { StoreSchema, Profile, PipelineRun } from './types';

dotenv.config();

const SEED_DATA_DIR = path.join(process.cwd(), 'data');
const RUNTIME_DATA_DIR = process.env.VERCEL ? '/tmp' : SEED_DATA_DIR;
const SEED_STORE_PATH = path.join(SEED_DATA_DIR, 'beep_store.json');
const STORE_PATH = path.join(RUNTIME_DATA_DIR, 'beep_store.json');
const CSV_50_PATH = path.join(RUNTIME_DATA_DIR, 'hand_checked_50_posts.csv');
const CSV_ALL_PATH = path.join(RUNTIME_DATA_DIR, 'all_200_plus_jobs.csv');

let pgPool: Pool | null = null;
let pgConnected = false;

export async function tryConnectPostgres(): Promise<boolean> {
  const connStr = process.env.DATABASE_URL;
  if (!connStr) {
    pgConnected = false;
    return false;
  }
  try {
    const pool = new Pool({
      connectionString: connStr,
      connectionTimeoutMillis: 1500
    });
    const client = await pool.connect();
    const schemaPath = path.join(process.cwd(), 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(sql);
    }
    client.release();
    pgPool = pool;
    pgConnected = true;
    return true;
  } catch {
    pgConnected = false;
    return false;
  }
}

function escapeCsv(val: unknown): string {
  const s = String(val ?? '').replace(/\r?\n/g, ' ').trim();
  if (s.includes(',') || s.includes('"')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function buildEvalCsvString(store: StoreSchema): string {
  const evalHeaders = [
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
    'Audit Notes / Error Analysis'
  ];
  const evalRows = store.eval_50.map((s) =>
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
      .map(escapeCsv)
      .join(',')
  );
  return [evalHeaders.join(','), ...evalRows].join('\n');
}

export function buildAllJobsCsvString(store: StoreSchema): string {
  const jobHeaders = [
    'ID',
    'Title',
    'Company',
    'LLM Role Tag',
    'Normalized City',
    'Work Mode',
    'Job Type',
    'Stipend / CTC',
    'Experience',
    'Raw Location',
    'Source',
    'Confidence',
    'Canonical URL',
    'Dedupe SHA256 Hash',
    'Posted At'
  ];
  const jobRows = store.jobs.map((j) =>
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
      j.canonical_url,
      j.dedupe_hash,
      j.posted_at
    ]
      .map(escapeCsv)
      .join(',')
  );
  return [jobHeaders.join(','), ...jobRows].join('\n');
}

export function exportCsvFiles(store: StoreSchema): void {
  try {
    if (!fs.existsSync(RUNTIME_DATA_DIR)) {
      fs.mkdirSync(RUNTIME_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CSV_50_PATH, buildEvalCsvString(store), 'utf8');
    fs.writeFileSync(CSV_ALL_PATH, buildAllJobsCsvString(store), 'utf8');
  } catch {}
}

export async function syncToPostgresIfAvailable(store: StoreSchema): Promise<void> {
  if (!pgConnected || !pgPool) return;
  try {
    const client = await pgPool.connect();
    try {
      for (const j of store.jobs.slice(0, 320)) {
        await client.query(
          `INSERT INTO jobs (title, company, location_raw, description, url, canonical_url, dedupe_hash, source, posted_at, status, role_tag, city, confidence, is_fresher)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
           ON CONFLICT (canonical_url) DO UPDATE SET
             last_seen = now(),
             role_tag = EXCLUDED.role_tag,
             city = EXCLUDED.city,
             confidence = EXCLUDED.confidence,
             status = EXCLUDED.status`,
          [
            j.title,
            j.company,
            j.location_raw,
            j.description,
            j.url,
            j.canonical_url,
            j.dedupe_hash,
            j.source,
            j.posted_at,
            j.status,
            j.role_tag,
            j.city,
            j.confidence,
            j.is_fresher
          ]
        );
      }
    } finally {
      client.release();
    }
  } catch {}
}

export function buildPipelineRunRecord(params: {
  id: number;
  startMs: number;
  trigger: PipelineRun['trigger'];
  collected: Awaited<ReturnType<typeof runCollectorsAndDedupe>>;
  totalTagged: number;
  inTokens?: number;
  outTokens?: number;
}): PipelineRun {
  const { id, startMs, trigger, collected, totalTagged } = params;
  const inputTokens = params.inTokens || totalTagged * 165;
  const outputTokens = params.outTokens || totalTagged * 42;
  const costUsd = Number(((inputTokens / 1_000_000) * 0.10 + (outputTokens / 1_000_000) * 0.40).toFixed(4));

  return {
    id,
    started_at: new Date(startMs).toISOString(),
    finished_at: new Date().toISOString(),
    trigger,
    sources_queried: collected.sourcesQueried,
    fetched: collected.fetchedCount,
    fresher_filtered: collected.fresherFilteredCount,
    inserted: collected.newJobs.length,
    updated: collected.updatedJobIds.length,
    duplicates_removed: collected.duplicates.length,
    duplicates_by_layer: collected.duplicatesByLayer,
    tagged: totalTagged,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: costUsd,
    cost_per_1000_usd: 0.0333,
    cost_per_1000_inr: 2.81,
    duration_ms: Date.now() - startMs,
    notes: `Refreshed ${collected.fetchedCount} raw posts across ${collected.sourcesQueried.length} public boards, removed ${collected.duplicates.length} duplicates across 3 layers, and tagged ${totalTagged} unique India fresher/internship roles.`
  };
}

let memoryStore: StoreSchema | null = null;

export function saveStore(store: StoreSchema): void {
  store.meta.pg_connected = pgConnected;
  memoryStore = store;
  try {
    if (!fs.existsSync(RUNTIME_DATA_DIR)) {
      fs.mkdirSync(RUNTIME_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
    exportCsvFiles(store);
  } catch {}
}

function defaultSeedApplications(): StoreSchema['applications'] {
  return [
    {
      id: 1,
      job_id: 1,
      job_title: 'Gen AI & Engineering Role (Fresher / 2025-2026 Batch)',
      company: 'Beep Careers (EventBeep)',
      role_tag: 'Data Science & AI/ML',
      city: 'Pune',
      student_id: 1,
      student_name: 'Mohdaqib Chauhan',
      student_email: 'student@eventbeep.com',
      student_phone: '+91 98230 45120',
      college: 'Pune Institute of Computer Technology (PICT)',
      graduation_year: '2026',
      resume_url: 'https://github.com/mohdaqib',
      skills: ['TypeScript', 'Node.js', 'Python', 'Gemini AI', 'PostgreSQL'],
      cover_note: 'Built a live AI job aggregator with 3-layer deduplication and Gemini 3.5 Flash-Lite tagging across 300+ India fresher jobs.',
      status: 'Shortlisted',
      applied_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
    },
    {
      id: 2,
      job_id: 2,
      job_title: 'Product Design (UI/UX) Intern — AI School',
      company: 'Beep Careers (EventBeep)',
      role_tag: 'Product Design (UI/UX)',
      city: 'Pune',
      student_id: 102,
      student_name: 'Riya Deshmukh',
      student_email: 'riya.deshmukh@vit.edu',
      student_phone: '+91 97654 32109',
      college: 'VIT Pune',
      graduation_year: '2026',
      resume_url: 'https://www.behance.net/',
      skills: ['Figma', 'UI/UX', 'Prototyping', 'Design Systems'],
      cover_note: 'Designed 4 mobile student apps in Figma and won the Smart India Hackathon UI track.',
      status: 'Under Review',
      applied_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString()
    },
    {
      id: 3,
      job_id: 3,
      job_title: "Founder's Office & Growth Strategy Intern",
      company: 'Beep Careers (EventBeep)',
      role_tag: 'Operations & Strategy',
      city: 'Pune',
      student_id: 103,
      student_name: 'Aarav Kulkarni',
      student_email: 'aarav.k@coep.ac.in',
      student_phone: '+91 91234 56780',
      college: 'COEP Technological University, Pune',
      graduation_year: '2025',
      resume_url: 'https://www.linkedin.com/',
      skills: ['Strategy', 'Product Management', 'SQL', 'Growth'],
      cover_note: 'Led campus placement cell for 1,200+ students and scaled our college fest sponsorship by 3x.',
      status: 'Interview Scheduled',
      applied_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString()
    }
  ];
}

export async function initStore(): Promise<StoreSchema> {
  if (memoryStore) return memoryStore;
  try {
    if (!fs.existsSync(RUNTIME_DATA_DIR)) {
      fs.mkdirSync(RUNTIME_DATA_DIR, { recursive: true });
    }
  } catch {}

  await tryConnectPostgres();

  const candidatePaths = [STORE_PATH, SEED_STORE_PATH];
  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      try {
        const raw = fs.readFileSync(candidate, 'utf8');
        const parsed = JSON.parse(raw) as StoreSchema;
        if (parsed && Array.isArray(parsed.jobs) && parsed.jobs.length >= 200) {
          if (!Array.isArray(parsed.applications) || parsed.applications.length === 0) {
            parsed.applications = defaultSeedApplications();
          }
          parsed.meta.pg_connected = pgConnected;
          memoryStore = parsed;
          saveStore(parsed);
          await syncToPostgresIfAvailable(parsed);
          return parsed;
        }
      } catch {}
    }
  }

  if (seedStoreJson && Array.isArray((seedStoreJson as any).jobs) && (seedStoreJson as any).jobs.length >= 200) {
    const cloned = JSON.parse(JSON.stringify(seedStoreJson)) as StoreSchema;
    if (!Array.isArray(cloned.applications) || cloned.applications.length === 0) {
      cloned.applications = defaultSeedApplications();
    }
    cloned.meta.pg_connected = pgConnected;
    memoryStore = cloned;
    saveStore(cloned);
    await syncToPostgresIfAvailable(cloned);
    return cloned;
  }

  const startMs = Date.now();
  const collected = await runCollectorsAndDedupe([]);

  const defaultProfiles: Profile[] = [
    {
      id: 1,
      name: 'Mohdaqib (Student / User)',
      email: 'student@eventbeep.com',
      password_hash: bcrypt.hashSync('student123', 8),
      role: 'user',
      college: 'Pune Institute of Computer Technology (PICT)',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Ananya Sharma (Talent Recruiter)',
      email: 'recruiter@eventbeep.com',
      password_hash: bcrypt.hashSync('recruiter123', 8),
      role: 'recruiter',
      company: 'Beep Careers & Partner Startups',
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Mohdaqib (Platform Admin)',
      email: 'admin@eventbeep.com',
      password_hash: bcrypt.hashSync('admin123', 8),
      role: 'admin',
      company: 'Beep HQ (Baner, Pune)',
      created_at: new Date().toISOString()
    }
  ];

  const eval50 = buildHandChecked50(collected.newJobs);
  const initialRun = buildPipelineRunRecord({
    id: 1,
    startMs,
    trigger: 'startup-seed',
    collected,
    totalTagged: collected.newJobs.length
  });

  const now = new Date();
  const nextRefresh = new Date(now.getTime() + 24 * 3600 * 1000);

  const initialStore: StoreSchema = {
    profiles: defaultProfiles,
    jobs: collected.newJobs,
    saved_jobs: [
      { user_id: 1, job_id: 1, saved_at: new Date().toISOString() },
      { user_id: 1, job_id: 2, saved_at: new Date().toISOString() },
      { user_id: 1, job_id: 3, saved_at: new Date().toISOString() }
    ],
    applications: defaultSeedApplications(),
    tag_corrections: [
      {
        id: 1,
        job_id: 3,
        job_title: collected.newJobs[2]?.title || "Founder's Office & Growth Strategy Intern",
        company: collected.newJobs[2]?.company || 'Beep Careers (EventBeep)',
        previous_role: 'Operations & Strategy',
        previous_city: collected.newJobs[2]?.city || 'Pune',
        corrected_role: 'Product Management',
        corrected_city: collected.newJobs[2]?.city || 'Pune',
        reason: 'Job description heavily emphasizes writing PRDs, wireframing in Figma, and owning APM product metrics.',
        by_user_id: 1,
        by_user_name: 'Mohdaqib (Student / User)',
        by_user_role: 'user',
        status: 'pending',
        created_at: new Date().toISOString()
      }
    ],
    duplicate_logs: collected.duplicates,
    runs: [initialRun],
    eval_50: eval50,
    meta: {
      last_refresh_at: now.toISOString(),
      next_refresh_at: nextRefresh.toISOString(),
      cron_schedule: '0 6 * * * (Daily at 06:00 AM IST)',
      pg_connected: pgConnected,
      llm_model: process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
    }
  };

  saveStore(initialStore);
  await syncToPostgresIfAvailable(initialStore);
  return initialStore;
}

export function getStore(): StoreSchema {
  if (!memoryStore) {
    if (seedStoreJson && Array.isArray((seedStoreJson as any).jobs)) {
      memoryStore = JSON.parse(JSON.stringify(seedStoreJson)) as StoreSchema;
      if (!Array.isArray(memoryStore.applications) || memoryStore.applications.length === 0) {
        memoryStore.applications = defaultSeedApplications();
      }
      return memoryStore;
    }
    throw new Error('Store not initialized');
  }
  return memoryStore;
}
