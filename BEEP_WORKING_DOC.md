# EventBeep (`@beepcareers`) — Complete Working Doc: Research, Data, AI Tools, Prompts & Proof

> **Live Web App:** https://eventbeep.vercel.app  
> **GitHub Repository:** https://github.com/MohdAqibChauhan/EventBeep  
> **Raw & Tagged Jobs CSV (300 Jobs):** [data/all_200_plus_jobs.csv](data/all_200_plus_jobs.csv)  
> **50-Job Hand-Checked Accuracy Audit CSV:** [data/hand_checked_50_posts.csv](data/hand_checked_50_posts.csv)

---

## 1. Live Portal Demo Credentials (Also 1-Click Auto-Fill on Login Page)

| Portal Role | Email ID | Password | Portal Purpose |
|---|---|---|---|
| **🎓 Student / User** | `student@eventbeep.com` | `student123` | Search/filter 300+ fresher & internship jobs, bookmark roles, 1-click Apply on Beep, suggest tag edits, receive zero-refresh live job updates while scrolling |
| **💼 Recruiter** | `recruiter@eventbeep.com` | `recruiter123` | Publish fresher/internship jobs in 60s (optional website URL), preview AI Role & City tags + 1-click Apply Tags, block Senior/duplicate posts, view full student contact & resume directory |
| **🛡️ Admin (Only 1 Admin)** | `admin@eventbeep.com` | `admin123` | View daily sync runs & run AI cost, inspect all 3-layer deduplication logs, audit the 50-job accuracy report + export CSVs, approve/dismiss student tag edits |

---

## 2. Part 1 Summary — 3 Most Important Findings & Why They Matter

1. **Nearly 1 in 4 collected job postings (23.8% — 93 out of 390 raw posts) are cross-board duplicates or tracking-URL clones.**
   - **Where found:** Across 20 official public Greenhouse India career boards, Remotive Public API, Jobicy Public API, and HN Algolia feeds (`server/collectors.ts`).
   - **Why it matters:** Relying on simple URL matching leaves students scrolling through repeated spam caused by `?utm_source` tracking links, `[Urgent]` prefixes, and legal company suffixes (`Razorpay` vs `Razorpay Software Pvt. Ltd.`). Our 3-layer deduplicator (`server/dedupe.ts`) catches **93 duplicates** (`22` canonical URL matches, `53` SHA-256 normalized entity hashes, `18` fuzzy similarity >= 84% matches) *before* invoking the LLM — cutting token spend by ~24%.

2. **Indian neighborhood names and boilerplate HQ addresses break naive city filters.**
   - **Where found:** Across our 300+ collected jobs (e.g., Bengaluru: `154`, Remote (India): `46`, Delhi NCR: `36`, Pune: `33`, Mumbai: `10`, Chennai: `10`) and during our 50-post hand-checked evaluation (`data/hand_checked_50_posts.csv`).
   - **Why it matters:** Startups frequently write *Baner*, *Hinjewadi Phase 2*, *Koramangala*, *Borivali*, *Andheri*, or *Gurugram* instead of parent cities — or mention their HQ city inside the job description. Prioritizing `location_raw` over description boilerplate and maintaining a 150+ sub-locality dictionary (`config/taxonomy.json`, now including `International / Global`) raised city normalization accuracy to **96.0% (48/50)**.

3. **Public ATS feeds mix Senior/Manager roles into general listings, and early-stage Indian startups often lack career websites.**
   - **Where found:** Live API responses from Greenhouse, Remotive, and Jobicy (which mix Staff/Principal/Manager postings with fresher roles and use ambiguous startup titles like *"Founder's Office Intern"*) plus recruiter UX testing.
   - **Why it matters:** Filtering out senior titles pre-AI keeps the board 100% dedicated to college freshers (0–1 yr), while compact 10-job batching on **Gemini 3.1 Flash-Lite** (`98` input + `47` output tokens/job measured live) brings paid tagging cost down to **₹8.94 ($0.095) per 1,000 posts** real-time (or **₹4.47** via Gemini Batch API; **₹0.00** on Free Tier). Making external career links optional with **1-click Apply on Beep** and **scroll-triggered live job injection** lets startups without websites hire directly while students see new jobs without refreshing.

