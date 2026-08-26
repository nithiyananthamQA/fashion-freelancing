/**
 * Human labels for stored values.
 *
 * Database state names leaked straight onto badges and meta lines, so people
 * were reading `submitted`, `responding`, `shortlisted`, `fixed`, `remote`.
 * Those are our words, not theirs. Each label here answers the reader's real
 * question — "what is happening, and is it my turn?" — from THEIR side.
 */
import { ENGAGEMENT, RATE_MODEL, WORK_LOCATION, AVAILABILITY, PROJECT_SIZE } from './taxonomy';

const fromList = (list: readonly { id: string; name: string }[]) => (id: string | null | undefined): string =>
  (id ? list.find((x) => x.id === id)?.name : '') || '';

export const engagementLabel = fromList(ENGAGEMENT);
export const rateModelLabel = fromList(RATE_MODEL);
export const workLocationLabel = fromList(WORK_LOCATION);
export const availabilityLabel = fromList(AVAILABILITY);
export const projectSizeLabel = fromList(PROJECT_SIZE);

/** A posted project, as the company that posted it sees it. */
const PROJECT_STATUS_COMPANY: Record<string, string> = {
  draft: 'Not posted yet',
  submitted: 'Being checked',
  published: 'Open — waiting for replies',
  responding: 'Replies coming in',
  shortlisted: 'You have shortlisted someone',
  hired: 'Someone hired',
  in_progress: 'Work in progress',
  delivered: 'Delivered — needs your review',
  completed: 'Finished',
  closed: 'Closed',
};

/**
 * The same project, read from inside the operations team. The company-side map
 * is written to the person who posted the brief — "You have shortlisted
 * someone" — which is untrue on an internal page, where the only question is
 * how far the brief has travelled and whether anyone still owes it an answer.
 */
const PROJECT_STATUS_ADMIN: Record<string, string> = {
  draft: 'Not posted yet',
  submitted: 'Waiting to be checked',
  published: 'Open — no replies yet',
  responding: 'Replies coming in',
  shortlisted: 'Someone shortlisted',
  hired: 'Someone hired',
  in_progress: 'Work in progress',
  delivered: 'Delivered — with the company',
  completed: 'Finished',
  closed: 'Closed',
};

/** A hire request, from the company's side. */
const HIRE_STATUS_COMPANY: Record<string, string> = {
  draft: 'Not sent',
  sent: 'Waiting for a reply',
  viewed: 'They have read it',
  question: 'They asked you something',
  proposal: 'They replied with a price',
  accepted: 'Accepted',
  declined: 'Declined',
  active: 'Work in progress',
  completed: 'Finished',
  closed: 'Closed',
};

/** The same hire request, from the specialist's side. */
const HIRE_STATUS_SPECIALIST: Record<string, string> = {
  sent: 'Needs your answer',
  viewed: 'Needs your answer',
  question: 'You asked a question',
  proposal: 'You sent a price',
  accepted: 'You accepted',
  declined: 'You declined',
  active: 'Work in progress',
  completed: 'Finished',
  closed: 'Closed',
};

/** A specialist's reply to a posted project. */
const APPLICATION_STATUS: Record<string, string> = {
  submitted: 'Sent',
  shortlisted: 'Shortlisted',
  declined: 'Not chosen',
  hired: 'Hired',
  withdrawn: 'Withdrawn',
};

const ENGAGEMENT_STATUS: Record<string, string> = {
  active: 'In progress',
  delivered: 'Delivered',
  revision: 'Changes requested',
  completed: 'Finished',
  closed: 'Closed',
  disputed: 'Disputed',
};

/**
 * Money recorded against a piece of work. "Invoice" is what the company owes,
 * "payout" is what reaches the specialist, and both sides see the same row —
 * so the labels name who the money moves between rather than the direction.
 */
const PAYMENT_KIND: Record<string, string> = {
  invoice: 'Invoice to the company',
  payout: 'Payment to you',
};

/**
 * The same rows read from the company's side. `paymentKindLabel` says
 * "Payment to you" of a payout, which is true for the specialist and false for
 * the company paying it, so each side gets its own wording.
 */
const PAYMENT_KIND_COMPANY: Record<string, string> = {
  invoice: 'Invoice to you',
  payout: 'Paid to the specialist',
};

const PAYMENT_STATUS: Record<string, string> = {
  draft: 'Not raised yet',
  due: 'Waiting to be paid',
  paid: 'Paid',
  failed: 'Payment failed',
  refunded: 'Refunded',
};

/**
 * A specialist's own profile, from their side. "Submitted" and "needs_changes"
 * name our review queue; what they need to know is whether anyone can find
 * them and who is holding the page now.
 */
const PROFILE_STATUS: Record<string, string> = {
  draft: 'Not finished',
  submitted: 'With our review team',
  needs_changes: 'Changes needed',
  approved: 'Live in the directory',
  paused: 'Hidden from the directory',
};

/** A portfolio piece is checked before it can appear on a public page. */
const PORTFOLIO_MODERATION: Record<string, string> = {
  pending: 'Waiting to be checked',
  approved: 'Showing publicly',
  rejected: 'Not shown',
};

/**
 * A direct-service enquiry someone sent through the site. `new`, `quoted` and
 * `won` are our sales words; an operator working the queue only needs to know
 * whose turn it is and whether the enquiry is still alive.
 */
const LEAD_STATUS: Record<string, string> = {
  new: 'Nobody has replied yet',
  contacted: 'You have replied',
  quoted: 'Price sent — waiting on them',
  won: 'Turned into work',
  lost: 'Went elsewhere',
};

