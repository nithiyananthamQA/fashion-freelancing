/**
 * Canonical service taxonomy — plan §5.
 *
 * This module is the ONE place the taxonomy is defined. The directory filters,
 * the application wizard, the project-posting form, the matching rules and the
 * seeded database rows all read from here. `scripts/gen-taxonomy-sql.mjs`
 * regenerates migrations/0002_seed_taxonomy.sql from this file — never edit
 * that migration by hand.
 *
 * Service ids match the slugs of the ten public service pages, so a service
 * page can link straight into the directory with its own filter pre-applied.
 */

export type StackGroup = 'languages' | 'frameworks' | 'styling' | 'databases' | 'capabilities';

export interface StackOption {
  id: string;
  name: string;
  group: StackGroup;
  /** Role ids this option is offered for. Omitted = offered for every role. */
  appliesTo?: string[];
}

export interface ServiceRole {
  id: string;
  name: string;
  /** Stack groups the wizard shows for this role, in order. */
  groups: StackGroup[];
}

export interface Service {
  id: string;
  name: string;
  /** Path of the matching public service page, for the cross-links in §2. */
  page: string;
  /** Directory blurb — plain language, no marketplace vocabulary. */
  blurb: string;
  accent: string;
  specialties: string[];
  skills: string[];
  tools: string[];
  /** Only Website Development declares roles today (§5.2). */
  roles?: ServiceRole[];
  stack?: StackOption[];
  /**
   * True when a role and a specialty are the same choice. Website Development's
   * specialties ARE its roles, so asking both would put the identical list on
   * two consecutive screens. The role screen answers it once and writes the
   * matching specialty itself.
   */
  specialtyFromRole?: boolean;
}

