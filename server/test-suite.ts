import assert from 'assert';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execFileAsync = promisify(execFile);
const BASE_URL = 'http://localhost:3000';

interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

async function runTest(id: string, name: string, fn: () => Promise<string>) {
  try {
    const details = await fn();
    results.push({ id, name, passed: true, details });
    console.log(`✅ [PASS] ${id}: ${name} -> ${details}`);
  } catch (err: any) {
    const msg = err?.message || String(err);
    results.push({ id, name, passed: false, details: msg });
    console.error(`❌ [FAIL] ${id}: ${name} -> ${msg}`);
  }
}

async function fetchJson(urlPath: string, options?: RequestInit): Promise<{ status: number; data: any }> {
  const res = await fetch(`${BASE_URL}${urlPath}`, options);
  const data = await res.json();
  return { status: res.status, data };
}

async function main() {
  console.log('================================================================');
  console.log('BEEP CAREER PLATFORM — END-TO-END AUTOMATED TEST SUITE');
  console.log('================================================================\n');

  await runTest('TC-01', 'Verify 200+ Real India Fresher/Internship Posts & Taxonomy Metadata', async () => {
    const { status, data } = await fetchJson('/api/meta');
    assert.strictEqual(status, 200, 'Expected HTTP 200');
    assert.ok(data.total_unique_jobs >= 200, `Expected >= 200 jobs, got ${data.total_unique_jobs}`);
    assert.ok(data.total_duplicates_removed >= 30, `Expected >= 30 duplicates removed, got ${data.total_duplicates_removed}`);
    assert.strictEqual(data.roles_taxonomy.length, 14, 'Expected 14 canonical roles');
    assert.strictEqual(data.cities_taxonomy.length, 14, 'Expected 14 canonical Indian cities');
    return `${data.total_unique_jobs} unique jobs active, ${data.total_duplicates_removed} duplicates removed`;
  });

  await runTest('TC-02', 'Role Authentication — Student Login (student@eventbeep.com)', async () => {
    const { status, data } = await fetchJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@eventbeep.com', password: 'student123' })
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.user.role, 'user');
    assert.ok(data.token, 'JWT token must be returned');
    return `Logged in as ${data.user.name} (role=${data.user.role})`;
  });

  await runTest('TC-03', 'Role Authentication — Recruiter Login (recruiter@eventbeep.com)', async () => {
    const { status, data } = await fetchJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'recruiter@eventbeep.com', password: 'recruiter123' })
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.user.role, 'recruiter');
    assert.ok(data.token);
    return `Logged in as ${data.user.name} (role=${data.user.role})`;
  });

  await runTest('TC-04', 'Role Authentication — Admin Login & Invalid Credentials Rejection', async () => {
    const { status, data } = await fetchJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@eventbeep.com', password: 'admin123' })
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.user.role, 'admin');

    const bad = await fetchJson('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@eventbeep.com', password: 'wrongpassword' })
    });
    assert.strictEqual(bad.status, 401, 'Invalid password must return 401');
    return `Admin login verified & 401 rejection on bad password confirmed`;
  });

  await runTest('TC-05', 'Full-Text Search & Role/City Filter Precision', async () => {
    const { status, data } = await fetchJson('/api/jobs?role=Software%20Engineering&city=Bengaluru');
    assert.strictEqual(status, 200);
    assert.ok(data.items.length > 0, 'Expected Bengaluru Software Engineering jobs');
    for (const j of data.items) {
      assert.strictEqual(j.role_tag, 'Software Engineering');
      assert.strictEqual(j.city, 'Bengaluru');
    }

    const searchRes = await fetchJson('/api/jobs?q=Pune');
    assert.ok(searchRes.data.total_filtered > 0, 'Expected search results for Pune');
    return `Filtered ${data.total_filtered} Bengaluru SWE roles & ${searchRes.data.total_filtered} 'Pune' search matches`;
  });

  await runTest('TC-06', 'Python LLM Tagger (tagger/tag_jobs.py) — Sub-locality City & Role Tagging', async () => {
    const { status, data } = await fetchJson('/api/tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Product Design (UI/UX) Intern - Figma',
        company: 'Beep Design Studio',
        location_raw: 'Hinjewadi Phase 2, Pune (Hybrid)',
        description: 'Design mobile app flows and UI components in Figma for 1M+ college students.'
      })
    });
    assert.strictEqual(status, 200);
    assert.strictEqual(data.role_tag, 'Product Design (UI/UX)');
    assert.strictEqual(data.city, 'Pune');
    assert.ok(data.confidence >= 0.85);
    return `'Hinjewadi Phase 2, Pune' -> '${data.city}', Role -> '${data.role_tag}' (Conf: ${data.confidence})`;
  });

  let newlyCreatedJobId = 0;
  await runTest('TC-07', 'Recruiter Job Creation & 3-Layer Duplicate Guard Enforcement', async () => {
    const uniqueTitle = `Gen AI & Autonomous Agents Intern (Test ${Date.now()})`;
    const postRes = await fetchJson('/api/recruiter/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: uniqueTitle,
        company: 'Beep Careers',
        location_raw: 'Baner, Pune',
        stipend_or_salary: '₹45,000 / month',
        job_type: 'Internship',
        skills: 'Python, Gemini API, TypeScript, PostgreSQL',
        description: 'Build multi-agent LLM workflows and scrapers at our Baner, Pune HQ.'
      })
    });
    assert.strictEqual(postRes.status, 200, 'New unique job should be created');
    assert.strictEqual(postRes.data.job.city, 'Pune');
    assert.strictEqual(postRes.data.job.role_tag, 'Data Science & AI/ML');
    newlyCreatedJobId = postRes.data.job.id;

    const dupeRes = await fetchJson('/api/recruiter/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `[Hiring Urgent] ${uniqueTitle} (2026 Batch)`,
        company: 'Beep Careers India Pvt. Ltd.',
        location_raw: 'Pune, Maharashtra',
        description: 'Duplicate submission test'
      })
    });
    assert.strictEqual(dupeRes.status, 409, 'Duplicate job submission MUST be blocked with HTTP 409');
    return `Created Job #${newlyCreatedJobId} & blocked near-duplicate with HTTP 409 (${dupeRes.data.duplicate_layer})`;
  });

  if (newlyCreatedJobId > 0) {
    await fetchJson(`/api/recruiter/jobs/${newlyCreatedJobId}`, { method: 'DELETE' });
  }

  await runTest('TC-08', 'Student Portal — Bookmark/Save Job Toggle & Apply Click Counter', async () => {
    const toggle1 = await fetchJson('/api/user/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 1, job_id: 15 })
    });
    assert.strictEqual(toggle1.status, 200);
    const firstState = toggle1.data.saved;

    const toggle2 = await fetchJson('/api/user/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 1, job_id: 15 })
    });
    assert.strictEqual(toggle2.data.saved, !firstState);

    const clickRes = await fetchJson('/api/jobs/1/click', { method: 'POST' });
    assert.strictEqual(clickRes.status, 200);
    assert.ok(clickRes.data.apply_clicks > 0);
    return `Bookmark toggle verified & Job #1 apply_clicks=${clickRes.data.apply_clicks}`;
  });

  await runTest('TC-09', 'Human-in-the-Loop Tag Correction Queue (Student Submit -> Admin Resolve)', async () => {
    const submitCorr = await fetchJson('/api/jobs/5/report-tag', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        corrected_role: 'Product Design (UI/UX)',
        corrected_city: 'Bengaluru',
        reason: 'Automated test verification of tag feedback pipeline',
        user_id: 1,
        user_name: 'Mohdaqib (Student)',
        user_role: 'user'
      })
    });
    assert.strictEqual(submitCorr.status, 200);
    const corrId = submitCorr.data.correction.id;

    const resolveCorr = await fetchJson(`/api/admin/corrections/${corrId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'dismiss' })
    });
    assert.strictEqual(resolveCorr.status, 200);
    assert.strictEqual(resolveCorr.data.correction.status, 'dismissed');
    return `Created & resolved Tag Correction #${corrId}`;
  });

  await runTest('TC-10', '50-Post Hand-Checked Evaluation & Cost per 1,000 Posts Benchmark', async () => {
    const { status, data } = await fetchJson('/api/eval');
    assert.strictEqual(status, 200);
    assert.strictEqual(data.samples.length, 50, 'Must have exactly 50 hand-checked posts');
    assert.strictEqual(data.metrics.role_accuracy_pct, 94.0);
    assert.strictEqual(data.metrics.city_accuracy_pct, 96.0);
    assert.strictEqual(data.metrics.joint_accuracy_pct, 92.0);
    assert.strictEqual(
      data.metrics.cost_metrics.paid_rate_per_1000_posts_batched_flash_lite.usd,
      0.0333
    );

    const evalPyPath = path.join(process.cwd(), 'tagger', 'evaluate.py');
    const { stdout } = await execFileAsync('python', [evalPyPath]);
    const pyReport = JSON.parse(stdout.trim());
    assert.strictEqual(pyReport.total_hand_checked, 50);
    return `50/50 audited: Role=${pyReport.role_accuracy_pct}%, City=${pyReport.city_accuracy_pct}%, Cost=$${pyReport.cost_per_1000_posts_usd} (₹${pyReport.cost_per_1000_posts_inr})/1k posts`;
  });

  await runTest('TC-11', 'Google Sheets CSV Exports (50-Post Audit CSV & All 242+ Jobs CSV)', async () => {
    const res50 = await fetch(`${BASE_URL}/api/export/eval-50.csv`);
    assert.strictEqual(res50.status, 200);
    const text50 = await res50.text();
    const lines50 = text50.trim().split('\n');
    assert.strictEqual(lines50.length, 51, 'Expected 1 header + 50 sample rows');

    const resAll = await fetch(`${BASE_URL}/api/export/all-jobs.csv`);
    assert.strictEqual(resAll.status, 200);
    const textAll = await resAll.text();
    const linesAll = textAll.trim().split('\n');
    assert.ok(linesAll.length >= 201, `Expected >= 201 lines in all-jobs.csv, got ${linesAll.length}`);
    return `eval-50.csv (${lines50.length} rows) & all-jobs.csv (${linesAll.length} rows) verified`;
  });

  await runTest('TC-12', 'Direct Student Application on Beep & Recruiter Applicant Directory', async () => {
    const testEmail = `test.applicant.${Date.now()}@pict.edu`;
    const applyRes = await fetchJson('/api/jobs/2/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: 1,
        student_name: 'Siddharth Joshi',
        student_email: testEmail,
        student_phone: '+91 98111 22334',
        college: 'PICT Pune',
        graduation_year: '2026',
        resume_url: 'https://github.com/siddharth',
        skills: 'Figma, UI/UX, React',
        cover_note: 'Direct application test for recruiters without a company website.'
      })
    });
    assert.strictEqual(applyRes.status, 200);
    const appId = applyRes.data.application.id;

    const recList = await fetchJson('/api/recruiter/applications?job_id=2');
    assert.strictEqual(recList.status, 200);
    assert.ok(recList.data.applications.some((a: any) => a.id === appId));

    const statusUpdate = await fetchJson(`/api/recruiter/applications/${appId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Shortlisted' })
    });
    assert.strictEqual(statusUpdate.status, 200);
    assert.strictEqual(statusUpdate.data.application.status, 'Shortlisted');
    return `Student applied on Beep (#${appId}), Recruiter viewed contact details & updated status to 'Shortlisted'`;
  });

  console.log('\n================================================================');
  const passedCount = results.filter((r) => r.passed).length;
  console.log(`FINAL RESULT: ${passedCount}/${results.length} TEST CASES PASSED`);
  console.log('================================================================');
  if (passedCount !== results.length) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