---

## 3. Raw Data Sources & Verified Dataset Distribution

All data is collected legally and respectfully from official public JSON APIs with custom `User-Agent` headers and request timeouts (`server/collectors.ts`), pre-filtered for 0–1 year fresher/internship eligibility, and deduplicated across 3 layers (`server/dedupe.ts`).

### 3.1 Latest Sync Pipeline Metrics (`data/beep_store.json`)
| Metric | Measured Value |
|---|---|
| **Total Raw Posts Scanned** | `390` posts |
| **Duplicates Removed (Pre-AI)** | `93` duplicates (`22` Exact Link + `53` Same Company/Role/City Hash + `18` Fuzzy Title >= 84%) |
| **Unique Active Fresher/Intern Jobs** | `300` jobs (across `23` unique sources) |
| **Senior / Principal / Manager Titles in Feed** | `0` (100% Fresher & Internship verified) |

### 3.2 Breakdown by Source (`23` Active Sources — Total `300` Jobs)
| Source | Unique Jobs |
|---|---|
| Greenhouse API (Rubrik India) | 26 |
| Greenhouse API (Stripe India) | 26 |
| Greenhouse API (Zscaler) | 22 |
| Greenhouse API (MongoDB India) | 22 |
| Greenhouse API (PubMatic) | 20 |
| Greenhouse API (Elastic India) | 18 |
| Greenhouse API (Toast India) | 18 |
| Greenhouse API (Razorpay) | 16 |
| Greenhouse API (Okta India) | 16 |
| Greenhouse API (Databricks India) | 16 |
| Greenhouse API (Airbnb India) | 12 |
| Jobicy Public API | 12 |
| Greenhouse API (Agoda India) | 11 |
| Greenhouse API (Twilio India) | 11 |
| Greenhouse API (Groww) | 9 |
| Greenhouse API (Druva) | 9 |
| Remotive Public API | 9 |
| Greenhouse API (Coinbase India) | 8 |
| EventBeep Direct Recruiter | 6 |
| Greenhouse API (Deliveroo India) | 5 |
| Greenhouse API (Anthropic) | 4 |
| Greenhouse API (Figma) | 2 |
| HN Algolia Public API | 2 |
| **Total Unique Jobs** | **300** |

### 3.3 Distribution by Canonical Role (`14` Categories) & City (`15` Locations)

| Canonical Role Tag | Count | Normalized City / Region | Count |
|---|---:|---|---:|
| Software Engineering | 99 | Bengaluru | 154 |
| Data Science & AI/ML | 47 | Remote (India) | 46 |
| Operations & Strategy | 42 | Delhi NCR | 36 |
| Finance & Analyst | 36 | Pune | 33 |
| Business Development & Sales | 28 | Chennai | 10 |
| Backend & Cloud/DevOps | 22 | Mumbai | 10 |
| Marketing & Growth | 6 | Hyderabad | 6 |
| Content & Social Media | 6 | Chandigarh | 4 |
| HR & Talent | 6 | Pan-India / Multiple | 1 |
| Mobile Development | 3 | Kolkata / Ahmedabad / Jaipur / Kochi / Indore / International | Supported live |
| Product Design (UI/UX) | 2 | | |
| Frontend & Web Dev | 2 | | |
| Product Management | 1 | | |
| QA & Testing | Supported live | | |
| **Total** | **300** | **Total** | **300** |

---

## 4. AI Tools, Tech Stack & Architecture