/** Turn a display name into the stable id used in URLs, filters and the DB. */
export const slug = (value: string): string =>
  value
    .toLowerCase()
    .replace(/\+/g, ' plus ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const STACK: StackOption[] = [
  // --- Frontend ---
  { id: 'lang-javascript', name: 'JavaScript', group: 'languages', appliesTo: ['frontend', 'fullstack', 'ecommerce', 'shopify', 'ui-implementation', 'integrations', 'mobile'] },
  { id: 'lang-typescript', name: 'TypeScript', group: 'languages' },
  { id: 'fw-react', name: 'React', group: 'frameworks', appliesTo: ['frontend', 'fullstack', 'ecommerce', 'ui-implementation'] },
  { id: 'fw-nextjs', name: 'Next.js', group: 'frameworks', appliesTo: ['frontend', 'fullstack', 'ecommerce', 'ui-implementation'] },
  { id: 'fw-astro', name: 'Astro', group: 'frameworks', appliesTo: ['frontend', 'fullstack', 'ecommerce', 'ui-implementation'] },
  { id: 'fw-vue', name: 'Vue', group: 'frameworks', appliesTo: ['frontend', 'fullstack', 'ecommerce', 'ui-implementation'] },
  { id: 'fw-angular', name: 'Angular', group: 'frameworks', appliesTo: ['frontend', 'fullstack', 'ui-implementation'] },
  { id: 'fw-svelte', name: 'Svelte', group: 'frameworks', appliesTo: ['frontend', 'fullstack', 'ecommerce', 'ui-implementation'] },
  { id: 'sty-tailwind', name: 'Tailwind CSS', group: 'styling', appliesTo: ['frontend', 'fullstack', 'ecommerce', 'shopify', 'ui-implementation'] },
  { id: 'sty-css', name: 'CSS', group: 'styling', appliesTo: ['frontend', 'fullstack', 'ecommerce', 'shopify', 'ui-implementation'] },
  { id: 'sty-sass', name: 'Sass', group: 'styling', appliesTo: ['frontend', 'fullstack', 'ecommerce', 'shopify', 'ui-implementation'] },
  { id: 'cap-responsive', name: 'Responsive design', group: 'capabilities', appliesTo: ['frontend', 'fullstack', 'ecommerce', 'shopify', 'ui-implementation'] },
  { id: 'cap-accessibility', name: 'Accessibility', group: 'capabilities', appliesTo: ['frontend', 'fullstack', 'ecommerce', 'shopify', 'ui-implementation'] },
  { id: 'cap-performance', name: 'Performance optimization', group: 'capabilities', appliesTo: ['frontend', 'fullstack', 'ecommerce', 'shopify', 'ui-implementation'] },
  { id: 'cap-component-systems', name: 'Component systems', group: 'capabilities', appliesTo: ['frontend', 'fullstack', 'ui-implementation'] },

  // --- Backend ---
  { id: 'lang-python', name: 'Python', group: 'languages', appliesTo: ['backend', 'fullstack', 'integrations'] },
  { id: 'lang-java', name: 'Java', group: 'languages', appliesTo: ['backend', 'fullstack', 'integrations'] },
  { id: 'lang-php', name: 'PHP', group: 'languages', appliesTo: ['backend', 'fullstack', 'ecommerce', 'integrations'] },
  { id: 'fw-fastapi', name: 'FastAPI', group: 'frameworks', appliesTo: ['backend', 'fullstack', 'integrations'] },
  { id: 'fw-django', name: 'Django', group: 'frameworks', appliesTo: ['backend', 'fullstack', 'integrations'] },
  { id: 'fw-node', name: 'Node.js', group: 'frameworks', appliesTo: ['backend', 'fullstack', 'integrations'] },
  { id: 'fw-express', name: 'Express', group: 'frameworks', appliesTo: ['backend', 'fullstack', 'integrations'] },
  { id: 'fw-nestjs', name: 'NestJS', group: 'frameworks', appliesTo: ['backend', 'fullstack', 'integrations'] },
  { id: 'fw-laravel', name: 'Laravel', group: 'frameworks', appliesTo: ['backend', 'fullstack', 'ecommerce', 'integrations'] },
  { id: 'db-postgresql', name: 'PostgreSQL', group: 'databases', appliesTo: ['backend', 'fullstack', 'ecommerce', 'integrations'] },
  { id: 'db-mysql', name: 'MySQL', group: 'databases', appliesTo: ['backend', 'fullstack', 'ecommerce', 'integrations'] },
  { id: 'db-mongodb', name: 'MongoDB', group: 'databases', appliesTo: ['backend', 'fullstack', 'ecommerce', 'integrations'] },
  { id: 'cap-api-development', name: 'API development', group: 'capabilities', appliesTo: ['backend', 'fullstack', 'integrations', 'ecommerce', 'mobile'] },
  { id: 'cap-authentication', name: 'Authentication', group: 'capabilities', appliesTo: ['backend', 'fullstack', 'integrations', 'mobile'] },
  { id: 'cap-payments', name: 'Payments', group: 'capabilities', appliesTo: ['backend', 'fullstack', 'ecommerce', 'shopify', 'integrations'] },
  { id: 'cap-admin-systems', name: 'Admin systems', group: 'capabilities', appliesTo: ['backend', 'fullstack', 'integrations'] },
  { id: 'cap-cloud-deployment', name: 'Cloud deployment', group: 'capabilities', appliesTo: ['backend', 'fullstack', 'integrations'] },

  // --- Mobile / app development ---
  { id: 'lang-swift', name: 'Swift', group: 'languages', appliesTo: ['mobile'] },
  { id: 'lang-kotlin', name: 'Kotlin', group: 'languages', appliesTo: ['mobile'] },
  { id: 'lang-dart', name: 'Dart', group: 'languages', appliesTo: ['mobile'] },
  { id: 'fw-react-native', name: 'React Native', group: 'frameworks', appliesTo: ['mobile'] },
  { id: 'fw-flutter', name: 'Flutter', group: 'frameworks', appliesTo: ['mobile'] },
  { id: 'fw-swiftui', name: 'SwiftUI', group: 'frameworks', appliesTo: ['mobile'] },
  { id: 'fw-jetpack-compose', name: 'Jetpack Compose', group: 'frameworks', appliesTo: ['mobile'] },
  { id: 'cap-app-store', name: 'App Store / Play Store release', group: 'capabilities', appliesTo: ['mobile'] },
  { id: 'cap-push-notifications', name: 'Push notifications', group: 'capabilities', appliesTo: ['mobile'] },
  { id: 'cap-offline-sync', name: 'Offline & sync', group: 'capabilities', appliesTo: ['mobile'] },

  // --- Commerce platforms ---
  { id: 'fw-shopify', name: 'Shopify', group: 'frameworks', appliesTo: ['ecommerce', 'shopify', 'fullstack', 'integrations'] },
  { id: 'fw-woocommerce', name: 'WooCommerce', group: 'frameworks', appliesTo: ['ecommerce', 'fullstack'] },
  { id: 'fw-liquid', name: 'Liquid', group: 'frameworks', appliesTo: ['shopify', 'ecommerce'] },
];

