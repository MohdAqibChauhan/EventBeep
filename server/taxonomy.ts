import fs from 'fs';
import path from 'path';

const taxonomyPath = path.join(process.cwd(), 'config', 'taxonomy.json');
const taxonomyData = JSON.parse(fs.readFileSync(taxonomyPath, 'utf8'));

export const ROLE_TAXONOMY: string[] = taxonomyData.roles;
export type CanonicalRole = string;

export const CANONICAL_CITIES: string[] = taxonomyData.cities;
export type CanonicalCity = string;

const CITY_ALIASES: Array<{ pattern: RegExp; city: string }> = taxonomyData.city_aliases.map(
  (entry: { pattern: string; city: string }) => ({
    pattern: new RegExp(entry.pattern, 'i'),
    city: entry.city
  })
);

const ROLE_RULES: Array<{ pattern: RegExp; role: string; confidence: number; reason: string }> =
  taxonomyData.role_rules.map((r: { pattern: string; role: string; confidence: number; reason: string }) => ({
    pattern: new RegExp(r.pattern, 'i'),
    role: r.role,
    confidence: r.confidence,
    reason: r.reason
  }));

export function normalizeCity(
  locationRaw: string,
  description = ''
): { city: CanonicalCity; work_mode: 'On-site' | 'Remote' | 'Hybrid' } {
  const combined = `${locationRaw || ''} ${description.slice(0, 300)}`.toLowerCase();
  const rawLower = (locationRaw || '').toLowerCase();

  let work_mode: 'On-site' | 'Remote' | 'Hybrid' = 'On-site';
  if (/\b(hybrid)\b/i.test(combined)) {
    work_mode = 'Hybrid';
  } else if (/\b(remote|wfh|work from home)\b/i.test(rawLower)) {
    work_mode = 'Remote';
  }

  const matchedCities = new Set<string>();
  for (const { pattern, city } of CITY_ALIASES) {
    if (city !== 'Remote (India)' && city !== 'Pan-India / Multiple' && pattern.test(rawLower)) {
      matchedCities.add(city);
    }
  }

  if (matchedCities.size >= 3) {
    return { city: 'Pan-India / Multiple', work_mode };
  }
  if (matchedCities.size >= 1) {
    return { city: Array.from(matchedCities)[0], work_mode };
  }

  for (const sourceText of [rawLower, combined]) {
    for (const { pattern, city } of CITY_ALIASES) {
      if (pattern.test(sourceText)) {
        return { city, work_mode: city === 'Remote (India)' ? 'Remote' : work_mode };
      }
    }
  }

  return { city: 'Remote (India)', work_mode: 'Remote' };
}

export function classifyRoleRuleBased(
  title: string,
  description = '',
  skills: string[] = []
): {
  role_tag: CanonicalRole;
  confidence: number;
  reasoning: string;
} {
  const t = (title || '').toLowerCase();
  const d = `${(description || '').slice(0, 500)} ${skills.join(' ')}`.toLowerCase();

  for (const rule of ROLE_RULES) {
    if (rule.pattern.test(t)) {
      return { role_tag: rule.role, confidence: rule.confidence, reasoning: rule.reason };
    }
  }

  for (const rule of ROLE_RULES) {
    if (rule.pattern.test(d)) {
      return {
        role_tag: rule.role,
        confidence: Number((rule.confidence - 0.05).toFixed(2)),
        reasoning: `${rule.reason} Inferred from description.`
      };
    }
  }

  return {
    role_tag: 'Operations & Strategy',
    confidence: 0.82,
    reasoning: 'General graduate or fresher role classified under Operations & Strategy.'
  };
}