| Layer | Technologies & AI Tools Used | Key Files |
|---|---|---|
| **AI / LLM Tagger & Evaluator** | **Google Gemini 3.1 Flash-Lite** (`gemini-3.1-flash-lite`, `responseMimeType: "application/json"`, `temperature: 0.1`), **Python 3**, `config/taxonomy.json` (150+ sub-locality rules) | [tagger/tag_jobs.py](tagger/tag_jobs.py), [tagger/evaluate.py](tagger/evaluate.py), [config/taxonomy.json](config/taxonomy.json) |
| **Backend & Job Collectors** | **Node.js**, **TypeScript**, **Express.js**, `bcryptjs`, `jsonwebtoken`, `node-cron` (daily 06:00 AM IST cron), `cheerio`, Server-Sent Events (`/api/stream`) | [server/index.ts](server/index.ts), [server/collectors.ts](server/collectors.ts), [server/dedupe.ts](server/dedupe.ts) |
| **Frontend SPA** | **HTML5**, **CSS3** (Neo-Brutalist Yellow/Black/White `@beepcareers` theme), **Vanilla JavaScript (ES2022)**, SSE + cross-tab `localStorage` live feed injection | [public/index.html](public/index.html), [public/styles.css](public/styles.css), [public/app.js](public/app.js) |
| **Database & Deployment** | **PostgreSQL** (`pg` schema in [db/schema.sql](db/schema.sql)) + Dual-Sync JSON store + bundled client fallback, **GitHub** + **Vercel Serverless** | [server/db.ts](server/db.ts), [vercel.json](vercel.json), [index.ts](index.ts) |
| **Automated Verification** | 13-Test End-to-End Automated Suite (`npm test`) | [server/test-suite.ts](server/test-suite.ts) |

---

## 5. Exact AI Prompts Used

### 5.1 Prompt 1 — Single Job Preview & Tag Reasoning (`tagger/tag_jobs.py` -> `SYSTEM_PROMPT`)
```text
You are Beep's Senior Career Taxonomy LLM.
Given a batch of Indian fresher / college internship job postings, classify each job into:
1. `role_tag`: MUST be exactly one of: ["Software Engineering", "Frontend & Web Dev", "Backend & Cloud/DevOps", "Data Science & AI/ML", "Mobile Development", "Product Design (UI/UX)", "Product Management", "Marketing & Growth", "Business Development & Sales", "Operations & Strategy", "Content & Social Media", "Finance & Analyst", "HR & Talent", "QA & Testing"]
2. `city`: MUST be normalized to one of: ["Bengaluru", "Pune", "Mumbai", "Hyderabad", "Delhi NCR", "Chennai", "Kolkata", "Ahmedabad", "Jaipur", "Kochi", "Indore", "Chandigarh", "Remote (India)", "Pan-India / Multiple", "International / Global"]
   - Map Bangalore/BLR/HSR/Koramangala/Whitefield -> "Bengaluru"
   - Map Baner/Hinjewadi/Kharadi/Viman Nagar/Wakad/Balewadi -> "Pune"
   - Map Gurgaon/Gurugram/Noida/New Delhi/Faridabad -> "Delhi NCR"
   - Map Bombay/Powai/Andheri/Borivali/BKC/Thane/Navi Mumbai -> "Mumbai"
   - Map HITEC City/Gachibowli/Madhapur/Secunderabad -> "Hyderabad"
   - Map OMR/Guindy/Taramani -> "Chennai"
   - Map Work From Home/WFH/Anywhere -> "Remote (India)"
   - If 3+ Indian cities are listed -> "Pan-India / Multiple"
3. `confidence`: Float between 0.75 and 0.99 indicating classification confidence.
4. `is_fresher`: Boolean (true if 0-1 yr experience, intern, trainee, or new college graduate).
5. `reasoning`: 1-sentence justification for the role and city tags.

Return ONLY valid JSON matching the array schema.
```