/**
 * Website Development roles (§5.2). Full-stack shows both the frontend and the
 * backend groups so the freelancer never types the same thing twice.
 */
const WEBSITE_ROLES: ServiceRole[] = [
  { id: 'frontend', name: 'Frontend Developer', groups: ['languages', 'frameworks', 'styling', 'capabilities'] },
  { id: 'backend', name: 'Backend Developer', groups: ['languages', 'frameworks', 'databases', 'capabilities'] },
  { id: 'fullstack', name: 'Full-stack Developer', groups: ['languages', 'frameworks', 'styling', 'databases', 'capabilities'] },
  { id: 'ecommerce', name: 'E-commerce Developer', groups: ['languages', 'frameworks', 'styling', 'databases', 'capabilities'] },
  { id: 'shopify', name: 'Shopify Developer', groups: ['languages', 'frameworks', 'styling', 'capabilities'] },
  { id: 'ui-implementation', name: 'UI Implementation Specialist', groups: ['languages', 'frameworks', 'styling', 'capabilities'] },
  { id: 'integrations', name: 'API / Integration Developer', groups: ['languages', 'frameworks', 'databases', 'capabilities'] },
  { id: 'mobile', name: 'Mobile App Developer', groups: ['languages', 'frameworks', 'databases', 'capabilities'] },
];

