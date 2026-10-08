/**
 * Conversations — plan §9 ("private messaging") and §15 ("a company can post
 * a project, receive applications, shortlist, message, and hire").
 *
 * A message hangs off exactly one thing: a request to hire, a reply to a
 * posted project, or the work itself once it is under way. Only the first of
 * those ever had a thread, so a company could not ask the person who replied
 * to its project a single question before hiring them, and once the work had
 * started there was nowhere to talk about it at all — a request for changes
 * went out as a notification nobody could read again.
 *
 * Every page that shows or answers a thread comes through here, so who may
 * read and write each of the three kinds is decided in one place rather than
 * re-derived, slightly differently, on each page that happens to show one.
 */
import { all, one, run } from '../db';
import { newId, nowIso } from '../ids';
import { notify } from '../audit';
import { ATTACHMENT_COLUMNS, filesBy, type Attachment } from './attachments';

export type ThreadKind = 'request' | 'reply' | 'work';

/** The reader. A company acts as a team; a specialist as one person. */
export type Side =
  | { as: 'company'; companyId: string }
  | { as: 'specialist'; profileId: string; userId: string };

/** What a form posts to name a thread: the kind and the id it hangs off. */
export const threadKey = (kind: ThreadKind, id: string): string => `${kind}:${id}`;

export interface Message {
  id: string;
  body: string;
  created_at: string;
  sender_name: string;
  /** Sent by the reader's side — for a company, by anyone on the team. */
  mine: boolean;
  files: Attachment[];
}

export interface Thread {
  key: string;
  kind: ThreadKind;
  id: string;
  title: string;
  /** The specialist, or the company, on the other side. */
  otherName: string;
  /** The state of whatever the thread hangs off: the request, the reply or the work. */
  status: string;
  /** Whether a new message may still be written. Reading never closes. */
  open: boolean;
  messages: Message[];
  lastAt: string | null;
  /** The other side spoke last, so the next word is the reader's. */
  theirsLast: boolean;
}

/** A thread proved to belong to the reader, with what is needed to write into it. */
export interface Target {
  kind: ThreadKind;
  id: string;
  title: string;
  otherName: string;
  status: string;
  open: boolean;
  /** Who hears about a new message. */
  recipientId: string | null;
  hireRequestId: string | null;
  projectId: string | null;
  applicationId: string | null;
  engagementId: string | null;
}

/*
 * When each kind stops taking new messages. A request stays writable through
 * the work it turned into; a reply only while the company is still deciding —
 * after that the conversation belongs on the work, or is over; the work itself
 * never closes, because "can you resend the source file?" arrives after sign-off.
 */
function writable(kind: ThreadKind, status: string): boolean {
  if (kind === 'request') return !['draft', 'declined', 'closed'].includes(status);
  if (kind === 'reply') return status === 'submitted' || status === 'shortlisted';
  return true;
}

const isKind = (value: string): value is ThreadKind => value === 'request' || value === 'reply' || value === 'work';

// --- reading ----------------------------------------------------------------

/*
 * The three queries a listing needs, scoped to the reader. Numbered parameters
 * repeat freely, but D1 rejects a bind list longer than the query uses, so the
 * specialist's ?2 (their own user id) is bound only where `mine` reads it.
 */
function scope(side: Side) {
  if (side.as === 'company') {
    return {
      one: [side.companyId],
      two: [side.companyId],
      threads: `
        SELECT 'request' AS kind, h.id, h.title, h.status, u.name AS other_name
          FROM hire_requests h
          JOIN specialist_profiles sp ON sp.id = h.profile_id
          JOIN users u ON u.id = sp.user_id
         WHERE h.company_id = ?1 AND h.status != 'draft'
        UNION ALL
        SELECT 'reply', a.id, p.title, a.status, u.name
          FROM applications a
          JOIN projects p ON p.id = a.project_id
          JOIN specialist_profiles sp ON sp.id = a.profile_id
          JOIN users u ON u.id = sp.user_id
         WHERE p.company_id = ?1
        UNION ALL
        SELECT 'work', e.id, e.title, e.status, u.name
          FROM engagements e
          JOIN specialist_profiles sp ON sp.id = e.profile_id
          JOIN users u ON u.id = sp.user_id
         WHERE e.company_id = ?1`,
      messages: `
           m.hire_request_id IN (SELECT h.id FROM hire_requests h WHERE h.company_id = ?1)
        OR m.application_id IN (SELECT a.id FROM applications a
                                  JOIN projects p ON p.id = a.project_id WHERE p.company_id = ?1)
        OR m.engagement_id IN (SELECT e.id FROM engagements e WHERE e.company_id = ?1)`,
      // a teammate's message is ours, or a colleague's answer reads as the other side's
      mine: 'm.sender_id IN (SELECT cm.user_id FROM company_members cm WHERE cm.company_id = ?1)',
    };
  }
  return {
    one: [side.profileId],
    two: [side.profileId, side.userId],
    threads: `
      SELECT 'request' AS kind, h.id, h.title, h.status, c.name AS other_name
        FROM hire_requests h
        JOIN companies c ON c.id = h.company_id
       WHERE h.profile_id = ?1 AND h.status != 'draft'
      UNION ALL
      SELECT 'reply', a.id, p.title, a.status, c.name
        FROM applications a
        JOIN projects p ON p.id = a.project_id
        JOIN companies c ON c.id = p.company_id
       WHERE a.profile_id = ?1
      UNION ALL
      SELECT 'work', e.id, e.title, e.status, c.name
        FROM engagements e
        JOIN companies c ON c.id = e.company_id
       WHERE e.profile_id = ?1`,
    messages: `
         m.hire_request_id IN (SELECT h.id FROM hire_requests h WHERE h.profile_id = ?1)
      OR m.application_id IN (SELECT a.id FROM applications a WHERE a.profile_id = ?1)
      OR m.engagement_id IN (SELECT e.id FROM engagements e WHERE e.profile_id = ?1)`,
    mine: 'm.sender_id = ?2',
  };
}

