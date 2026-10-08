/**
 * Work under way — how an engagement starts, moves and ends, and how the
 * request or project that started it follows (plan §9, "Engagement states").
 *
 * Both parents have states that run on past the hire. A project goes
 * Hired → In progress → Delivered → Completed; a request goes Accepted →
 * Active engagement → Completed / Closed. Those used to stay wherever the hire
 * left them, so a job finished months ago still read "someone hired" on the
 * company's project list, and nothing stopped a replayed accept from opening a
 * second engagement on the same request. Every move goes through here, guarded
 * on the state it is allowed to leave, with its parent carried along in the
 * same D1 batch — which is a transaction, so the two can never disagree.
 */
import { newId, nowIso } from '../ids';

/** A request to hire either side can still act on. */
export const OPEN_REQUEST = ['sent', 'viewed', 'question', 'proposal'] as const;

/** A posted project still taking replies, so a decision on one can still be made. */
export const OPEN_PROJECT = ['published', 'responding', 'shortlisted'] as const;

/** A reply to a project still waiting on the company. */
export const UNDECIDED_REPLY = ['submitted', 'shortlisted'] as const;

/** Work that is neither finished, called off, nor with our team as a dispute. */
export const LIVE_WORK = ['active', 'delivered', 'revision'] as const;

export type WorkStatus = 'active' | 'delivered' | 'revision' | 'completed' | 'closed' | 'disputed';

/*
 * Where each parent goes when the work moves. A dispute moves neither: the
 * project is still in progress and the request still active until our team
 * settles it one way or the other.
 */
const PROJECT_FOLLOWS: Partial<Record<WorkStatus, string>> = {
  active: 'in_progress',
  revision: 'in_progress',
  delivered: 'delivered',
  completed: 'completed',
  closed: 'closed',
};

const REQUEST_FOLLOWS: Partial<Record<WorkStatus, string>> = {
  active: 'active',
  revision: 'active',
  delivered: 'active',
  completed: 'completed',
  closed: 'closed',
};

const marks = (values: readonly string[]): string => values.map(() => '?').join(',');

/**
 * A request to hire becomes work. Called when the specialist accepts the brief
 * and when the company accepts the specialist's price, so `from` is whichever
 * states that side may accept from.
 *
 * Idempotent: the engagement is inserted only while the request is still in
 * one of those states AND has no engagement yet, so a double click, a replayed
 * form or both sides accepting at once all end with exactly one. The request
 * goes straight to 'active' — the engagement starts in the same transaction as
 * the agreement, so there is no moment at which it is merely 'accepted'.
 */
export async function startFromRequest(
  database: D1Database,
  requestId: string,
  from: readonly string[],
): Promise<{ engagementId: string; created: boolean }> {
  const engagementId = newId();
  const now = nowIso();
  const [insert] = await database.batch([
    database.prepare(
      `INSERT INTO engagements (id, company_id, profile_id, hire_request_id, title, status, created_at, updated_at)
       SELECT ?, h.company_id, h.profile_id, h.id, h.title, 'active', ?, ?
         FROM hire_requests h
        WHERE h.id = ? AND h.status IN (${marks(from)})
          AND NOT EXISTS (SELECT 1 FROM engagements e WHERE e.hire_request_id = h.id)`,
    ).bind(engagementId, now, now, requestId, ...from),
    database.prepare(
      `UPDATE hire_requests SET status = 'active', updated_at = ?
        WHERE id = ? AND EXISTS (SELECT 1 FROM engagements WHERE id = ?)`,
    ).bind(now, requestId, engagementId),
  ]);
  return { engagementId, created: (insert?.meta.changes ?? 0) > 0 };
}

/**
 * A company hires one of the people who replied to its project.
 *
 * One hire per project: the engagement is inserted only while the reply is
 * undecided, the project is still open and nobody holds an engagement on it
 * yet. If — and only if — that insert happened, the same batch marks the reply
 * hired, moves the project on, and declines every other reply still waiting,
 * because the company was told "hiring closes this project to everyone else"
 * and a reply left 'submitted' on a filled project leaves its sender waiting
 * on a decision that has already been made.
 *
 * Returns the replies it declined, so the caller can tell each of them.
 */