export const SERVICES: Service[] = [
  {
    id: 'tech-pack',
    name: 'Tech Pack',
    page: '/pages/services/tech-pack.html',
    blurb: 'Factory-ready specification documents — flats, measurements, BOM and construction detail.',
    accent: 'var(--lg-coral)',
    specialties: ['Womenswear', 'Menswear', 'Kidswear', 'Activewear', 'Denim', 'Knitwear', 'Accessories'],
    skills: ['Flats', 'BOM', 'Measurements', 'Construction', 'Grading notes', 'Fit commentary', 'Trim specification'],
    tools: ['Adobe Illustrator', 'CLO3D', 'PLM', 'Excel'],
  },
  {
    id: '3d-virtual-sampling',
    name: '3D Virtual Sampling',
    page: '/pages/services/3d-virtual-sampling.html',
    blurb: 'Photorealistic digital samples — review fit, fabric and colourways before cutting cloth.',
    accent: 'var(--lg-sky)',
    specialties: ['Garment simulation', 'Fit review', 'Colourways', 'Render production', 'Animation', 'Digital avatars'],
    skills: ['Fabric simulation', 'Rendering', 'Fit analysis', 'Colourway production', 'Avatar setup'],
    tools: ['CLO3D', 'Browzwear', 'Marvelous Designer', 'Blender', 'Substance'],
  },
  {
    id: 'seamless-pattern',
    /* Renamed to what it actually sells. The id stays: it is the URL, and it
       is the foreign key on every specialist offering and project already in
       the database — renaming it would break both for no gain. */
    name: 'Graphics & Prints',
    page: '/pages/services/graphics-prints.html',
    blurb: 'Surface pattern, colourways and apparel graphics, delivered as print-ready production files.',
    accent: 'var(--lg-pink)',
    specialties: ['Apparel prints', 'Repeat patterns', 'Textile prints', 'Home textiles', 'Print-ready files'],
    skills: ['Repeat design', 'Colour separation', 'Print production', 'Colourway development'],
    tools: ['Adobe Illustrator', 'Adobe Photoshop', 'Procreate'],
  },
  {
    id: 'pattern-cad',
    name: 'Pattern CAD',
    page: '/pages/services/pattern-cad.html',
    blurb: 'Digital patterns, grading and markers built for the factory that will actually cut them.',
    accent: 'var(--lg-green)',
    specialties: ['Base patterns', 'Grading', 'Marker making', 'Digitising', 'Fit corrections'],
    skills: ['Grading', 'Marker planning', 'Pattern drafting', 'Fit correction', 'DXF export'],
    tools: ['Gerber', 'Lectra', 'Optitex', 'Tukatech', 'Clo3D'],
  },
  {
    id: 'dobby-jacquard',
    name: 'Dobby & Jacquard',
    page: '/pages/services/dobby-jacquard.html',
    blurb: 'Woven structures and loom-ready artwork, from weave concept to mill-ready files.',
    accent: 'var(--lg-orange)',
    specialties: ['Dobby structures', 'Jacquard artwork', 'Weave simulation', 'Loom-ready files'],
    skills: ['Weave construction', 'Yarn planning', 'Textile CAD', 'Loom-ready production files'],
    tools: ['NedGraphics', 'ArahWeave', 'Pointcarre', 'EAT'],
  },
  {
    id: 'website',
    name: 'Website Development',
    page: '/pages/services/website.html',
    blurb: 'Storefronts, brand sites and the systems behind them — built, integrated and shipped.',
    accent: 'var(--lg-violet)',
    specialties: WEBSITE_ROLES.map((role) => role.name),
    /* Empty on purpose. For this service the stack IS the skill set (§5.1), and
       its `capabilities` group already covers API development, authentication,
       payments and the rest — listing them here too asked the same question
       twice. Services WITHOUT a stack carry their competencies in `skills`. */
    skills: [],
    tools: ['Git', 'Figma', 'Vercel', 'Cloudflare', 'Docker'],
    roles: WEBSITE_ROLES,
    stack: STACK,
    specialtyFromRole: true,
  },
  {
    id: 'ai-agent',
    name: 'AI Agent',
    page: '/pages/services/ai-agent.html',
    blurb: 'Support, sales and operations agents that answer accurately and hand off to a person.',
    accent: 'var(--lg-teal)',
    specialties: ['Customer support', 'Lead generation', 'Sales assistance', 'Knowledge-base agent', 'Automation'],
    skills: ['Prompt design', 'Workflow design', 'Knowledge bases', 'API work', 'Evaluation'],
    tools: ['Python', 'TypeScript', 'Make', 'Zapier', 'n8n'],
  },
  {
    id: 'ai-photography',
    name: 'AI Video & Photography',
    page: '/pages/services/ai-photography.html',
    blurb: 'Channel-ready product and campaign imagery that keeps the real garment honest.',
    accent: 'var(--lg-yellow)',
    specialties: ['Product imagery', 'Lifestyle imagery', 'Campaigns', 'Short video', 'Retouching'],
    skills: ['Art direction', 'Image generation', 'Retouching', 'Motion', 'Product consistency'],
    tools: ['Adobe Photoshop', 'Runway', 'Midjourney', 'Blender', 'After Effects'],
  },
  {
    id: 'ecom-listing',
    name: 'E-Commerce Listing',
    page: '/pages/services/ecom-listing.html',
    blurb: 'Catalogue work that gets products live and findable on every channel you sell through.',
    accent: 'var(--lg-lime)',
    specialties: ['Shopify', 'Amazon', 'Myntra', 'Flipkart', 'Catalog upload', 'SEO content', 'Product attributes'],
    skills: ['Product data', 'SEO', 'Marketplace requirements', 'Bulk upload', 'Catalog operations'],
    tools: ['Shopify', 'Amazon Seller Central', 'Excel', 'PIM'],
  },
  {
    id: 'graphic-design',
    name: 'Graphic Design',
    page: '/pages/services/graphic-design.html',
    blurb: 'Identity, packaging and campaign assets built as a system, with production files included.',
    accent: 'var(--lg-peri)',
    specialties: ['Brand identity', 'Packaging', 'Social media', 'Campaign assets', 'Lookbooks', 'Print design'],
    skills: ['Typography', 'Art direction', 'Layout', 'Production files', 'Print preparation'],
    tools: ['Figma', 'Adobe Illustrator', 'Adobe Photoshop', 'Adobe InDesign'],
  },
];

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export const SERVICE_BY_ID = new Map(SERVICES.map((s) => [s.id, s]));

export const getService = (id: string | null | undefined): Service | undefined =>
  id ? SERVICE_BY_ID.get(id) : undefined;

