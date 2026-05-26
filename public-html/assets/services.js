/* Fashion Freelancing — service catalog
 * Grouped by PRODUCTION STAGE — brands shop by where they are in the process.
 * Concept → Technical → 3D & Sampling → Production → Visual → Web & Marketing
 */
window.FOS_SERVICES = [
  // ---------- Concept (early-stage ideas, before specs) ----------
  { slug: 'fashion-forecaster',   name: 'Trend forecaster',          group: 'Concept',   count: 132,  from: 600, img: 'photo-1539109136881-3be0616acf4b' },
  { slug: 'creative-director',    name: 'Creative director',         group: 'Concept',   count: 188,  from: 1500,img: 'photo-1490481651871-ab68de25d43d' },
  { slug: 'fashion-illustrator',  name: 'Fashion illustrator',       group: 'Concept',   count: 612,  from: 120, img: 'photo-1503602642458-232111445657' },
  { slug: 'ai-fashion-prompting', name: 'AI fashion / prompting',    group: 'Concept',   count: 412,  from: 60,  img: 'photo-1620063633168-8b1bea99bafd' },
  { slug: 'textile-designer',     name: 'Textile designer',          group: 'Concept',   count: 624,  from: 180, img: 'photo-1459411552884-841db9b3cc2a' },
  { slug: 'fashion-designer',     name: 'Fashion designer',          group: 'Concept',   count: 2480, from: 320, img: 'photo-1539109136881-3be0616acf4b' },

  // ---------- Technical (factory-ready specs, the high-value layer) ----------
  { slug: 'tech-pack-designer',   name: 'Tech pack designer',        group: 'Technical', count: 980,  from: 120, img: 'photo-1558769132-cb1aea458c5e' },
  { slug: 'pattern-maker',        name: 'Pattern maker',             group: 'Technical', count: 1302, from: 180, img: 'photo-1556905055-8f358a7a47b2' },
  { slug: 'cad-cam-specialist',   name: 'CAD / CAM specialist',      group: 'Technical', count: 412,  from: 200, img: 'photo-1555421689-491a97ff2040' },
  { slug: 'technical-designer',   name: 'Technical designer',        group: 'Technical', count: 540,  from: 240, img: 'photo-1558769132-cb1aea458c5e' },
  { slug: 'jacquard-dobby',       name: 'Jacquard / Dobby designer', group: 'Technical', count: 188,  from: 280, img: 'photo-1493106641515-6b5631de4bb9' },
  { slug: 'graphic-designer',     name: 'Graphic designer',          group: 'Technical', count: 1820, from: 80,  img: 'photo-1542744095-fcf48d80b0fd' },

  // ---------- 3D & Sampling (digital fittings before physical sample) ----------
  { slug: 'digital-fashion-3d',   name: 'Digital fashion (3D)',      group: '3D & Sampling', count: 184, from: 240, img: 'photo-1513104890138-7c749659a591' },
  { slug: '3d-fitting-clo3d',     name: '3D fitting (CLO3D)',        group: '3D & Sampling', count: 264, from: 220, img: 'photo-1521336575822-6da63fb45455' },

  // ---------- Production (QC, sourcing, sustainability, retail) ----------
  { slug: 'quality-technician',   name: 'Quality technician / QA',   group: 'Production', count: 286, from: 160, img: 'photo-1567789884554-0b844b597180' },
  { slug: 'testing-lab',          name: 'Testing & lab',             group: 'Production', count: 102, from: 200, img: 'photo-1581094288338-2314dddb7ece' },
  { slug: 'merchandiser',         name: 'Merchandiser / sourcing',   group: 'Production', count: 412, from: 320, img: 'photo-1542060748-10c28b62716f' },
  { slug: 'sustainability',       name: 'Sustainability consulting', group: 'Production', count: 142, from: 380, img: 'photo-1542838132-92c53300491e' },
  { slug: 'retail-management',    name: 'Retail management',         group: 'Production', count: 96,  from: 480, img: 'photo-1441984904996-e0b6ba687e04' },

  // ---------- Visual (photo, video, model, makeup, set) ----------
  { slug: 'fashion-photography',  name: 'Fashion photography',       group: 'Visual',    count: 1766, from: 350, img: 'photo-1483985988355-763728e1935b' },
  { slug: 'fashion-videography',  name: 'Fashion videography',       group: 'Visual',    count: 824,  from: 480, img: 'photo-1492691527719-9d1e07e534b4' },
  { slug: 'ad-film-commercials',  name: 'Ad film & commercials',     group: 'Visual',    count: 312,  from: 1200,img: 'photo-1505739998589-00fc191ce01d' },
  { slug: 'visual-merchandising', name: 'Visual merchandising',      group: 'Visual',    count: 246,  from: 280, img: 'photo-1519415943484-9fa1873496d4' },
  { slug: 'fashion-model',        name: 'Fashion model',             group: 'Visual',    count: 214,  from: 250, img: 'photo-1581338834647-b0fb40704e21' },
  { slug: 'makeup-artist',        name: 'Makeup artist',             group: 'Visual',    count: 168,  from: 180, img: 'photo-1487412947147-5cebf100ffc2' },
  { slug: 'costume-design',       name: 'Costume designer',          group: 'Visual',    count: 78,   from: 800, img: 'photo-1559827260-dc66d52bef19' },

  // ---------- Web & Marketing (site, store, growth) ----------
  { slug: 'fashion-website',      name: 'Website developer',              group: 'Web & Marketing', count: 384, from: 480, img: 'photo-1523289333742-be1143f6b766' },
  { slug: 'uiux-figma-fashion',   name: 'UI/UX designer',                 group: 'Web & Marketing', count: 246, from: 300, img: 'photo-1561070791-2526d30994b8' },
  { slug: 'fashion-coding',       name: 'Shopify / e-commerce developer', group: 'Web & Marketing', count: 168, from: 380, img: 'photo-1551288049-bebda4e38f71' },
  { slug: 'fashion-marketing',    name: 'Fashion digital marketing',      group: 'Web & Marketing', count: 588, from: 240, img: 'photo-1554774853-aae0a22c8aa4' },
  { slug: 'fashion-copywriting',  name: 'Fashion copywriting',            group: 'Web & Marketing', count: 184, from: 90,  img: 'photo-1486312338219-ce68d2c6f44d' },
];

window.FOS_GROUPS = {
  'Concept':         { label: 'Concept & design',      icon: '✦', blurb: 'Trend, mood, illustration, direction.' },
  'Technical':       { label: 'Technical design',      icon: '⚙', blurb: 'Tech packs, patterns, CAD — factory-ready files.' },
  '3D & Sampling':   { label: '3D virtual sampling',   icon: '◈', blurb: 'CLO3D / Browzwear — fit it digitally before you make it.' },
  'Production':      { label: 'Production & QC',       icon: '⌬', blurb: 'Sourcing, QA, testing, sustainability.' },
  'Visual':          { label: 'Visual & media',        icon: '◉', blurb: 'Photo, video, models, makeup, set.' },
  'Web & Marketing': { label: 'Web & marketing',       icon: '◇', blurb: 'Online store, digital, growth.' },
};