/** Which of our forms the enquiry was typed into. */
const LEAD_SOURCE: Record<string, string> = {
  'contact-form': 'Contact form',
  'quote-bot': 'Quote bot',
};

/**
 * A skill or tool a specialist typed in themselves rather than picking from the
 * list. `skills` and `tools` are table names, and `merged` says nothing about
 * what happened to the freelancer who proposed it.
 */
const TAG_KIND: Record<string, string> = {
  skills: 'Custom skill',
  tools: 'Custom tool',
};

const TAG_STATUS: Record<string, string> = {
  pending: 'Waiting to be checked',
  approved: 'Public filter',
  merged: 'Folded into an existing tag',
  rejected: 'Not used',
};

/** What a person can do on a company account. */
const COMPANY_ROLE: Record<string, string> = {
  owner: 'Owner',
  member: 'Team member',
};

/**
 * A teammate's account. Only worth showing when it is not 'active' — an
 * account that works needs no badge, but one that has lost access has to say
 * so, or the roster reads as a list of people who can all still sign in.
 */
const ACCOUNT_STATUS: Record<string, string> = {
  active: 'Active',
  suspended: 'Access suspended',
  closed: 'Account closed',
};

/**
 * The audit history, read by whoever is running operations rather than by
 * whoever wrote the code. `profile.needs_changes` and `taxonomy.tag_merged`
 * name our enums and our tables; the only question an operator brings to a log
 * is what somebody actually did.
 */
const ACTIVITY: Record<string, string> = {
  'user.signed_up': 'created an account',
  'user.signed_in': 'signed in',
  'user.email_verified': 'confirmed their email',
  'user.password_reset': 'reset their password',
  'company.created': 'set up a company',
  'company.member_added': 'added someone to a company',
  'profile.created': 'started an application',
  'profile.submitted': 'submitted an application for review',
  'profile.approved': 'approved a specialist',
  'profile.needs_changes': 'asked a specialist for changes',
  'profile.rejected': 'rejected an application',
  'profile.paused': 'hid a specialist from the directory',
  'taxonomy.tag_proposed': 'proposed a new tag',
  'taxonomy.tag_approved': 'approved a tag',
  'taxonomy.tag_merged': 'merged a duplicate tag',
  'taxonomy.tag_rejected': 'rejected a tag',
  'portfolio.moderated': 'checked a portfolio piece',
  'project.published': 'published a project',
  'project.closed': 'closed a project',
  'hire_request.sent': 'asked a specialist to work with them',
  'hire_request.answered': 'answered a hire request',
  'engagement.created': 'started a piece of work',
  'engagement.completed': 'finished a piece of work',
  'payment.recorded': 'recorded a payment',
};

/**
 * A message the site tried to send. Every one is written down before it is
 * sent, so `queued` means "recorded here, nobody has sent it" — which is where
 * they all stop when no mail provider is configured.
 */
const MAIL_STATUS: Record<string, string> = {
  queued: 'Waiting to be sent',
  sent: 'Sent',
  failed: 'Could not be sent',
};

const pick = (map: Record<string, string>) => (value: string | null | undefined): string =>
  (value ? map[value] : '') || (value ?? '').replace(/_/g, ' ');

export const projectStatusForCompany = pick(PROJECT_STATUS_COMPANY);
export const projectStatusForAdmin = pick(PROJECT_STATUS_ADMIN);
export const hireStatusForCompany = pick(HIRE_STATUS_COMPANY);
export const hireStatusForSpecialist = pick(HIRE_STATUS_SPECIALIST);
export const applicationStatusLabel = pick(APPLICATION_STATUS);
export const engagementStatusLabel = pick(ENGAGEMENT_STATUS);
export const paymentKindLabel = pick(PAYMENT_KIND);
export const paymentKindForCompany = pick(PAYMENT_KIND_COMPANY);
export const paymentStatusLabel = pick(PAYMENT_STATUS);
export const profileStatusLabel = pick(PROFILE_STATUS);
export const portfolioModerationLabel = pick(PORTFOLIO_MODERATION);
export const leadStatusLabel = pick(LEAD_STATUS);
export const leadSourceLabel = pick(LEAD_SOURCE);
export const tagKindLabel = pick(TAG_KIND);
export const tagStatusLabel = pick(TAG_STATUS);
export const companyRoleLabel = pick(COMPANY_ROLE);
export const accountStatusLabel = pick(ACCOUNT_STATUS);
export const mailStatusLabel = pick(MAIL_STATUS);

/** Actions read `thing.what_happened`, so the fallback flattens both marks. */
export const activityLabel = (action: string | null | undefined): string =>
  (action ? ACTIVITY[action] : '') || (action ?? '').replace(/[._]/g, ' ');

/** Green when nothing is owed, amber when it is the reader's turn. */
export function statusTone(value: string | null | undefined): 'ok' | 'warn' | 'bad' | 'info' {
  switch (value) {
    case 'accepted': case 'hired': case 'completed': case 'active': case 'paid':
    case 'approved': case 'won': return 'ok';
    case 'sent': case 'viewed': case 'question': case 'proposal':
    case 'responding': case 'delivered': case 'revision': case 'due':
    case 'needs_changes': case 'paused': case 'pending': case 'new': return 'warn';
    case 'declined': case 'closed': case 'disputed': case 'failed': case 'refunded':
    case 'rejected': case 'lost': return 'bad';
    default: return 'info';
  }
}