### 5.2 Prompt 2 — Compact 10-Job Batch Prompt (`tagger/tag_jobs.py` -> `call_gemini_batch`)
Used for bulk daily sync runs so Gemini returns compact JSON without verbose reasoning paragraphs (reducing output tokens from ~89/job to **47/job**):
```text
Tag Indian fresher/internship jobs into role_tag (<14 canonical roles>) and city (<15 canonical locations>). Map Baner/Hinjewadi->Pune, Borivali/Andheri/Powai->Mumbai, HSR/Koramangala->Bengaluru, Gurugram/Noida->Delhi NCR. Return JSON array of {id, role_tag, city, confidence} only.
```

### 5.3 Prompt 3 — Express Serverless Single-Job Fallback Prompt (`server/index.ts` -> `callPythonSingleTagger`)
```text
Classify this Indian fresher/internship job into role_tag (<14 canonical roles>) and city (<15 canonical locations>). Always prioritize location_raw over description when determining city (e.g. Borivali/Andheri/Powai -> Mumbai, Baner/Hinjewadi -> Pune, Koramangala/HSR -> Bengaluru). Return JSON with keys role_tag, city, confidence, reasoning:
<job JSON payload>
```

---

## 6. 50-Post Hand-Checked Evaluation & Real Cost per 1,000 Posts

Full 50-row audit sheet: [data/hand_checked_50_posts.csv](data/hand_checked_50_posts.csv) (reproducible via `python tagger/evaluate.py`).

### 6.1 Accuracy Results (`50` Stratified Real Jobs)
| Evaluation Metric | Score | Exact Count |
|---|---:|---|
| **Role Tagging Accuracy** | **94.0%** | **47 / 50** matched human review |
| **City Normalization Accuracy** | **96.0%** | **48 / 50** matched human review |
| **Combined Exact Match (Both Role & City)** | **92.0%** | **46 / 50** exact on both fields |

### 6.2 All 4 Discrepancies Identified During Manual Audit
| Sample # | Company & Job Title | Raw Location | AI Tag (Role / City) | Human Label (Role / City) | Root Cause & Fix |
|---:|---|---|---|---|---|
| **#11** | Razorpay — Security Engineer (Associate / Fresher Track) | `Bengaluru` | Software Engineering / Bengaluru | **Product Management** / Bengaluru | Hybrid security/APM responsibilities in description; fixed via APM/PRD keyword weighting + Admin Tag Suggestion queue. |
| **#23** | Groww — Associate - Content (Digest) | `Bengaluru-VTP, India` | Content & Social Media / Bengaluru | Content & Social Media / **Pan-India / Multiple** | Multi-city eligibility noted in body text while feed API emitted HQ location. |
| **#34** | Druva — Software Engineer (Associate / Fresher Track) | `Hyderabad, Andhra Pradesh, India` | Software Engineering / Hyderabad | **Data Science & AI/ML** / Hyderabad | General SWE title for an AI team requiring PyTorch/vector DBs in the body text. |
| **#42** | Airbnb India — Analyst, Advanced Analytics - Gurugram | `Gurugram, India` | Finance & Analyst / Delhi NCR | **Marketing & Growth** / **Remote (India)** | Combines growth analytics + temporary remote work period in body text. |

### 6.3 Real Token Usage & Cost per 1,000 Posts (`gemini-3.1-flash-lite`)
Measured directly via live Gemini Developer API `usageMetadata` on 10-job compact batches (exchange rate: **\$1 = ₹94.10**; official `gemini-3.1-flash-lite` pricing: **\$0.25 / 1M input**, **\$1.50 / 1M output**):

| Metric | Measured Value |
|---|---:|
| **Measured Input Tokens per Job (10-job batch)** | `98` tokens (`98,000` / 1,000 jobs) |
| **Measured Output Tokens per Job (Compact JSON)** | `47` tokens (`47,000` / 1,000 jobs) |
| **Input Cost per 1,000 Posts** | `$0.0245` (`₹2.31`) |
| **Output Cost per 1,000 Posts** | `$0.0705` (`₹6.63`) |
| **Total Paid Cost per 1,000 Posts (Standard Real-Time API)** | **`$0.0950` (`₹8.94`)** |
| **Total Paid Cost per 1,000 Posts (Gemini Batch API — 50% off for 6 AM Daily Sync)** | **`$0.0475` (`₹4.47`)** |
| **Typical Daily Beep Sync (~300 Unique Jobs)** | **`₹1.34` (Batch) – `₹2.68` (Standard)** |
| **Actual Out-of-Pocket Cost (Google AI Studio Free Tier)** | **`₹0.00` (`$0.00`)** |

