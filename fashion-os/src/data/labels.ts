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

const pick = (map: Record<string, string>) => (value: string | null | undefined): string =>
  (value ? map[value] : '') || (value ?? '').replace(/_/g, ' ');

export const projectStatusForCompany = pick(PROJECT_STATUS_COMPANY);
export const hireStatusForCompany = pick(HIRE_STATUS_COMPANY);
export const hireStatusForSpecialist = pick(HIRE_STATUS_SPECIALIST);
export const applicationStatusLabel = pick(APPLICATION_STATUS);
export const engagementStatusLabel = pick(ENGAGEMENT_STATUS);

/** Green when nothing is owed, amber when it is the reader's turn. */
export function statusTone(value: string | null | undefined): 'ok' | 'warn' | 'bad' | 'info' {
  switch (value) {
    case 'accepted': case 'hired': case 'completed': case 'active': return 'ok';
    case 'sent': case 'viewed': case 'question': case 'proposal':
    case 'responding': case 'delivered': case 'revision': return 'warn';
    case 'declined': case 'closed': case 'disputed': return 'bad';
    default: return 'info';
  }
}
