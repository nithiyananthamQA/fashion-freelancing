/**
 * Matching — plan §9.
 *
 * Explainable, not a hidden score. Each rule that fires contributes a fixed
 * weight AND a sentence fragment, so the reason shown to the company is
 * generated from the same evaluation that produced the ranking. If a rule
 * cannot be explained in one clause, it does not belong here yet.
 */
import { all, readList } from './db';

export interface MatchCandidate {
  profile_id: string;
  handle: string | null;
  name: string;
  headline: string | null;
  availability: string | null;
  rate_min: number | null;
  rate_max: number | null;
  years_experience: number | null;
  languages: string | null;
  timezone: string | null;
  service_id: string;
  specialties: string;
  skill_ids: string;
  tool_ids: string;
  stack_ids: string;
  portfolio_count: number;
}

export interface Requirements {
  serviceId: string;
  specialties: string[];
  skillIds: string[];
  toolIds: string[];
  stackIds: string[];
  languages: string[];
  minExperience: number | null;
  budgetMax: number | null;
  serviceName: string;
  /** Display names keyed by id, so the reason reads in plain language. */
  labels: Record<string, string>;
}

export interface Match {
  profileId: string;
  handle: string | null;
  name: string;
  score: number;
  /** One sentence, shown verbatim under the recommendation. */
  reason: string;
}

const WEIGHTS = {
  specialty: 5,
  skill: 3,
  tool: 2,
  stack: 3,
  availability: 4,
  budget: 4,
  language: 2,
  experience: 2,
  portfolio: 1,
} as const;

const AVAILABLE_SOON = new Set(['available_now', 'in_2_weeks', 'this_month']);

/**
 * Rank the specialists who offer the required service. Service is a hard
 * filter — everything else contributes weight, so a thin brief still returns
 * a usable, explainable list rather than nothing.
 */
export function rank(candidates: MatchCandidate[], req: Requirements, limit = 20): Match[] {
  const label = (id: string): string => req.labels[id] ?? id;

  const matches = candidates.map((candidate): Match => {
    let score = 0;
    const because: string[] = [`offers ${req.serviceName}`];

    const specialties = readList(candidate.specialties);
    const hitSpecialties = req.specialties.filter((id) => specialties.includes(id));
    if (hitSpecialties.length) {
      score += hitSpecialties.length * WEIGHTS.specialty;
      because.push(hitSpecialties.map(label).join(', '));
    }

    const skills = readList(candidate.skill_ids);
    const hitSkills = req.skillIds.filter((id) => skills.includes(id));
    if (hitSkills.length) {
      score += hitSkills.length * WEIGHTS.skill;
      because.push(hitSkills.slice(0, 3).map(label).join(', '));
    }

    const tools = readList(candidate.tool_ids);
    const hitTools = req.toolIds.filter((id) => tools.includes(id));
    if (hitTools.length) {
      score += hitTools.length * WEIGHTS.tool;
      because.push(hitTools.slice(0, 3).map(label).join(', '));
    }

    const stack = readList(candidate.stack_ids);
    const hitStack = req.stackIds.filter((id) => stack.includes(id));
    if (hitStack.length) {
      score += hitStack.length * WEIGHTS.stack;
      because.push(hitStack.slice(0, 4).map(label).join(', '));
    }

    if (candidate.availability && AVAILABLE_SOON.has(candidate.availability)) {
      score += WEIGHTS.availability;
      because.push(candidate.availability === 'available_now' ? 'is available now' : 'is available this month');
    }

    // Budget fits when the specialist's floor is within what the company can pay.
    if (req.budgetMax !== null && candidate.rate_min !== null && candidate.rate_min <= req.budgetMax) {
      score += WEIGHTS.budget;
      because.push('fits the budget');
    }

    const languages = readList(candidate.languages);
    const hitLanguages = req.languages.filter((l) => languages.includes(l));
    if (hitLanguages.length) {
      score += WEIGHTS.language;
      because.push(`works in ${hitLanguages.join(' and ')}`);
    }

    if (req.minExperience !== null && (candidate.years_experience ?? 0) >= req.minExperience) {
      score += WEIGHTS.experience;
      because.push(`has ${candidate.years_experience} years of experience`);
    }

    if (candidate.portfolio_count > 0) score += Math.min(candidate.portfolio_count, 4) * WEIGHTS.portfolio;

    return {
      profileId: candidate.profile_id,
      handle: candidate.handle,
      name: candidate.name,
      score,
      reason: sentence(candidate.name, because),
    };
  });

  return matches.sort((a, b) => b.score - a.score).slice(0, limit);
}

/** "Recommended because this specialist offers X, Y, and is available now." */
function sentence(_name: string, parts: string[]): string {
  const unique = [...new Set(parts.filter(Boolean))];
  if (unique.length === 1) return `Recommended because this specialist ${unique[0]}.`;
  const last = unique[unique.length - 1]!;
  return `Recommended because this specialist ${unique.slice(0, -1).join(', ')}, and ${last}.`;
}

/**
 * Load every approved specialist offering a service, with the counts the
 * ranking needs. Deliberately one query — the candidate pool per service is
 * small enough to rank in the worker, and it keeps the reason logic in one
 * readable place rather than spread across SQL.
 */
export function loadCandidates(database: D1Database, serviceId: string): Promise<MatchCandidate[]> {
  return all<MatchCandidate>(
    database,
    `SELECT p.id AS profile_id, p.handle, u.name, p.headline, p.availability,
            p.rate_min, p.rate_max, p.years_experience, p.languages, p.timezone,
            o.service_id, o.specialties, o.skill_ids, o.tool_ids, o.stack_ids,
            (SELECT COUNT(*) FROM portfolio_items pi
              WHERE pi.profile_id = p.id AND pi.moderation = 'approved') AS portfolio_count
       FROM specialist_profiles p
       JOIN users u ON u.id = p.user_id
       JOIN specialist_service_offerings o ON o.profile_id = p.id
      WHERE p.status = 'approved' AND o.service_id = ?`,
    serviceId,
  );
}
