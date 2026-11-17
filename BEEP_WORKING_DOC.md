# EventBeep (`@beepcareers`) — AI-Tagged India Fresher & Internship Job Platform
### Gen AI & Engineering Working Document: Data, AI Tools, Prompts & Proof

| Resource | Public Link |
|---|---|
| **5-Minute Walkthrough Video (Loom)** | **https://www.loom.com/share/b84c8bb5b45244d5afb19656edb9b4bf** |
| **Live Deployed Web Application** | **https://eventbeep.vercel.app** |
| **Interactive Online Working Doc** | **https://eventbeep.vercel.app/working-doc.html** |
| **Downloadable Working Doc (PDF / Word)** | [EventBeep_Working_Doc.pdf](https://eventbeep.vercel.app/EventBeep_Working_Doc.pdf) · [EventBeep_Working_Doc.doc](https://eventbeep.vercel.app/EventBeep_Working_Doc.doc) |
| **Public GitHub Repository** | **https://github.com/MohdAqibChauhan/EventBeep** |
| **Raw & Tagged Jobs Dataset (300 Jobs CSV)** | [all_200_plus_jobs.csv](https://eventbeep.vercel.app/all_200_plus_jobs.csv) |
| **50-Job Hand-Checked Accuracy Audit CSV** | [hand_checked_50_posts.csv](https://eventbeep.vercel.app/hand_checked_50_posts.csv) |

---

## 1. Executive Metrics Summary

| Deliverable | Verified Result |
|---|---|
| **Unique Fresher & Internship Jobs Live** | **300 active jobs** (goal: 200+), collected from **390 raw listings** across **23 compliant public sources** |
| **Cross-Board Duplicates Caught & Removed** | **93 duplicates (23.8%)** removed *before* LLM tagging via 3-layer deduplication (`22` Exact URL + `53` Entity Hash + `18` Fuzzy Match) |
| **50-Job Hand-Checked AI Accuracy** | **94.0% Role Accuracy (47/50)** · **96.0% City Accuracy (48/50)** · **92.0% Combined Exact Match (46/50)** |
| **Real Verified Cost per 1,000 Posts** | **₹8.94 (\$0.0950) Standard API** · **₹4.47 (\$0.0475) Gemini Batch API (50% off)** · **₹0.00 Free Tier** (`98` in + `47` out tokens/job) |
| **Automated Quality Verification** | **13 / 13 End-to-End Test Cases Passing** (`npm test`) · `0` Senior/Manager/Staff jobs in feed |

---

## 2. Live Portal Access Credentials (1-Click Auto-Fill Enabled on Login Page)

| Portal Role | Email ID | Password | Core Capabilities |
|---|---|---|---|
| **🎓 Student / User** | `student@eventbeep.com` | `student123` | Search & filter 300+ verified fresher/intern jobs across 14 roles and 15 locations, bookmark jobs, 1-click **Apply on Beep**, suggest tag edits, and receive **zero-refresh live job injection** while scrolling |
| **💼 Recruiter** | `recruiter@eventbeep.com` | `recruiter123` | Post fresher/intern jobs in 60s (optional external URL), preview AI Role & City tags + 1-click **Apply Suggested Tags**, enforce automatic Senior-role & duplicate guards, and contact applicants directly via Email, Call, WhatsApp & Resume links |
| **🛡️ Admin (Only 1 Admin)** | `admin@eventbeep.com` | `admin123` | Monitor daily 6 AM IST sync runs & proportional AI run cost, inspect 3-layer deduplication logs, interactively review the 50-job accuracy sheet & export CSVs, and approve/dismiss student tag edits |

---

## 3. Research Findings & Business Impact

1. **Nearly 1 in 4 aggregated job posts (23.8% — 93 out of 390 raw posts) are cross-board duplicates or tracking-URL clones.**
   - **Where found:** Across 20 official public Greenhouse India company career boards (`server/collectors.ts`), Remotive Public API, Jobicy Public API, and HN Algolia API.
   - **Why it matters:** Simple URL matching leaves students scrolling through duplicate spam caused by `?utm_source` tracking links, `[Urgent]` title tags, and legal entity suffixes (`Razorpay` vs `Razorpay Software Pvt. Ltd.`). Our 3-layer deduplicator (`server/dedupe.ts`) eliminates duplicates *before* calling Gemini — saving ~24% of LLM token spend and ensuring a clean student feed.

2. **Indian neighborhood names and boilerplate HQ addresses break naive city filters.**
   - **Where found:** Across our 300+ collected jobs (`Bengaluru: 154`, `Remote (India): 46`, `Delhi NCR: 36`, `Pune: 33`, `Chennai: 10`, `Mumbai: 10`, `Hyderabad: 6`, `Chandigarh: 4`, `Pan-India: 1`) and during our 50-post manual accuracy audit (`data/hand_checked_50_posts.csv`).
   - **Why it matters:** Indian startups list sub-localities (*Baner*, *Hinjewadi Phase 2*, *Koramangala*, *Borivali*, *Andheri*, *Gurugram*) instead of parent cities — or cite their HQ city inside the job description. Strictly prioritizing `location_raw` over description text and mapping 150+ neighborhoods + `International / Global` (`config/taxonomy.json`) lifted city accuracy to **96.0% (48/50)**.

3. **Public ATS feeds mix Senior/Manager roles into general listings, and early-stage Indian startups often lack career websites.**
   - **Where found:** Inspecting live Greenhouse/Remotive/Jobicy API feeds (which mix Staff/Principal/Manager postings and ambiguous titles like *"Founder's Office Intern"*) alongside Beep recruiter UX flows.
   - **Why it matters:** Blocking senior titles pre-AI keeps the feed 100% relevant for college freshers (0–1 yr), compact 10-job batching on **Gemini 3.1 Flash-Lite** cuts tagging cost to **₹8.94 per 1,000 posts** (**₹4.47** Batch API; **₹0** Free Tier), and optional external career URLs with **1-click Apply on Beep** + **live scroll job injection** allow startups without career websites to hire immediately without forcing students to refresh their feed.

---

## 4. Raw Data Sources & Verified Dataset Breakdown (`300` Unique Jobs)

| Source | Unique Active Jobs | Role Breakdown (`300` Jobs) | Count |
|---|---:|---|---:|
| Greenhouse API (Rubrik India) | 26 | Software Engineering | 99 |
| Greenhouse API (Stripe India) | 26 | Data Science & AI/ML | 47 |
| Greenhouse API (Zscaler / MongoDB India) | 22 each (44) | Operations & Strategy | 42 |
| Greenhouse API (PubMatic) | 20 | Finance & Analyst | 36 |
| Greenhouse API (Elastic / Toast India) | 18 each (36) | Business Development & Sales | 28 |
| Greenhouse API (Razorpay / Okta / Databricks) | 16 each (48) | Backend & Cloud/DevOps | 22 |
| Greenhouse API (Airbnb India) / Jobicy API | 12 each (24) | Marketing & Growth / Content / HR | 6 each (18) |
| Greenhouse API (Agoda / Twilio India) | 11 each (22) | Mobile Development | 3 |
| Greenhouse API (Groww / Druva) / Remotive API | 9 each (27) | Product Design (UI/UX) / Frontend Dev | 2 each (4) |
| Greenhouse API (Coinbase) / Beep Direct / Deliveroo / Anthropic / Figma / HN | 8 / 6 / 5 / 4 / 2 / 2 (27) | Product Management / QA & Testing | 1 + Live |

---

## 5. AI Tools, Tech Stack & Architecture

- **AI & LLM Engine:** Google Gemini 3.1 Flash-Lite (`gemini-3.1-flash-lite`, `responseMimeType: "application/json"`, `temperature: 0.1`), Python 3 worker (`tagger/tag_jobs.py`), `config/taxonomy.json` (14 canonical roles, 14 Indian cities + `International / Global`, 150+ neighborhood aliases).
- **Backend & Collectors:** Node.js, TypeScript, Express.js, JWT + `bcryptjs`, `node-cron` (daily 06:00 AM IST cron), `cheerio`, Server-Sent Events (`/api/stream`).
- **Frontend SPA:** HTML5, CSS3 (`@beepcareers` Neo-Brutalist theme), Vanilla JavaScript (ES2022) with SSE + cross-tab `localStorage` live scroll injection and reload tab/filter persistence.
- **Database, Deployment & QA:** PostgreSQL (`db/schema.sql`) + Dual-Sync JSON store + bundled client fallback, hosted on **Vercel Serverless** + **GitHub**, verified with **13/13** automated test cases (`npm test`).

---

## 6. Exact Prompts Used in Production

### Prompt A — Single-Job Preview & Reasoning (`tagger/tag_jobs.py` -> `SYSTEM_PROMPT`)
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

### Prompt B — Compact 10-Job Batch Prompt (`tagger/tag_jobs.py` -> `call_gemini_batch`)
```text
Tag Indian fresher/internship jobs into role_tag (<14 canonical roles>) and city (<15 canonical locations>). Map Baner/Hinjewadi->Pune, Borivali/Andheri/Powai->Mumbai, HSR/Koramangala->Bengaluru, Gurugram/Noida->Delhi NCR. Return JSON array of {id, role_tag, city, confidence} only.
```

### Prompt C — Express Single-Job Tagger (`server/index.ts` -> `callPythonSingleTagger`)
```text
Classify this Indian fresher/internship job into role_tag (<14 canonical roles>) and city (<15 canonical locations>). Always prioritize location_raw over description when determining city (e.g. Borivali/Andheri/Powai -> Mumbai, Baner/Hinjewadi -> Pune, Koramangala/HSR -> Bengaluru). Return JSON with keys role_tag, city, confidence, reasoning:
<job JSON payload>
```

---

## 7. 50-Post Hand-Checked Evaluation & Verified Cost per 1,000 Posts

### 7.1 Audited Discrepancies (4 of 50 Samples)
| Sample # | Company & Job Title | Raw Location | AI Tag | Human Ground-Truth | Error Analysis |
|---:|---|---|---|---|---|
| **#11** | Razorpay — Security Engineer (Associate / Fresher Track) | `Bengaluru` | Software Engineering / Bengaluru | **Product Management** / Bengaluru | Hybrid security/APM responsibilities in description; addressed via PRD/APM weighting & Admin Tag Suggestion queue. |
| **#23** | Groww — Associate - Content (Digest) | `Bengaluru-VTP, India` | Content & Social Media / Bengaluru | Content & Social Media / **Pan-India / Multiple** | Multi-city eligibility noted in body text while feed API emitted HQ city. |
| **#34** | Druva — Software Engineer (Associate / Fresher Track) | `Hyderabad, Andhra Pradesh, India` | Software Engineering / Hyderabad | **Data Science & AI/ML** / Hyderabad | General SWE title for an AI team requiring PyTorch/vector DBs in the description. |
| **#42** | Airbnb India — Analyst, Advanced Analytics - Gurugram | `Gurugram, India` | Finance & Analyst / Delhi NCR | **Marketing & Growth** / **Remote (India)** | Combines paid growth analytics + initial 3-month remote flexibility in body text. |

### 7.2 Real API Token Usage & Cost (`gemini-3.1-flash-lite`, Measured Live)
- **Exchange Rate & Model Rate:** **\$1 = ₹94.10** · Gemini 3.1 Flash-Lite: **\$0.25 / 1M input**, **\$1.50 / 1M output**
- **Measured Tokens per Job (10-job compact batch):** **98 input tokens** + **47 output tokens**
- **Standard Real-Time Paid API (1,000 Posts):** `(0.098 × $0.25) + (0.047 × $1.50)` = **`$0.0950` (`₹8.94`)**
- **Overnight Gemini Batch API (Daily 6 AM Sync — 50% off):** **`$0.0475` (`₹4.47`)** per 1,000 posts
- **Typical Daily Sync (~300 Unique Jobs):** **`₹1.34` (Batch) – `₹2.68` (Standard)** · **Actual Dev Spend (Free Tier):** **`₹0.00`**

---

## 8. Key Engineering Bugs Caught & Resolved (Demonstrated Live in Loom Video)

1. **Location Boilerplate Override (`Borivali` / `Andheri` -> `Pune`)**: Enforced strict priority on `location_raw` over `description` boilerplate across Python, Node/TS, and client fallback, and expanded neighborhood aliases to 150+ areas + `International / Global`.
2. **Gemini Model `404` & Token Bloat (`₹24.81` -> `₹8.94` / `₹4.47`)**: Upgraded from retired `2.5-flash-lite` to `gemini-3.1-flash-lite` with compact 10-job JSON batches (`98` in / `47` out tokens/job measured live).
3. **Vercel Serverless `NOT_FOUND` & Read-Only FS**: Resolved via `vercel.json` `/api/(.*)` rewrites, static JSON imports (`server/db.ts`, `server/taxonomy.ts`), `/tmp` runtime writes, and bundled `public/seed-data.js` fallback.
4. **Zero-Refresh Live Job Streaming + Senior Role & Negative Validation**: Added SSE + cross-tab scroll-triggered card injection for Students, blocked Senior/Principal/Director titles pre-AI and on recruiter submit, and verified **13/13** automated test cases.
