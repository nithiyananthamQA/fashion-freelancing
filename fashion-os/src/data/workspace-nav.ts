/**
 * Where each role can go inside the workspace.
 *
 * Defined in one place so a destination cannot appear in one page's sidebar
 * and not another's, and so the labels stay in the plain language the rest of
 * the site uses — "Work in progress", not "Engagements"; "Replies you sent",
 * not "Applications".
 *
 * Counts are passed in by the page that knows them. Anything left undefined
 * simply renders without a badge — except Notifications, whose unread count
 * the Workspace layout fills in on every page, because every page has it.
 *
 * Notifications and /account (password, verification, signing out everywhere)
 * belong to the account rather than to any one role, so every role ends with
 * the same two.
 */
import type { NavItem } from '../components/WorkspaceNav.astro';

/**
 * One notifications page serves every role, so the link says which sidebar to
 * draw around it — somebody who is both a specialist and on a company should
 * not be thrown from one workspace into the other by reading their messages.
 */
export const notificationsHref = (role: 'freelancer' | 'company' | 'admin' | 'editor'): string =>
  `/workspace/notifications?as=${role}`;

export interface Counts {
  [key: string]: number | undefined;
}

export const freelancerNav = (c: Counts = {}): NavItem[] => [
  { href: '/workspace/freelancer',           label: 'Overview' },
  { href: '/workspace/freelancer/requests',  label: 'Requests to hire you', count: c.requests },
  { href: '/workspace/freelancer/projects',  label: 'Project invitations',  count: c.invites },
  { href: '/workspace/freelancer/replies',   label: 'Replies you sent',     count: c.replies },
  { href: '/workspace/freelancer/work',      label: 'Work in progress',     count: c.work },
  { href: '/workspace/freelancer/messages',  label: 'Messages',             count: c.messages },
  { href: '/workspace/freelancer/services',  label: 'Your services' },
  { href: '/workspace/freelancer/earnings',  label: 'Payments' },
  { href: '/workspace/freelancer/profile',   label: 'Your public page' },
  { href: '/workspace/freelancer/settings',  label: 'Settings' },
  { href: notificationsHref('freelancer'),   label: 'Notifications' },
  { href: '/account',                        label: 'Password & security' },
];

export const companyNav = (c: Counts = {}): NavItem[] => [
  { href: '/workspace/company',            label: 'Overview' },
  { href: '/specialists',                  label: 'Find a specialist' },
  { href: '/projects/new',                 label: 'Post a project' },
  { href: '/workspace/company/replies',    label: 'Replies to your projects', count: c.replies },
  { href: '/workspace/company/requests',   label: 'People you asked',         count: c.requests },
  { href: '/workspace/company/work',       label: 'Work in progress',         count: c.work },
  { href: '/workspace/company/messages',   label: 'Messages',                 count: c.messages },
  { href: '/workspace/company/saved',      label: 'Saved specialists',        count: c.saved },
  { href: '/workspace/company/billing',    label: 'Invoices' },
  { href: '/workspace/company/team',       label: 'Your team' },
  { href: '/workspace/company/settings',   label: 'Settings' },
  { href: notificationsHref('company'),    label: 'Notifications' },
  { href: '/account',                      label: 'Password & security' },
];

export const editorNav = (): NavItem[] => [
  { href: '/workspace/content',        label: 'Site content' },
  { href: notificationsHref('editor'), label: 'Notifications' },
  { href: '/account',                  label: 'Password & security' },
];

export const adminNav = (c: Counts = {}): NavItem[] => [
  { href: '/workspace/admin',             label: 'Overview' },
  { href: '/workspace/content',           label: 'Site content' },
  { href: '/workspace/admin/reviews',     label: 'Applications to review', count: c.reviews },
  { href: '/workspace/admin/moderation',  label: 'Moderation queue',       count: c.moderation },
  { href: '/workspace/admin/enquiries',   label: 'Project enquiries',      count: c.enquiries },
  { href: '/workspace/admin/disputes',    label: 'Disputes',               count: c.disputes },
  { href: '/workspace/admin/specialists', label: 'Live specialists' },
  { href: '/workspace/admin/projects',    label: 'Posted projects' },
  { href: '/workspace/admin/payments',    label: 'Payments' },
  { href: '/workspace/admin/people',      label: 'People' },
  { href: '/workspace/admin/activity',    label: 'Activity & email' },
  { href: notificationsHref('admin'),     label: 'Notifications' },
  { href: '/account',                     label: 'Password & security' },
];