export const specialtyId = (serviceId: string, name: string): string => `${serviceId}--${slug(name)}`;
export const skillId = (serviceId: string, name: string): string => `${serviceId}--skill--${slug(name)}`;
export const toolId = (serviceId: string, name: string): string => `${serviceId}--tool--${slug(name)}`;

/** Stack options a given Website Development role should be asked about (§5.2). */
export function stackForRole(service: Service, roleId: string): Record<string, StackOption[]> {
  const role = service.roles?.find((r) => r.id === roleId);
  if (!role || !service.stack) return {};
  const out: Record<string, StackOption[]> = {};
  for (const group of role.groups) {
    const options = service.stack.filter(
      (option) => option.group === group && (!option.appliesTo || option.appliesTo.includes(roleId)),
    );
    if (options.length) out[group] = options;
  }
  return out;
}

export const STACK_GROUP_LABEL: Record<StackGroup, string> = {
  languages: 'Languages',
  frameworks: 'Frameworks & platforms',
  styling: 'Styling',
  databases: 'Databases',
  capabilities: 'Capabilities',
};

// ---------------------------------------------------------------------------
// Shared option lists used by both the wizard and the directory filters
// ---------------------------------------------------------------------------

export const AVAILABILITY = [
  { id: 'available_now', name: 'Available now' },
  { id: 'in_2_weeks', name: 'Available in 2 weeks' },
  { id: 'this_month', name: 'Available this month' },
  { id: 'booked', name: 'Fully booked' },
] as const;

export const WORK_LOCATION = [
  { id: 'remote', name: 'Remote' },
  { id: 'onsite', name: 'Onsite' },
  { id: 'hybrid', name: 'Hybrid' },
] as const;

/**
 * How a company frames the engagement when it briefs work. Kept separate from
 * RATE_MODEL because this is the buyer's side of the question.
 */
export const ENGAGEMENT = [
  { id: 'fixed', name: 'Fixed project' },
  { id: 'hourly', name: 'Hourly' },
  { id: 'monthly', name: 'Monthly support' },
] as const;

/**
 * How a specialist charges. This is asked ONCE, in the rates step. It used to
 * be asked twice — once as "how you like to work" and again as "how you
 * charge" — with almost the same options both times.
 */
export const RATE_MODEL = [
  { id: 'fixed', name: 'Fixed price per project' },
  { id: 'hourly', name: 'Hourly rate' },
  { id: 'day', name: 'Day rate' },
  { id: 'retainer', name: 'Monthly retainer' },
] as const;

/**
 * Project size, as something a person can actually answer. It was a free-text
 * box with no guidance, so nobody knew what to type.
 */
export const PROJECT_SIZE = [
  { id: 'small', name: 'Small — one-off pieces, a few days' },
  { id: 'medium', name: 'Medium — a capsule or a phase, a few weeks' },
  { id: 'large', name: 'Large — a full collection or build, a month or more' },
  { id: 'any', name: 'Any size' },
] as const;

export const EXPERIENCE_BANDS = [
  { id: '1', name: '1+ years' },
  { id: '3', name: '3+ years' },
  { id: '5', name: '5+ years' },
  { id: '8', name: '8+ years' },
] as const;

/** How many services one specialist may offer: one primary plus two secondary (§5). */
export const MAX_SECONDARY_SERVICES = 2;
/**
 * Portfolio evidence required before an application can be submitted (§8, step 5).
 * One strong piece is enough to review against — asking for more up front loses
 * good applicants at the last step. Admins request more during review when a
 * single piece is not enough to judge.
 */
export const MIN_PORTFOLIO_ITEMS = 1;
/** Custom skills/tools a freelancer may propose per service before review (§5). */
export const MAX_CUSTOM_TAGS_PER_SERVICE = 5;

export const APPLICATION_STEPS = [
  { step: 1, key: 'account', title: 'Account' },
  { step: 2, key: 'services', title: 'Services & specialties' },
  { step: 3, key: 'skills', title: 'Skills & tools' },
  { step: 4, key: 'profile', title: 'Professional profile' },
  { step: 5, key: 'portfolio', title: 'Portfolio' },
  { step: 6, key: 'rates', title: 'Rates & preferences' },
  { step: 7, key: 'review', title: 'Submit for review' },
] as const;

export const TOTAL_APPLICATION_STEPS = APPLICATION_STEPS.length;