---

## 7. Real Engineering Bugs Caught & Solved During Build

1. **Location Boilerplate Overriding Actual City (`Borivali` / `Andheri` -> `Pune`)**:
   - **Bug:** When a recruiter typed `Borivali` or `Andheri` in the Location input while the Job Description mentioned a `Baner, Pune` office, the normalizer/LLM picked `Pune` over `Mumbai`.
   - **Fix:** Enforced strict priority on `location_raw` over `description` in `tagger/tag_jobs.py`, `server/index.ts`, and `public/app.js`, and expanded `config/taxonomy.json` with 150+ neighborhood aliases (including `Borivali`, `Andheri`, `Kandivali`, `Malad`, `Dadar`, `Powai`, `Thane`, `Vashi`, plus `International / Global`).
2. **Gemini Model `404 Not Found` & Token Cost Bloat**:
   - **Bug:** `gemini-2.5-flash-lite` returned `404` on new AI Studio keys, and verbose `reasoning` strings inflated output tokens on `gemini-3.5-flash-lite` (`~₹24.81` per 1k posts).
   - **Fix:** Switched bulk tagging to `gemini-3.1-flash-lite` with compact 10-job JSON batches (`98` in + `47` out tokens/job), bringing standard cost down to **`₹8.94`** (**`₹4.47`** Batch API) per 1,000 jobs.
3. **Vercel Serverless `NOT_FOUND` & `fs.readFileSync` Bundle Gaps**:
   - **Bug:** Everything passed on `localhost:3000`, but Vercel's Edge router returned `404 NOT_FOUND` on `/api/auth/login` and `esbuild` skipped dynamically read JSON files.
   - **Fix:** Added `vercel.json` `/api/(.*)` rewrites, static TypeScript JSON imports (`server/db.ts`, `server/taxonomy.ts`), `/tmp` runtime writes under `process.env.VERCEL`, and bundled `public/seed-data.js` fallback.
4. **Zero-Refresh Live Job Streaming + Senior Role & Negative Scenario Guards**:
   - **Bug:** Refreshing a student's page when a new job is posted loses their scroll position; raw feeds also leaked `"Senior"` / `"Manager"` titles.
   - **Fix:** Added SSE + cross-tab `localStorage` scroll-triggered card injection (visible only to Students), strict Senior-role rejection (`400 Bad Request`), and `13/13` verified automated test cases (`npm test`).

---

## 8. Proof Artifacts & Test Verification

- **Automated Test Suite:** `npm test` (`server/test-suite.ts`) — **13/13 Test Cases Passed** (Auth, Role/City filters, Borivali/Andheri/Hinjewadi normalization, Recruiter Duplicate Guard, Direct Apply + Contact Directory, 50-Post Accuracy & Cost, CSV Exports, and Negative Validation).
- **Recommended Screenshots to Paste in Google Doc:**
  1. Login screen with 3 Role Portals + Demo Access + Negative Validation banner
  2. Student Portal feed + Apply on Beep modal + `New Job Posted` scroll toast
  3. Recruiter Studio (`Borivali` -> `Mumbai` preview, `Apply Suggested Tags`, Senior role rejection, Student Applicants contact cards)
  4. Admin Dashboard (`300` unique jobs, `93` duplicates removed, `₹8.94` / 1k rate + `₹2.68` run cost, 50-Job Accuracy 94%/96% sheet)
  5. Imported Google Sheet showing [all_200_plus_jobs.csv](data/all_200_plus_jobs.csv) (300 jobs) & [hand_checked_50_posts.csv](data/hand_checked_50_posts.csv) (50 audited jobs)