/**
 * Every thread the reader is party to — including the ones nobody has written
 * in yet, so a page can put the first message on a card — with the messages
 * and any files sent with them, oldest message first.
 */
export async function listThreads(database: D1Database, side: Side): Promise<Thread[]> {
  const s = scope(side);

  const [heads, rows, files] = await Promise.all([
    all<{ kind: ThreadKind; id: string; title: string; status: string; other_name: string }>(
      database, s.threads, ...s.one,
    ),
    all<{
      id: string; body: string; created_at: string; sender_name: string; mine: number;
      hire_request_id: string | null; application_id: string | null; engagement_id: string | null;
    }>(
      database,
      `SELECT m.id, m.body, m.created_at, m.hire_request_id, m.application_id, m.engagement_id,
              u.name AS sender_name,
              CASE WHEN ${s.mine} THEN 1 ELSE 0 END AS mine
         FROM messages m
         JOIN users u ON u.id = m.sender_id
        WHERE ${s.messages}
        ORDER BY m.created_at, m.id`,
      ...s.two,
    ),
    all<Attachment>(
      database,
      `SELECT ${ATTACHMENT_COLUMNS} FROM attachments at
        WHERE at.scan_status = 'clean'
          AND at.message_id IN (SELECT m.id FROM messages m WHERE ${s.messages})`,
      ...s.one,
    ),
  ]);

  const filesFor = filesBy(files, 'message_id');
  const byThread = new Map<string, Message[]>();
  for (const row of rows) {
    const key = row.hire_request_id ? threadKey('request', row.hire_request_id)
      : row.application_id ? threadKey('reply', row.application_id)
      : row.engagement_id ? threadKey('work', row.engagement_id)
      : null;
    if (!key) continue;
    const list = byThread.get(key) ?? [];
    list.push({
      id: row.id, body: row.body, created_at: row.created_at, sender_name: row.sender_name,
      mine: row.mine === 1, files: filesFor(row.id),
    });
    byThread.set(key, list);
  }

  return heads.map((head) => {
    const key = threadKey(head.kind, head.id);
    const messages = byThread.get(key) ?? [];
    const last = messages[messages.length - 1];
    return {
      key, kind: head.kind, id: head.id, title: head.title, otherName: head.other_name,
      status: head.status, open: writable(head.kind, head.status),
      messages, lastAt: last?.created_at ?? null, theirsLast: last ? !last.mine : false,
    };
  });
}

/** One thread out of a listing, for the page that shows it on its own card. */
export function threadOf(threads: Thread[], kind: ThreadKind, id: string): Thread | undefined {
  const key = threadKey(kind, id);
  return threads.find((t) => t.key === key);
}

// --- writing ----------------------------------------------------------------

/**
 * The thread a form names, only if it is the reader's. The key arrives in a
 * form and a form can be replayed with somebody else's id, so ownership is
 * proved here on every write — never taken from the listing that rendered it.
 */
