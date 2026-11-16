import crypto from 'crypto';
import { DuplicateLog, JobPost } from './types';

export function canonicalizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.trim());
    parsed.protocol = 'https:';
    parsed.hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');
    const dropParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'source', 'fbclid', 'gclid'];
    for (const p of dropParams) {
      parsed.searchParams.delete(p);
    }
    parsed.hash = '';
    let cleanPath = parsed.pathname.replace(/\/+$/, '');
    if (!cleanPath) cleanPath = '/';
    parsed.pathname = cleanPath;
    return parsed.toString();
  } catch {
    return rawUrl.trim().toLowerCase().replace(/\/+$/, '');
  }
}

export function normalizeCompanyName(company: string): string {
  return (company || 'unknown')
    .toLowerCase()
    .replace(/\b(private limited|pvt\.?\s*ltd\.?|limited|ltd\.?|inc\.?|llc|llp|india|technologies|technology|tech|solutions|labs|software|systems|global|services)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim() || (company || 'unknown').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function normalizeJobTitle(title: string): string {
  return (title || '')
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, ' ')
    .replace(/\b(hiring|urgent|immediate|opening|for|freshers?|graduates?|2024|2025|2026|batch|india|remote|hybrid|onsite|on-site)\b/g, ' ')
    .replace(/\b(swe|sde)\b/g, 'software engineer')
    .replace(/\b(jr\.?|junior|associate|trainee)\b/g, 'fresher')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function computeDedupeHash(company: string, title: string, city: string): string {
  const normComp = normalizeCompanyName(company);
  const normTitle = normalizeJobTitle(title);
  const normCity = (city || 'remote').toLowerCase().replace(/[^a-z0-9]/g, '');
  const payload = `${normComp}::${normTitle}::${normCity}`;
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 24);
}

function getBigrams(str: string): Set<string> {
  const s = str.toLowerCase().replace(/\s+/g, ' ').trim();
  const bigrams = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) {
    bigrams.add(s.slice(i, i + 2));
  }
  return bigrams;
}

export function diceSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  if (a.length < 2 || b.length < 2) return 0;
  const bgA = getBigrams(a);
  const bgB = getBigrams(b);
  if (bgA.size === 0 || bgB.size === 0) return 0;
  let intersection = 0;
  for (const item of bgA) {
    if (bgB.has(item)) intersection++;
  }
  return (2.0 * intersection) / (bgA.size + bgB.size);
}

export interface DedupeCheckResult {
  isDuplicate: boolean;
  matchedJob?: JobPost;
  layer?: DuplicateLog['layer'];
  similarityScore?: number;
}

export function checkDuplicate(
  candidate: {
    title: string;
    company: string;
    canonical_url: string;
    dedupe_hash: string;
    city: string;
  },
  existingJobs: JobPost[]
): DedupeCheckResult {
  const urlMatch = existingJobs.find((j) => j.canonical_url === candidate.canonical_url);
  if (urlMatch) {
    return {
      isDuplicate: true,
      matchedJob: urlMatch,
      layer: 'Layer 1: Canonical URL',
      similarityScore: 1.0
    };
  }

  const hashMatch = existingJobs.find((j) => j.dedupe_hash === candidate.dedupe_hash);
  if (hashMatch) {
    return {
      isDuplicate: true,
      matchedJob: hashMatch,
      layer: 'Layer 2: SHA-256 Entity Hash',
      similarityScore: 0.98
    };
  }

  const candComp = normalizeCompanyName(candidate.company);
  const candTitle = normalizeJobTitle(candidate.title);

  for (const job of existingJobs) {
    const jobComp = normalizeCompanyName(job.company);
    if (jobComp && candComp && jobComp === candComp && job.city === candidate.city) {
      const jobTitle = normalizeJobTitle(job.title);
      const sim = diceSimilarity(candTitle, jobTitle);
      if (sim >= 0.84) {
        return {
          isDuplicate: true,
          matchedJob: job,
          layer: 'Layer 3: Fuzzy Token Similarity',
          similarityScore: Number(sim.toFixed(2))
        };
      }
    }
  }

  return { isDuplicate: false };
}
