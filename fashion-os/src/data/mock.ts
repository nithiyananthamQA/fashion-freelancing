// Mock data for the entire Fashion Freelancing UI.
// Used everywhere — public pages, dashboards, marketplace, messaging, workflow.

export type Category = { slug: string; name: string; count: number; image: string; tag: string };
export type Creator = {
  id: string; slug: string; name: string; handle: string; specialty: string; location: string;
  rating: number; reviews: number; from: number; currency: string;
  avatar: string; cover: string; portfolio: string[];
  badges: string[]; tags: string[]; available: boolean; bio: string;
  about: string; experienceYears: number; followers: number; completion: number;
};
export type Project = {
  id: string; title: string; brand: string; brandTag: string;
  category: string; budget: string; timeline: string; postedAt: string;
  remote: 'Remote' | 'Hybrid' | 'On-site'; urgent?: boolean; description: string;
  skills: string[]; experience: string;
};
export type Proposal = {
  id: string; project: string; brand: string; status: 'sent' | 'shortlisted' | 'won' | 'declined';
  amount: string; sentAt: string; milestones: number;
};
export type Message = { id: string; from: string; avatar: string; preview: string; time: string; unread?: number };
export type WorkflowStage = 'Concept' | 'Moodboard' | 'Sketch' | 'Tech Pack' | 'Pattern' | 'Sampling' | 'Revision' | 'Manufacturing' | 'Production' | 'Delivery';
export type Task = { id: string; code: string; title: string; stage: WorkflowStage; status: string; due: string; assignee: string };

