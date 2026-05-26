/* Fashion Freelancing — service catalog */
window.FOS_SERVICES = [
  // Group: Design & Creative
  { slug: 'fashion-designer',     name: 'Fashion designer',          group: 'Design',     count: 2480, from: 320, img: 'photo-1539109136881-3be0616acf4b' },
  { slug: 'graphic-designer',     name: 'Graphic designer',          group: 'Design',     count: 1820, from: 80,  img: 'photo-1542744095-fcf48d80b0fd' },
  { slug: 'fashion-illustrator',  name: 'Fashion illustrator',       group: 'Design',     count: 612,  from: 120, img: 'photo-1503602642458-232111445657' },
  { slug: 'textile-designer',     name: 'Textile designer',          group: 'Design',     count: 624,  from: 180, img: 'photo-1459411552884-841db9b3cc2a' },
  { slug: 'ai-fashion-prompting', name: 'AI fashion / prompting',    group: 'Design',     count: 412,  from: 60,  img: 'photo-1620063633168-8b1bea99bafd' },
  { slug: 'digital-fashion-3d',   name: 'Digital fashion (3D)',      group: 'Design',     count: 184,  from: 240, img: 'photo-1513104890138-7c749659a591' },

  // Group: Technical
  { slug: 'tech-pack-designer',   name: 'Tech pack designer',        group: 'Technical',  count: 980,  from: 120, img: 'photo-1558769132-cb1aea458c5e' },
  { slug: 'pattern-maker',        name: 'Pattern maker',             group: 'Technical',  count: 1302, from: 180, img: 'photo-1556905055-8f358a7a47b2' },
  { slug: 'cad-cam-specialist',   name: 'CAD / CAM specialist',      group: 'Technical',  count: 412,  from: 200, img: 'photo-1555421689-491a97ff2040' },
  { slug: 'jacquard-dobby',       name: 'Jacquard / Dobby designer', group: 'Technical',  count: 188,  from: 280, img: 'photo-1493106641515-6b5631de4bb9' },
  { slug: '3d-fitting-clo3d',     name: '3D fitting (CLO3D)',        group: 'Technical',  count: 264,  from: 220, img: 'photo-1521336575822-6da63fb45455' },
  { slug: 'technical-designer',   name: 'Technical designer',        group: 'Technical',  count: 540,  from: 240, img: 'photo-1558769132-cb1aea458c5e' },
  { slug: 'quality-technician',   name: 'Quality technician / QA',   group: 'Technical',  count: 286,  from: 160, img: 'photo-1567789884554-0b844b597180' },
  { slug: 'testing-lab',          name: 'Testing & lab',             group: 'Technical',  count: 102,  from: 200, img: 'photo-1581094288338-2314dddb7ece' },

  // Group: Visual & Media
  { slug: 'fashion-photography',  name: 'Fashion photography',       group: 'Visual',     count: 1766, from: 350, img: 'photo-1483985988355-763728e1935b' },
  { slug: 'fashion-videography',  name: 'Fashion videography',       group: 'Visual',     count: 824,  from: 480, img: 'photo-1492691527719-9d1e07e534b4' },
  { slug: 'ad-film-commercials',  name: 'Ad film & commercials',     group: 'Visual',     count: 312,  from: 1200,img: 'photo-1505739998589-00fc191ce01d' },
  { slug: 'visual-merchandising', name: 'Visual merchandising',      group: 'Visual',     count: 246,  from: 280, img: 'photo-1519415943484-9fa1873496d4' },

  // Group: Web & UX
  { slug: 'fashion-website',      name: 'Website developer',           group: 'Web & UX',   count: 384,  from: 480, img: 'photo-1523289333742-be1143f6b766' },
  { slug: 'uiux-figma-fashion',   name: 'UI/UX designer', group: 'Web & UX',   count: 246,  from: 300, img: 'photo-1561070791-2526d30994b8' },
  { slug: 'fashion-coding',       name: 'Shopify & e-commerce developer',  group: 'Web & UX',   count: 168,  from: 380, img: 'photo-1551288049-bebda4e38f71' },

  // Group: Business & Marketing
  { slug: 'fashion-forecaster',   name: 'Fashion forecaster',        group: 'Business',   count: 132,  from: 600, img: 'photo-1539109136881-3be0616acf4b' },
  { slug: 'merchandiser',         name: 'Merchandiser / sourcing',   group: 'Business',   count: 412,  from: 320, img: 'photo-1542060748-10c28b62716f' },
  { slug: 'fashion-marketing',    name: 'Fashion digital marketing', group: 'Business',   count: 588,  from: 240, img: 'photo-1554774853-aae0a22c8aa4' },
  { slug: 'retail-management',    name: 'Retail management',         group: 'Business',   count: 96,   from: 480, img: 'photo-1441984904996-e0b6ba687e04' },
  { slug: 'sustainability',       name: 'Sustainability consulting', group: 'Business',   count: 142,  from: 380, img: 'photo-1542838132-92c53300491e' },
  { slug: 'fashion-copywriting',  name: 'Fashion copywriting',       group: 'Business',   count: 184,  from: 90,  img: 'photo-1486312338219-ce68d2c6f44d' },

  // Group: Niche
  { slug: 'costume-design',       name: 'Costume designer',          group: 'Niche',      count: 78,   from: 800, img: 'photo-1559827260-dc66d52bef19' },
  { slug: 'creative-director',    name: 'Creative director',         group: 'Niche',      count: 188,  from: 1500,img: 'photo-1490481651871-ab68de25d43d' },
  { slug: 'fashion-model',        name: 'Fashion model',             group: 'Niche',      count: 214,  from: 250, img: 'photo-1581338834647-b0fb40704e21' },
  { slug: 'makeup-artist',        name: 'Makeup artist',             group: 'Niche',      count: 168,  from: 180, img: 'photo-1487412947147-5cebf100ffc2' },
];

window.FOS_GROUPS = {
  Design:    { label: 'Design & creative', icon: '✦' },
  Technical: { label: 'Technical & production', icon: '⚙' },
  Visual:    { label: 'Visual & media', icon: '◉' },
  'Web & UX':{ label: 'Web, UX &amp; code', icon: '◇' },
  Business:  { label: 'Business & marketing', icon: '⌬' },
  Niche:     { label: 'Niche specialty', icon: '◆' },
};
