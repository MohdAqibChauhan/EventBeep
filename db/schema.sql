CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','recruiter','admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT,
  location_raw TEXT,
  description TEXT,
  url TEXT NOT NULL,
  canonical_url TEXT UNIQUE NOT NULL,
  dedupe_hash TEXT NOT NULL,
  source TEXT NOT NULL,
  posted_at TIMESTAMPTZ,
  first_seen TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'untagged' CHECK (status IN ('untagged','tagged','failed','pending_review','rejected')),
  role_tag TEXT,
  city TEXT,
  confidence REAL,
  is_fresher BOOLEAN,
  posted_by INT REFERENCES profiles(id),
  tsv tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title,'') || ' ' || coalesce(company,'') || ' ' || coalesce(city,'') || ' ' || coalesce(role_tag,''))
  ) STORED
);
CREATE INDEX IF NOT EXISTS jobs_dedupe_idx ON jobs(dedupe_hash);
CREATE INDEX IF NOT EXISTS jobs_tsv_idx ON jobs USING GIN(tsv);

CREATE TABLE IF NOT EXISTS saved_jobs (
  user_id INT REFERENCES profiles(id) ON DELETE CASCADE,
  job_id INT REFERENCES jobs(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, job_id)
);

CREATE TABLE IF NOT EXISTS tag_corrections (
  id SERIAL PRIMARY KEY,
  job_id INT REFERENCES jobs(id) ON DELETE CASCADE,
  corrected_role TEXT,
  corrected_city TEXT,
  by_user INT REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS runs (
  id SERIAL PRIMARY KEY,
  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  source TEXT,
  fetched INT DEFAULT 0,
  inserted INT DEFAULT 0,
  duplicates INT DEFAULT 0,
  tagged INT DEFAULT 0,
  input_tokens INT DEFAULT 0,
  output_tokens INT DEFAULT 0,
  notes TEXT
);
