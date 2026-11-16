export type UserRole = 'user' | 'recruiter' | 'admin';

export interface Profile {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  phone?: string;
  company?: string;
  college?: string;
  graduation_year?: string;
  resume_url?: string;
  skills?: string[];
  created_at: string;
}

export type JobStatus = 'untagged' | 'tagged' | 'failed' | 'pending_review' | 'rejected';

export interface JobPost {
  id: number;
  title: string;
  company: string;
  company_logo?: string;
  location_raw: string;
  description: string;
  url: string;
  canonical_url: string;
  dedupe_hash: string;
  source: string;
  source_compliance: string;
  job_type: 'Internship' | 'Full-Time Fresher' | 'Apprenticeship';
  work_mode: 'On-site' | 'Remote' | 'Hybrid';
  stipend_or_salary: string;
  experience_required: string;
  skills: string[];
  posted_at: string;
  first_seen: string;
  last_seen: string;
  status: JobStatus;
  role_tag: string;
  city: string;
  confidence: number;
  llm_reasoning?: string;
  tagged_by?: 'gemini-llm' | 'hybrid-llm-rules' | 'admin-verified';
  is_fresher: boolean;
  posted_by?: number | null;
  has_external_url?: boolean;
  views_count: number;
  apply_clicks: number;
}

export interface JobApplication {
  id: number;
  job_id: number;
  job_title: string;
  company: string;
  role_tag: string;
  city: string;
  student_id: number;
  student_name: string;
  student_email: string;
  student_phone: string;
  college: string;
  graduation_year: string;
  resume_url: string;
  skills: string[];
  cover_note: string;
  status: 'Under Review' | 'Shortlisted' | 'Interview Scheduled' | 'Hired' | 'Not Selected';
  applied_at: string;
}

export interface SavedJob {
  user_id: number;
  job_id: number;
  saved_at: string;
}

export interface TagCorrection {
  id: number;
  job_id: number;
  job_title: string;
  company: string;
  previous_role: string;
  previous_city: string;
  corrected_role: string;
  corrected_city: string;
  reason: string;
  by_user_id: number;
  by_user_name: string;
  by_user_role: UserRole;
  status: 'pending' | 'applied' | 'dismissed';
  created_at: string;
}

export interface DuplicateLog {
  id: number;
  dropped_title: string;
  dropped_company: string;
  dropped_source: string;
  dropped_url: string;
  matched_job_id: number;
  matched_source: string;
  layer: 'Layer 1: Canonical URL' | 'Layer 2: SHA-256 Entity Hash' | 'Layer 3: Fuzzy Token Similarity';
  similarity_score: number;
  detected_at: string;
}

export interface PipelineRun {
  id: number;
  started_at: string;
  finished_at: string;
  trigger: 'daily-cron' | 'manual-admin' | 'startup-seed' | 'python-tagger';
  sources_queried: string[];
  fetched: number;
  fresher_filtered: number;
  inserted: number;
  updated: number;
  duplicates_removed: number;
  duplicates_by_layer: {
    canonical_url: number;
    entity_hash: number;
    fuzzy_match: number;
  };
  tagged: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  cost_per_1000_usd: number;
  cost_per_1000_inr: number;
  duration_ms: number;
  notes: string;
}

export interface EvalSample {
  sample_no: number;
  job_id: number;
  title: string;
  company: string;
  location_raw: string;
  source: string;
  llm_role: string;
  llm_city: string;
  llm_confidence: number;
  human_role: string;
  human_city: string;
  role_correct: boolean;
  city_correct: boolean;
  both_correct: boolean;
  error_analysis: string;
  checked_by: string;
  checked_at: string;
}

export interface StoreSchema {
  profiles: Profile[];
  jobs: JobPost[];
  saved_jobs: SavedJob[];
  applications: JobApplication[];
  tag_corrections: TagCorrection[];
  duplicate_logs: DuplicateLog[];
  runs: PipelineRun[];
  eval_50: EvalSample[];
  meta: {
    last_refresh_at: string;
    next_refresh_at: string;
    cron_schedule: string;
    pg_connected: boolean;
    llm_model: string;
  };
}