export async function findThread(database: D1Database, side: Side, key: string): Promise<Target | null> {
  const [kind, id] = key.split(':');
  if (!kind || !id || !isKind(kind)) return null;

  type Row = { id: string; title: string; status: string; other_name: string; recipient: string | null; project_id?: string };
  let row: Row | null = null;

  if (side.as === 'company') {
    if (kind === 'request') {
      row = await one<Row>(
        database,
        `SELECT h.id, h.title, h.status, u.id AS recipient, u.name AS other_name
           FROM hire_requests h
           JOIN specialist_profiles sp ON sp.id = h.profile_id
           JOIN users u ON u.id = sp.user_id
          WHERE h.id = ? AND h.company_id = ? AND h.status != 'draft'`,
        id, side.companyId,
      );
    } else if (kind === 'reply') {
      row = await one<Row>(
        database,
        `SELECT a.id, p.id AS project_id, p.title, a.status, u.id AS recipient, u.name AS other_name
           FROM applications a
           JOIN projects p ON p.id = a.project_id
           JOIN specialist_profiles sp ON sp.id = a.profile_id
           JOIN users u ON u.id = sp.user_id
          WHERE a.id = ? AND p.company_id = ?`,
        id, side.companyId,
      );
    } else {
      row = await one<Row>(
        database,
        `SELECT e.id, e.title, e.status, u.id AS recipient, u.name AS other_name
           FROM engagements e
           JOIN specialist_profiles sp ON sp.id = e.profile_id
           JOIN users u ON u.id = sp.user_id
          WHERE e.id = ? AND e.company_id = ?`,
        id, side.companyId,
      );
    }
  } else if (kind === 'request') {
    row = await one<Row>(
      database,
      `SELECT h.id, h.title, h.status, h.created_by AS recipient, c.name AS other_name
         FROM hire_requests h
         JOIN companies c ON c.id = h.company_id
        WHERE h.id = ? AND h.profile_id = ? AND h.status != 'draft'`,
      id, side.profileId,
    );
  } else if (kind === 'reply') {
    row = await one<Row>(
      database,
      `SELECT a.id, p.id AS project_id, p.title, a.status, p.created_by AS recipient, c.name AS other_name
         FROM applications a
         JOIN projects p ON p.id = a.project_id
         JOIN companies c ON c.id = p.company_id
        WHERE a.id = ? AND a.profile_id = ?`,
      id, side.profileId,
    );
  } else {
    row = await one<Row>(
      database,
      `SELECT e.id, e.title, e.status, c.name AS other_name,
              -- whoever asked for the work, falling back to whoever owns the company
              COALESCE(h.created_by, p.created_by,
                (SELECT m.user_id FROM company_members m
                  WHERE m.company_id = e.company_id
                  ORDER BY CASE WHEN m.role = 'owner' THEN 0 ELSE 1 END
                  LIMIT 1)) AS recipient
         FROM engagements e
         JOIN companies c ON c.id = e.company_id
         LEFT JOIN hire_requests h ON h.id = e.hire_request_id
         LEFT JOIN projects p ON p.id = e.project_id
        WHERE e.id = ? AND e.profile_id = ?`,
      id, side.profileId,
    );
  }

  if (!row) return null;
  return {
    kind, id: row.id, title: row.title, otherName: row.other_name, status: row.status,
    open: writable(kind, row.status),
    recipientId: row.recipient,
    hireRequestId: kind === 'request' ? row.id : null,
    // a reply's message also names its project, so the 0001 project index still finds it
    projectId: kind === 'reply' ? row.project_id ?? null : null,
    applicationId: kind === 'reply' ? row.id : null,
    engagementId: kind === 'work' ? row.id : null,
  };
}

/** Write a message into a thread the caller has already proved is theirs. */
export async function postMessage(
  database: D1Database,
  target: Target,
  senderId: string,
  body: string,
): Promise<string> {
  const id = newId();
  await run(
    database,
    `INSERT INTO messages (id, hire_request_id, project_id, application_id, engagement_id, sender_id, body, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id, target.hireRequestId, target.projectId, target.applicationId, target.engagementId,
    senderId, body, nowIso(),
  );
  return id;
}

/**
 * Write a message and tell the other side. Used for a plain message; a note
 * that rides on a change of state (changes requested, work handed over, an
 * issue raised) goes in with `postMessage`, because the change already sends
 * its own notification and two for one event is noise.
 *
 * Every notification is also an email, and notify() sends at most one email an
 * hour per conversation for the 'message' kind — recognising the conversation
 * by its title. So the title names the thread and nothing else ("New message
 * about <title>"), and who wrote it and what they said go in the body.
 */
export async function sendMessage(
  database: D1Database,
  side: Side,
  target: Target,
  sender: { id: string; name: string },
  body: string,
): Promise<string> {
  const id = await postMessage(database, target, sender.id, body);
  if (target.recipientId) {
    await notify(database, {
      userId: target.recipientId,
      kind: 'message',
      title: `New message about ${target.title}`,
      body: `${sender.name}: ${excerpt(body)}`,
      // the other side's inbox, where every thread can be answered
      link: side.as === 'company' ? '/workspace/freelancer/messages' : '/workspace/company/messages',
    });
  }
  return id;
}

/** The first line or so of a message, for a notification body. */
export const excerpt = (body: string, length = 140): string =>
  body.length > length ? `${body.slice(0, length - 1).trimEnd()}…` : body;