export const categories: Category[] = [
  { slug: 'womenswear-designers', name: 'Womenswear Designers', count: 2140, tag: '01', image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1400&auto=format&fit=crop' },
  { slug: 'tech-pack-specialists', name: 'Tech Pack Specialists', count: 980, tag: '02', image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop' },
  { slug: 'pattern-makers', name: 'Pattern Makers', count: 1302, tag: '03', image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=900&auto=format&fit=crop' },
  { slug: 'editorial-stylists', name: 'Editorial Stylists', count: 1766, tag: '04', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&auto=format&fit=crop' },
  { slug: 'verified-manufacturers', name: 'Verified Manufacturers', count: 412, tag: '05', image: 'https://images.unsplash.com/photo-1542060748-10c28b62716f?w=900&auto=format&fit=crop' },
  { slug: 'textile-designers', name: 'Textile Designers', count: 624, tag: '06', image: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=900&auto=format&fit=crop' },
  { slug: 'creative-directors', name: 'Creative Directors', count: 188, tag: '07', image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900&auto=format&fit=crop' },
  { slug: 'production-experts', name: 'Production Experts', count: 312, tag: '08', image: 'https://images.unsplash.com/photo-1521336575822-6da63fb45455?w=900&auto=format&fit=crop' },
];

export const creators: Creator[] = [
  {
    id: '1', slug: 'yuna-aoki', name: 'Yuna Aoki', handle: '@yunaaoki', specialty: 'Womenswear Designer',
    location: 'Tokyo, Japan', rating: 4.97, reviews: 142, from: 2400, currency: 'USD',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=1200&auto=format&fit=crop',
    portfolio: [
      'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1485518882345-15568b007407?w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&auto=format&fit=crop',
    ],
    badges: ['Featured', 'Verified', 'Top 1%'], tags: ['Couture', 'Drape', 'Silk', 'Hand-embroidery'],
    available: true,
    bio: 'Couture-trained womenswear designer working with silk, drape and hand-embroidery for indie houses.',
    about: 'Trained at Bunka Fashion College in Tokyo and Atelier Versace in Milan. I work mostly with indie luxury houses on capsule womenswear collections — silk drape, hand-embroidery and constructed tailoring. Past clients: Maison Kirei, Hanako Studio, Auriga.',
    experienceYears: 9, followers: 18400, completion: 99,
  },
  {
    id: '2', slug: 'marco-reyes', name: 'Marco Reyes', handle: '@marcoreyes', specialty: 'Streetwear Designer',
    location: 'Mexico City', rating: 4.92, reviews: 89, from: 1150, currency: 'USD',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1200&auto=format&fit=crop',
    portfolio: [
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900&auto=format&fit=crop',
    ],
    badges: ['Rising', 'Verified'], tags: ['Denim', 'Graphic', 'Workwear', 'Vintage wash'],
    available: true,
    bio: 'Streetwear designer specializing in denim, graphic and workwear-inspired collections.',
    about: 'Born and raised in Mexico City, I design streetwear with workwear DNA. Denim, twill, graphic placement and vintage washes. Currently consulting for two LATAM streetwear brands and shipping a personal capsule each season.',
    experienceYears: 6, followers: 9200, completion: 97,
  },
  {
    id: '3', slug: 'amara-okafor', name: 'Amara Okafor', handle: '@amara.tp', specialty: 'Tech Pack Specialist',
    location: 'Lagos, Nigeria', rating: 5.0, reviews: 67, from: 840, currency: 'USD',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1521336575822-6da63fb45455?w=1200&auto=format&fit=crop',
    portfolio: [
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop',
    ],
    badges: ['Pro', 'Verified', 'Top Rated'], tags: ['CLO3D', 'Spec sheets', 'BOM', 'Grading'],
    available: false,
    bio: 'Tech pack engineer with CLO3D & PLM expertise. Production-ready specs, every time.',
    about: 'Mechanical engineer turned fashion tech-pack specialist. I build production-ready spec sheets, BOMs and grading rules in CLO3D and Centric PLM. 100% completion rate across 67 projects.',
    experienceYears: 5, followers: 4100, completion: 100,
  },
  {
    id: '4', slug: 'elena-marchetti', name: 'Elena Marchetti', handle: '@elenamarchetti', specialty: 'Editorial Stylist',
    location: 'Milan, Italy', rating: 4.98, reviews: 211, from: 3800, currency: 'EUR',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1200&auto=format&fit=crop',
    portfolio: [
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900&auto=format&fit=crop',
    ],
    badges: ['Top 1%', 'Vogue alum', 'Verified'], tags: ['Vogue', 'Runway', 'Lookbook', 'Editorial'],
    available: true,
    bio: 'Editorial stylist. Past covers: Vogue Italia, Numéro, Dazed.',
    about: 'Milan-based editorial stylist with 14 years of magazine and runway experience. Past credits: Vogue Italia (5 covers), Numéro, Dazed, AnOther. Available for editorials, lookbooks and runway styling.',
    experienceYears: 14, followers: 47200, completion: 98,
  },
  {
    id: '5', slug: 'kai-nakamura', name: 'Kai Nakamura', handle: '@kainakamura', specialty: 'Pattern Maker',
    location: 'Berlin, Germany', rating: 4.94, reviews: 73, from: 1600, currency: 'EUR',
    avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=300&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1200&auto=format&fit=crop',
    portfolio: [
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=900&auto=format&fit=crop',
    ],
    badges: ['Verified'], tags: ['Knitwear', 'Sustainable', 'Block', 'Drape'],
    available: true,
    bio: 'Pattern maker specializing in knitwear and sustainable yarns.',
    about: 'Knitwear pattern maker with 8 years building blocks for German and Scandinavian indie labels. Sustainable yarns, low-MOQ runs.',
    experienceYears: 8, followers: 2800, completion: 96,
  },
  {
    id: '6', slug: 'sofia-rosso', name: 'Sofia Rosso', handle: '@sofiarosso', specialty: 'Creative Director',
    location: 'Paris, France', rating: 4.96, reviews: 38, from: 6500, currency: 'EUR',
    avatar: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=300&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&auto=format&fit=crop',
    portfolio: [
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1485518882345-15568b007407?w=900&auto=format&fit=crop',
    ],
    badges: ['Top 1%', 'Verified'], tags: ['Brand strategy', 'Campaigns', 'Art direction'],
    available: true,
    bio: 'Creative director shaping brand worlds for emerging luxury houses.',
    about: 'Former art director at Maison Margiela. Now consulting with emerging luxury houses on brand worlds, campaigns and seasonal direction.',
    experienceYears: 12, followers: 23800, completion: 100,
  },
  {
    id: '7', slug: 'rina-patel', name: 'Rina Patel', handle: '@rinatextiles', specialty: 'Textile Designer',
    location: 'Mumbai, India', rating: 4.91, reviews: 102, from: 720, currency: 'USD',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=1200&auto=format&fit=crop',
    portfolio: [
      'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=900&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1542060748-10c28b62716f?w=900&auto=format&fit=crop',
    ],
    badges: ['Verified', 'Sustainable'], tags: ['Print design', 'Block print', 'Hand-loom', 'Natural dye'],
    available: true,
    bio: 'Textile designer working with traditional Indian hand-loom and natural dyes.',
    about: 'Mumbai-based textile designer. I bridge traditional Indian hand-loom techniques with contemporary fashion design — block print, natural dyes, jacquard. Sustainable supply chain partners on call.',
    experienceYears: 7, followers: 6700, completion: 95,
  },
  {
    id: '8', slug: 'james-cole', name: 'James Cole', handle: '@jamescole', specialty: 'Footwear Designer',
    location: 'London, UK', rating: 4.89, reviews: 54, from: 2100, currency: 'GBP',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1542060748-10c28b62716f?w=1200&auto=format&fit=crop',
    portfolio: [
      'https://images.unsplash.com/photo-1542060748-10c28b62716f?w=900&auto=format&fit=crop',
    ],
    badges: ['Verified'], tags: ['Footwear', 'Sneakers', 'Last design', 'Leather'],
    available: false,
    bio: 'Footwear designer with experience at Clarks and indie luxury sneaker brands.',
    about: 'London-based footwear designer. 10 years across mass and luxury — Clarks, Common Projects, indie sneaker labels.',
    experienceYears: 10, followers: 3200, completion: 98,
  },
];

export const projects: Project[] = [
  {
    id: 'p1', title: 'Senior womenswear designer for SS27 capsule', brand: 'Maison Kirei', brandTag: 'M·K',
    category: 'Womenswear', budget: '$8k–$14k', timeline: '8 weeks', postedAt: '2h ago',
    remote: 'Remote', description: '10-piece SS27 capsule, organic linen, low MOQ. Lisbon-based atelier preferred but remote OK.',
    skills: ['Womenswear', 'Linen', 'Capsule', 'Sustainable'], experience: 'Senior',
  },
  {
    id: 'p2', title: 'Tech pack engineer — denim line, 12 SKUs', brand: 'Vestra', brandTag: 'VS',
    category: 'Tech Pack', budget: '$3.2k', timeline: '3 weeks', postedAt: 'today',
    remote: 'Hybrid', urgent: true, description: 'Need full tech packs for our SS27 denim drop. CLO3D output preferred.',
    skills: ['Tech Pack', 'CLO3D', 'Denim', 'BOM'], experience: 'Mid–Senior',
  },
  {
    id: 'p3', title: 'Editorial stylist for Vogue Italia February cover', brand: 'Léon & Co.', brandTag: 'L&C',
    category: 'Styling', budget: '$12k', timeline: '5 days', postedAt: '1d ago',
    remote: 'On-site', description: 'Cover styling for Vogue Italia Feb issue. Milan, on-site.',
    skills: ['Editorial', 'Vogue', 'Cover'], experience: 'Senior',
  },
  {
    id: 'p4', title: 'Pattern maker — knitwear, sustainable yarns', brand: 'Obscura', brandTag: 'OB',
    category: 'Pattern', budget: '$1.8k–$3k', timeline: '4 weeks', postedAt: '3d ago',
    remote: 'Remote', description: '8-piece knitwear capsule using sustainable yarns. Need blocks + grading.',
    skills: ['Pattern', 'Knitwear', 'Sustainable'], experience: 'Mid',
  },
  {
    id: 'p5', title: 'Manufacturer — small-batch silk, low MOQ (≤200)', brand: 'Hanako Studio', brandTag: 'HK',
    category: 'Manufacturing', budget: '€22k', timeline: '10 weeks', postedAt: '5h ago',
    remote: 'On-site', description: 'Small-batch silk production. MOQ ≤200 per SKU. Quality first, cost second.',
    skills: ['Silk', 'Small batch', 'Quality control'], experience: 'Verified',
  },
  {
    id: 'p6', title: 'Creative director for new sustainable brand launch', brand: 'Auriga', brandTag: 'AU',
    category: 'Creative Direction', budget: '$25k', timeline: '12 weeks', postedAt: '6h ago',
    remote: 'Remote', description: 'Brand world, campaign direction and SS27 launch concepts.',
    skills: ['Brand strategy', 'Campaigns', 'Direction'], experience: 'Senior',
  },
  {
    id: 'p7', title: 'Footwear designer — luxury sneaker capsule', brand: 'North Atelier', brandTag: 'NA',
    category: 'Footwear', budget: '$9k', timeline: '6 weeks', postedAt: '8h ago',
    remote: 'Hybrid', description: '6-piece luxury sneaker capsule. Italian leather, tonal palette.',
    skills: ['Footwear', 'Sneakers', 'Leather'], experience: 'Senior',
  },
  {
    id: 'p8', title: 'Textile designer — botanical print collection', brand: 'Prima Milano', brandTag: 'PM',
    category: 'Textile', budget: '$4.5k', timeline: '4 weeks', postedAt: '2d ago',
    remote: 'Remote', description: 'Botanical print collection for SS27 dresses. Hand-painted preferred.',
    skills: ['Print design', 'Botanical', 'Hand-painted'], experience: 'Mid',
  },
];

export const proposals: Proposal[] = [
  { id: 'pr1', project: 'SS27 womenswear capsule', brand: 'Maison Kirei', status: 'shortlisted', amount: '$11,400', sentAt: '2d ago', milestones: 3 },
  { id: 'pr2', project: 'Cover styling — Numéro', brand: 'Numéro', status: 'won', amount: '€6,800', sentAt: '5d ago', milestones: 2 },
  { id: 'pr3', project: 'Knitwear pattern blocks', brand: 'Obscura', status: 'sent', amount: '$2,400', sentAt: '1d ago', milestones: 2 },
  { id: 'pr4', project: 'Resort 25 lookbook', brand: 'Auriga', status: 'declined', amount: '$3,100', sentAt: '2w ago', milestones: 2 },
  { id: 'pr5', project: 'Footwear consulting', brand: 'North Atelier', status: 'sent', amount: '$5,500', sentAt: '6h ago', milestones: 4 },
];

export const messages: Message[] = [
  { id: 'm1', from: 'Sara Lindqvist · Auriga', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop', preview: "Loving the v2 sketches. Can we push the shoulder line a touch?", time: '2m', unread: 2 },
  { id: 'm2', from: 'Akira Sato · Hanako Studio', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop', preview: 'Sample shipped today, tracking attached.', time: '1h', unread: 1 },
  { id: 'm3', from: 'Vestra Hiring', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop', preview: 'We shortlisted your proposal — short call this week?', time: '5h' },
  { id: 'm4', from: 'Maison Kirei', avatar: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=120&auto=format&fit=crop', preview: 'Here is the moodboard for SS27.', time: '1d' },
  { id: 'm5', from: 'Léon & Co.', avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=120&auto=format&fit=crop', preview: 'Vogue brief attached. Need turnaround by Friday.', time: '2d' },
];

export const tasks: Task[] = [
  { id: 't1', code: 'SS27-001', title: 'Linen blazer · v2 sample', stage: 'Sampling', status: 'shipped', due: 'Apr 22', assignee: 'Yuna' },
  { id: 't2', code: 'SS27-002', title: 'Wide-leg trouser spec', stage: 'Tech Pack', status: 'review', due: 'Apr 28', assignee: 'Amara' },
  { id: 't3', code: 'SS27-003', title: 'Belted shirt sample', stage: 'Sampling', status: 'in making', due: 'May 04', assignee: 'Yuna' },
  { id: 't4', code: 'SS27-004', title: 'Run order — 240 units', stage: 'Manufacturing', status: 'confirmed', due: 'May 10', assignee: 'Hanako' },
  { id: 't5', code: 'SS27-005', title: 'Wrap dress BOM', stage: 'Tech Pack', status: 'draft', due: 'Apr 30', assignee: 'Amara' },
  { id: 't6', code: 'SS27-006', title: 'Linen sourcing', stage: 'Concept', status: 'in progress', due: 'May 15', assignee: 'Sofia' },
  { id: 't7', code: 'SS27-007', title: 'Moodboard v3', stage: 'Moodboard', status: 'approved', due: 'Apr 18', assignee: 'Sofia' },
  { id: 't8', code: 'SS26-099', title: 'Resort drop · Milan', stage: 'Delivery', status: 'delivered', due: 'Apr 18', assignee: 'Marco' },
];

export const stages: WorkflowStage[] = ['Concept', 'Moodboard', 'Sketch', 'Tech Pack', 'Pattern', 'Sampling', 'Revision', 'Manufacturing', 'Production', 'Delivery'];

// =============== GIGS / ORDERS (Fiverr-for-fashion) ===============

export type Gig = {
  id: string; slug: string; title: string; service: string; serviceSlug: string;
  sellerId: string; sellerName: string; sellerAvatar: string; sellerCity: string;
  rating: number; reviews: number;
  img: string; from: number; currency: string;
  tiers: { name: string; price: number; days: number; revisions: number; bullets: string[] }[];
};

export type Order = {
  id: string; gigSlug: string; gigTitle: string;
  buyer: string; seller: string; sellerAvatar: string;
  status: 'ordered' | 'in_progress' | 'delivered' | 'reviewed' | 'cancelled';
  tier: string; amount: string; orderedAt: string; due: string;
};

// Grouped by PRODUCTION STAGE (matches shared/store.js + services.js).
export const services = [
  // Concept
  { slug: 'fashion-forecaster',   name: 'Trend forecaster',          group: 'Concept' },
  { slug: 'creative-director',    name: 'Creative director',         group: 'Concept' },
  { slug: 'fashion-illustrator',  name: 'Fashion illustrator',       group: 'Concept' },
  { slug: 'ai-fashion-prompting', name: 'AI fashion / prompting',    group: 'Concept' },
  { slug: 'textile-designer',     name: 'Textile designer',          group: 'Concept' },
  { slug: 'fashion-designer',     name: 'Fashion designer',          group: 'Concept' },
  // Technical
  { slug: 'tech-pack-designer',   name: 'Tech pack designer',        group: 'Technical' },
  { slug: 'pattern-maker',        name: 'Pattern maker',             group: 'Technical' },
  { slug: 'cad-cam-specialist',   name: 'CAD / CAM specialist',      group: 'Technical' },
  { slug: 'technical-designer',   name: 'Technical designer',        group: 'Technical' },
  { slug: 'jacquard-dobby',       name: 'Jacquard / Dobby designer', group: 'Technical' },
  { slug: 'graphic-designer',     name: 'Graphic designer',          group: 'Technical' },
  // 3D & Sampling
  { slug: 'digital-fashion-3d',   name: 'Digital fashion (3D)',      group: '3D & Sampling' },
  { slug: '3d-fitting-clo3d',     name: '3D fitting (CLO3D)',        group: '3D & Sampling' },
  // Production
  { slug: 'quality-technician',   name: 'Quality technician / QA',   group: 'Production' },
  { slug: 'third-party-inspection',name: 'Third-party inspection',   group: 'Production' },
  { slug: 'social-compliance',    name: 'Social compliance audit',   group: 'Production' },
  { slug: 'testing-lab',          name: 'Testing & lab',             group: 'Production' },
  { slug: 'merchandiser',         name: 'Merchandiser / sourcing',   group: 'Production' },
  { slug: 'logistics-freight',    name: 'Logistics & freight',       group: 'Production' },
  { slug: 'sustainability',       name: 'Sustainability consulting', group: 'Production' },
  { slug: 'retail-management',    name: 'Retail management',         group: 'Production' },
  { slug: 'screen-color-separation', name: 'Screen color separation', group: 'Technical' },
  // Visual
  { slug: 'fashion-photography',  name: 'Fashion photography',       group: 'Visual' },
  { slug: 'fashion-videography',  name: 'Fashion videography',       group: 'Visual' },
  { slug: 'ad-film-commercials',  name: 'Ad film & commercials',     group: 'Visual' },
  { slug: 'visual-merchandising', name: 'Visual merchandising',      group: 'Visual' },
  { slug: 'fashion-model',        name: 'Fashion model',             group: 'Visual' },
  { slug: 'makeup-artist',        name: 'Makeup artist',             group: 'Visual' },
  { slug: 'costume-design',       name: 'Costume designer',          group: 'Visual' },
  // Web & Marketing
  { slug: 'marketplace-integration', name: 'Marketplace integration (Amazon / Myntra / Flipkart)', group: 'Web & Marketing' },
  { slug: 'ai-catalog-tagging',   name: 'AI catalog tagging',             group: 'Web & Marketing' },
  { slug: 'ai-trend-forecast',    name: 'AI trend forecasting',           group: 'Web & Marketing' },
  { slug: 'fashion-website',      name: 'Website developer',              group: 'Web & Marketing' },
  { slug: 'uiux-figma-fashion',   name: 'UI/UX designer',                 group: 'Web & Marketing' },
  { slug: 'fashion-coding',       name: 'Shopify / e-commerce developer', group: 'Web & Marketing' },
  { slug: 'fashion-marketing',    name: 'Fashion digital marketing',      group: 'Web & Marketing' },
  { slug: 'fashion-copywriting',  name: 'Fashion copywriting',            group: 'Web & Marketing' },
];

export const myGigs: Gig[] = [
  {
    id: 'g1', slug: 'tech-pack-clo3d-24h',
    title: 'I will create production-ready tech packs in CLO3D · 24h',
    service: 'Tech pack designer', serviceSlug: 'tech-pack-designer',
    sellerId: '3', sellerName: 'Yuna Aoki',
    sellerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop',
    sellerCity: 'Tokyo',
    rating: 5.0, reviews: 67,
    img: 'https://images.unsplash.com/photo-1521336575822-6da63fb45455?w=900&auto=format&fit=crop',
    from: 120, currency: 'USD',
    tiers: [
      { name: 'Basic', price: 120, days: 1, revisions: 2, bullets: ['Single garment', 'Front/back/side flats', 'BOM', '2 revisions'] },
      { name: 'Standard', price: 320, days: 3, revisions: 4, bullets: ['3 garments', 'Graded sizing', 'Construction details', '4 revisions'] },
      { name: 'Premium', price: 840, days: 7, revisions: 99, bullets: ['8+ garments', 'CLO3D fitting', 'Sourcing notes', 'Unlimited revisions'] },
    ],
  },
  {
    id: 'g2', slug: 'pattern-grading-astm',
    title: 'I will grade your patterns to ASTM/EU sizing · DXF',
    service: 'Pattern maker', serviceSlug: 'pattern-maker',
    sellerId: '3', sellerName: 'Yuna Aoki',
    sellerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop',
    sellerCity: 'Tokyo',
    rating: 4.94, reviews: 28,
    img: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=900&auto=format&fit=crop',
    from: 280, currency: 'USD',
    tiers: [
      { name: 'Basic', price: 280, days: 2, revisions: 1, bullets: ['Single style', 'XS–XL', 'DXF + PDF'] },
      { name: 'Standard', price: 560, days: 4, revisions: 2, bullets: ['Up to 3 styles', 'XXS–XXL', 'Includes adjustments'] },
      { name: 'Premium', price: 1240, days: 7, revisions: 99, bullets: ['Up to 8 styles', 'Custom size charts', 'Factory liaison'] },
    ],
  },
];

export const myOrders: Order[] = [
  { id: 'o1', gigSlug: 'tech-pack-clo3d-24h', gigTitle: 'Tech pack · linen trouser', buyer: 'Auriga · Sara Lindqvist', seller: 'Yuna Aoki', sellerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop', status: 'in_progress', tier: 'Standard', amount: '$320', orderedAt: 'May 06', due: 'May 09' },
  { id: 'o2', gigSlug: 'tech-pack-clo3d-24h', gigTitle: 'Tech pack · wrap dress', buyer: 'Hanako Studio · Akira Sato', seller: 'Yuna Aoki', sellerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop', status: 'delivered', tier: 'Premium', amount: '$840', orderedAt: 'May 03', due: 'May 10' },
  { id: 'o3', gigSlug: 'pattern-grading-astm', gigTitle: 'Pattern grading · 5 styles', buyer: 'Maison Kirei · Emma DuBois', seller: 'Yuna Aoki', sellerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop', status: 'reviewed', tier: 'Premium', amount: '$1,240', orderedAt: 'Apr 24', due: 'May 01' },
  { id: 'o4', gigSlug: 'tech-pack-clo3d-24h', gigTitle: 'Tech pack · denim jacket', buyer: 'Vestra · Lauren Cole', seller: 'Yuna Aoki', sellerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop', status: 'ordered', tier: 'Basic', amount: '$120', orderedAt: 'May 07', due: 'May 08' },
  { id: 'o5', gigSlug: 'tech-pack-clo3d-24h', gigTitle: 'Tech pack · skirt set', buyer: 'Léon & Co.', seller: 'Yuna Aoki', sellerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop', status: 'cancelled', tier: 'Basic', amount: '$120', orderedAt: 'Apr 30', due: 'May 01' },
];

// Brand-side orders (orders the brand placed)
export const brandOrders: Order[] = [
  { id: 'bo1', gigSlug: 'tech-pack-clo3d-24h', gigTitle: 'Tech pack · linen trouser', buyer: 'Auriga', seller: 'Yuna Aoki', sellerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop', status: 'in_progress', tier: 'Standard', amount: '$320', orderedAt: 'May 06', due: 'May 09' },
  { id: 'bo2', gigSlug: 'fashion-photography', gigTitle: 'Cover shoot · SS27 launch', buyer: 'Auriga', seller: 'Elena Marchetti', sellerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop', status: 'in_progress', tier: 'Premium', amount: '€3,800', orderedAt: 'May 05', due: 'May 12' },
  { id: 'bo3', gigSlug: 'ai-fashion-prompting', gigTitle: 'AI lookbook concept', buyer: 'Auriga', seller: 'Sofia Rosso', sellerAvatar: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=120&auto=format&fit=crop', status: 'delivered', tier: 'Standard', amount: '$240', orderedAt: 'May 02', due: 'May 06' },
  { id: 'bo4', gigSlug: 'fashion-website', gigTitle: 'Shopify build · capsule launch', buyer: 'Auriga', seller: 'Rina Patel', sellerAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&auto=format&fit=crop', status: 'reviewed', tier: 'Premium', amount: '$2,400', orderedAt: 'Apr 18', due: 'May 02' },
  { id: 'bo5', gigSlug: 'visual-merchandising', gigTitle: 'Window display concept', buyer: 'Auriga', seller: 'Marco Reyes', sellerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop', status: 'ordered', tier: 'Basic', amount: '$280', orderedAt: 'May 07', due: 'May 11' },
];

export const orderStatuses = ['ordered', 'in_progress', 'delivered', 'reviewed'] as const;

export const trustedBrands = ['Maison Kirei', 'VESTRA', 'Léon & Co.', 'NORTH ATELIER', 'Hanako Studio', 'OBSCURA', 'Auriga', 'PRIMA · MILANO'];

// Currency helper
export const fmtMoney = (n: number, c = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: c, maximumFractionDigits: 0 }).format(n);

// Mocked current user (creator side)
export const currentUser = {
  name: 'Yuna Aoki',
  handle: '@yunaaoki',
  email: 'yuna@example.com',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop',
  role: 'creator' as 'creator' | 'brand',
  plan: 'Pro Creator',
};

export const currentBrand = {
  name: 'Auriga',
  email: 'sara@auriga.world',
  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop',
  role: 'brand' as const,
  plan: 'Enterprise',
};