export async function startFromApplication(
  database: D1Database,
  applicationId: string,
  companyId: string,
): Promise<{ engagementId: string; created: boolean; declined: { owner_user: string; title: string }[] }> {
  const engagementId = newId();
  const now = nowIso();
  const made = 'EXISTS (SELECT 1 FROM engagements WHERE id = ?)';
  const [insert] = await database.batch([
    database.prepare(
      `INSERT INTO engagements (id, company_id, profile_id, project_id, title, status, created_at, updated_at)
       SELECT ?, p.company_id, a.profile_id, p.id, p.title, 'active', ?, ?
         FROM applications a
         JOIN projects p ON p.id = a.project_id
        WHERE a.id = ? AND p.company_id = ?
          AND a.status IN (${marks(UNDECIDED_REPLY)})
          AND p.status IN (${marks(OPEN_PROJECT)})
          AND NOT EXISTS (SELECT 1 FROM engagements e WHERE e.project_id = p.id)`,
    ).bind(engagementId, now, now, applicationId, companyId, ...UNDECIDED_REPLY, ...OPEN_PROJECT),
    database.prepare(
      `UPDATE applications SET status = 'hired', updated_at = ? WHERE id = ? AND ${made}`,
    ).bind(now, applicationId, engagementId),
    // the work starts 'active', so the project goes where active work takes it
    database.prepare(
      `UPDATE projects SET status = 'in_progress', updated_at = ?
        WHERE id = (SELECT project_id FROM engagements WHERE id = ?)`,
    ).bind(now, engagementId),
    database.prepare(
      `UPDATE applications SET status = 'declined', updated_at = ?
        WHERE project_id = (SELECT project_id FROM engagements WHERE id = ?)
          AND id != ? AND status IN (${marks(UNDECIDED_REPLY)})`,
    ).bind(now, engagementId, applicationId, ...UNDECIDED_REPLY),
  ]);

  const created = (insert?.meta.changes ?? 0) > 0;
  if (!created) return { engagementId, created, declined: [] };

  /* Read back by the timestamp this batch stamped, which picks out exactly the
     replies it declined and none that were declined by hand before. */
  const declined = await database
    .prepare(
      `SELECT u.id AS owner_user, p.title
         FROM applications a
         JOIN projects p ON p.id = a.project_id
         JOIN specialist_profiles sp ON sp.id = a.profile_id
         JOIN users u ON u.id = sp.user_id
        WHERE a.project_id = (SELECT project_id FROM engagements WHERE id = ?)
          AND a.status = 'declined' AND a.updated_at = ?`,
    )
    .bind(engagementId, now)
    .all<{ owner_user: string; title: string }>();
  return { engagementId, created, declined: declined.results ?? [] };
}

/**
 * Move the work from one of `from` to `to`, and its parent with it. Returns
 * false when the work was not in one of those states — a replayed form, or the
 * other side having acted first — and then nothing at all is written.
 *
 * The parents are matched on the engagement's new status AND the timestamp
 * this call stamped, so they only follow a move this call actually made. The
 * operations team closing or settling a dispute should come through here too,
 * so the project and request never disagree with the work.
 */
export async function moveEngagement(
  database: D1Database,
  engagementId: string,
  from: readonly WorkStatus[],
  to: WorkStatus,
): Promise<boolean> {
  const now = nowIso();
  const project = PROJECT_FOLLOWS[to];
  const request = REQUEST_FOLLOWS[to];

  const statements = [
    database.prepare(
      `UPDATE engagements SET status = ?, updated_at = ? WHERE id = ? AND status IN (${marks(from)})`,
    ).bind(to, now, engagementId, ...from),
  ];
  if (project) {
    statements.push(database.prepare(
      `UPDATE projects SET status = ?, updated_at = ?
        WHERE id = (SELECT project_id FROM engagements WHERE id = ? AND status = ? AND updated_at = ?)`,
    ).bind(project, now, engagementId, to, now));
  }
  if (request) {
    statements.push(database.prepare(
      `UPDATE hire_requests SET status = ?, updated_at = ?
        WHERE id = (SELECT hire_request_id FROM engagements WHERE id = ? AND status = ? AND updated_at = ?)`,
    ).bind(request, now, engagementId, to, now));
  }

  const [moved] = await database.batch(statements);
  return (moved?.meta.changes ?? 0) > 0;
}
