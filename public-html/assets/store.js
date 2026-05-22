/**
 * Fashion Freelancing — store layer
 *
 * Persistent localStorage-backed store with seed data.
 * Use it via the api.js wrapper, never directly.
 *
 * Production: swap this whole file for a Firebase / Postgres / Drizzle adapter.
 * The api.js surface stays identical.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FFStore = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  const KEY = 'ff_store_v1';
  const SESSION_KEY = 'ff_session';
  const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

  // ============================================================
  //  Helpers
  // ============================================================
  const uid = (prefix = 'id') => prefix + '_' + Math.random().toString(36).slice(2, 11);
  const now = () => new Date().toISOString();
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // ============================================================
  //  Seed data
  // ============================================================
  function seed() {
    const t0 = now();
    const u_yuna  = { id: 'u_yuna',  email: 'yuna@example.com',  name: 'Yuna Aoki',     handle: '@yunaaoki',     role: 'creator', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop', coverImage: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=1400&auto=format&fit=crop', locale: 'en-US', timezone: 'Asia/Tokyo', emailVerified: true, phoneVerified: false, twoFactorEnabled: true, plan: 'pro', status: 'active', createdAt: t0, updatedAt: t0, savedFreelancerIds: [], savedJobIds: [], notificationPrefs: defaultNotifPrefs() };
    const u_amara = { id: 'u_amara', email: 'amara@example.com', name: 'Amara Okafor',  handle: '@amara.tp',     role: 'creator', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop', locale: 'en-NG', timezone: 'Africa/Lagos', emailVerified: true, phoneVerified: true, twoFactorEnabled: true, plan: 'pro', status: 'active', createdAt: t0, updatedAt: t0, savedFreelancerIds: [], savedJobIds: [], notificationPrefs: defaultNotifPrefs() };
    const u_marco = { id: 'u_marco', email: 'marco@example.com', name: 'Marco Reyes',   handle: '@marcoreyes',   role: 'creator', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop', locale: 'es-MX', timezone: 'America/Mexico_City', emailVerified: true, phoneVerified: false, twoFactorEnabled: false, plan: 'free', status: 'active', createdAt: t0, updatedAt: t0, savedFreelancerIds: [], savedJobIds: [], notificationPrefs: defaultNotifPrefs() };
    const u_elena = { id: 'u_elena', email: 'elena@example.com', name: 'Elena Marchetti', handle: '@elenamarchetti', role: 'creator', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop', locale: 'it-IT', timezone: 'Europe/Rome', emailVerified: true, phoneVerified: true, twoFactorEnabled: true, plan: 'pro', status: 'active', createdAt: t0, updatedAt: t0, savedFreelancerIds: [], savedJobIds: [], notificationPrefs: defaultNotifPrefs() };
    const u_kai   = { id: 'u_kai',   email: 'kai@example.com',   name: 'Kai Nakamura',  handle: '@kainakamura',  role: 'creator', avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&auto=format&fit=crop', locale: 'de-DE', timezone: 'Europe/Berlin', emailVerified: true, phoneVerified: false, twoFactorEnabled: false, plan: 'free', status: 'active', createdAt: t0, updatedAt: t0, savedFreelancerIds: [], savedJobIds: [], notificationPrefs: defaultNotifPrefs() };
    const u_sofia = { id: 'u_sofia', email: 'sofia@example.com', name: 'Sofia Rosso',   handle: '@sofiarosso',   role: 'creator', avatar: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=200&auto=format&fit=crop', locale: 'fr-FR', timezone: 'Europe/Paris', emailVerified: true, phoneVerified: true, twoFactorEnabled: true, plan: 'pro', status: 'active', createdAt: t0, updatedAt: t0, savedFreelancerIds: [], savedJobIds: [], notificationPrefs: defaultNotifPrefs() };
    const u_rina  = { id: 'u_rina',  email: 'rina@example.com',  name: 'Rina Patel',    handle: '@rinatextiles', role: 'creator', avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&auto=format&fit=crop', locale: 'en-IN', timezone: 'Asia/Kolkata', emailVerified: true, phoneVerified: false, twoFactorEnabled: false, plan: 'free', status: 'active', createdAt: t0, updatedAt: t0, savedFreelancerIds: [], savedJobIds: [], notificationPrefs: defaultNotifPrefs() };
    const u_james = { id: 'u_james', email: 'james@example.com', name: 'James Cole',    handle: '@jamescole',    role: 'creator', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop', locale: 'en-GB', timezone: 'Europe/London', emailVerified: true, phoneVerified: false, twoFactorEnabled: false, plan: 'pro', status: 'active', createdAt: t0, updatedAt: t0, savedFreelancerIds: [], savedJobIds: [], notificationPrefs: defaultNotifPrefs() };

    // Brands
    const u_auriga = { id: 'u_auriga', email: 'sara@auriga.world',    name: 'Sara Lindqvist · Auriga', handle: '@auriga',    role: 'brand', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop', locale: 'sv-SE', timezone: 'Europe/Stockholm', emailVerified: true, phoneVerified: true, twoFactorEnabled: true, plan: 'enterprise', status: 'active', createdAt: t0, updatedAt: t0, savedFreelancerIds: ['u_yuna', 'u_amara'], savedJobIds: [], notificationPrefs: defaultNotifPrefs() };
    const u_kirei  = { id: 'u_kirei',  email: 'emma@maisonkirei.com', name: 'Emma · Maison Kirei',     handle: '@maisonkirei',role: 'brand', avatar: 'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=200&auto=format&fit=crop', locale: 'fr-FR', timezone: 'Europe/Paris', emailVerified: true, phoneVerified: true, twoFactorEnabled: true, plan: 'studio', status: 'active', createdAt: t0, updatedAt: t0, savedFreelancerIds: [], savedJobIds: [], notificationPrefs: defaultNotifPrefs() };
    const u_hanako = { id: 'u_hanako', email: 'akira@hanako.studio',  name: 'Akira · Hanako Studio',   handle: '@hanako',    role: 'brand', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop', locale: 'ja-JP', timezone: 'Asia/Tokyo', emailVerified: true, phoneVerified: false, twoFactorEnabled: false, plan: 'studio', status: 'active', createdAt: t0, updatedAt: t0, savedFreelancerIds: [], savedJobIds: [], notificationPrefs: defaultNotifPrefs() };

    // Admin
    const u_admin = { id: 'u_admin', email: 'admin@fashionfreelancing.app', name: 'Admin', handle: '@admin', role: 'admin', avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&auto=format&fit=crop', locale: 'en-US', timezone: 'UTC', emailVerified: true, phoneVerified: true, twoFactorEnabled: true, plan: 'enterprise', status: 'active', createdAt: t0, updatedAt: t0, savedFreelancerIds: [], savedJobIds: [], notificationPrefs: defaultNotifPrefs() };

    const users = [u_yuna, u_amara, u_marco, u_elena, u_kai, u_sofia, u_rina, u_james, u_auriga, u_kirei, u_hanako, u_admin];

    // Freelancers (1-to-1 with creator users)
    const freelancers = [
      mkFreelancer(u_yuna,  { headline:'Womenswear designer · Tokyo · couture-trained',     bio:'Trained at Bunka Fashion College and Atelier Versace. I work with indie luxury houses on capsule womenswear collections.', service:'fashion-designer', city:'Tokyo', country:'Japan', cc:'JP', currency:'USD', from:2400, rating:4.97, reviewCount:142, completed:142, badges:['featured','top_1','verified'], skills:['Couture','Drape','Silk','Hand-embroidery'], tools:['CLO3D','Adobe Illustrator'], languages:['en','ja','it'], onTime:99, completion:99, response:60 }),
      mkFreelancer(u_amara, { headline:'Tech pack designer · Lagos · 24h delivery',         bio:'Mechanical engineer turned tech-pack specialist. CLO3D + Centric PLM expert. 100% completion rate.',                       service:'tech-pack-designer', city:'Lagos', country:'Nigeria', cc:'NG', currency:'USD', from:120, rating:5.0, reviewCount:67, completed:67, badges:['pro','top_rated','verified'], skills:['CLO3D','BOM','Grading','Knit','Woven'], tools:['CLO3D','Centric PLM','Adobe Illustrator'], languages:['en'], onTime:100, completion:100, response:50 }),
      mkFreelancer(u_marco, { headline:'Streetwear designer · Mexico City',                 bio:'Streetwear designer specializing in denim, graphic and workwear-inspired collections.',                                       service:'fashion-designer', city:'Mexico City', country:'Mexico', cc:'MX', currency:'USD', from:1150, rating:4.92, reviewCount:89, completed:89, badges:['rising','verified'], skills:['Denim','Graphic','Workwear'], tools:['Adobe Illustrator','Procreate'], languages:['es','en'], onTime:97, completion:97, response:120 }),
      mkFreelancer(u_elena, { headline:'Editorial stylist · Milan · Vogue alum',            bio:'14 years editorial and runway. Past covers: Vogue Italia, Numéro, Dazed.',                                                       service:'fashion-photography', city:'Milan', country:'Italy', cc:'IT', currency:'EUR', from:3800, rating:4.98, reviewCount:211, completed:211, badges:['top_1','vogue_alum','verified'], skills:['Vogue','Runway','Lookbook'], tools:['Phase One','Capture One'], languages:['it','en','fr'], onTime:98, completion:98, response:90 }),
      mkFreelancer(u_kai,   { headline:'Pattern maker · Berlin · knitwear',                  bio:'Knitwear pattern maker with 8 years building blocks for German and Scandinavian indie labels.',                                  service:'pattern-maker', city:'Berlin', country:'Germany', cc:'DE', currency:'EUR', from:1600, rating:4.94, reviewCount:73, completed:73, badges:['verified'], skills:['Knit','Sustainable','Block','Drape'], tools:['Optitex'], languages:['de','en'], onTime:96, completion:96, response:180 }),
      mkFreelancer(u_sofia, { headline:'Creative director · Paris',                          bio:'Former art director at Maison Margiela. Now consulting with emerging luxury houses on brand worlds and seasonal direction.',  service:'creative-director', city:'Paris', country:'France', cc:'FR', currency:'EUR', from:6500, rating:4.96, reviewCount:38, completed:38, badges:['top_1','verified'], skills:['Brand strategy','Campaigns','Art direction'], tools:['Figma','Keynote'], languages:['fr','en'], onTime:100, completion:100, response:120 }),
      mkFreelancer(u_rina,  { headline:'Textile designer · Mumbai · hand-loom',              bio:'Bridges traditional Indian hand-loom techniques with contemporary fashion design.',                                              service:'textile-designer', city:'Mumbai', country:'India', cc:'IN', currency:'USD', from:720, rating:4.91, reviewCount:102, completed:102, badges:['verified','sustainable'], skills:['Print','Block print','Hand-loom','Natural dye'], tools:['Adobe Illustrator','Photoshop'], languages:['en','hi'], onTime:95, completion:95, response:240 }),
      mkFreelancer(u_james, { headline:'Footwear designer · London',                          bio:'10 years across mass and luxury — Clarks, Common Projects, indie sneaker labels.',                                              service:'fashion-designer', city:'London', country:'UK', cc:'GB', currency:'GBP', from:2100, rating:4.89, reviewCount:54, completed:54, badges:['verified'], skills:['Footwear','Sneakers','Last design','Leather'], tools:['Rhino','Adobe Illustrator'], languages:['en'], onTime:98, completion:98, response:120 }),
    ];

    // Service categories
    const services = [
      svc('fashion-designer',     'Fashion designer',          'Design',     2480, 320, 'photo-1539109136881-3be0616acf4b'),
      svc('graphic-designer',     'Graphic designer',          'Design',     1820, 80,  'photo-1542744095-fcf48d80b0fd'),
      svc('fashion-illustrator',  'Fashion illustrator',       'Design',     612,  120, 'photo-1503602642458-232111445657'),
      svc('textile-designer',     'Textile designer',          'Design',     624,  180, 'photo-1459411552884-841db9b3cc2a'),
      svc('ai-fashion-prompting', 'AI fashion / prompting',    'Design',     412,  60,  'photo-1620063633168-8b1bea99bafd'),
      svc('digital-fashion-3d',   'Digital fashion (3D)',      'Design',     184,  240, 'photo-1513104890138-7c749659a591'),
      svc('tech-pack-designer',   'Tech pack designer',        'Technical',  980,  120, 'photo-1558769132-cb1aea458c5e'),
      svc('pattern-maker',        'Pattern maker',             'Technical',  1302, 180, 'photo-1556905055-8f358a7a47b2'),
      svc('cad-cam-specialist',   'CAD / CAM specialist',      'Technical',  412,  200, 'photo-1555421689-491a97ff2040'),
      svc('jacquard-dobby',       'Jacquard / Dobby designer', 'Technical',  188,  280, 'photo-1493106641515-6b5631de4bb9'),
      svc('3d-fitting-clo3d',     '3D fitting (CLO3D)',        'Technical',  264,  220, 'photo-1521336575822-6da63fb45455'),
      svc('technical-designer',   'Technical designer',        'Technical',  540,  240, 'photo-1558769132-cb1aea458c5e'),
      svc('quality-technician',   'Quality technician / QA',   'Technical',  286,  160, 'photo-1567789884554-0b844b597180'),
      svc('testing-lab',          'Testing & lab',             'Technical',  102,  200, 'photo-1581094288338-2314dddb7ece'),
      svc('fashion-photography',  'Fashion photography',       'Visual',     1766, 350, 'photo-1483985988355-763728e1935b'),
      svc('fashion-videography',  'Fashion videography',       'Visual',     824,  480, 'photo-1492691527719-9d1e07e534b4'),
      svc('ad-film-commercials',  'Ad film & commercials',     'Visual',     312,  1200,'photo-1505739998589-00fc191ce01d'),
      svc('visual-merchandising', 'Visual merchandising',      'Visual',     246,  280, 'photo-1519415943484-9fa1873496d4'),
      svc('fashion-website',      'Website developer',           'Web & UX',   384,  480, 'photo-1523289333742-be1143f6b766'),
      svc('uiux-figma-fashion',   'UI/UX designer', 'Web & UX',   246,  300, 'photo-1561070791-2526d30994b8'),
      svc('fashion-coding',       'Shopify & e-commerce developer',  'Web & UX',   168,  380, 'photo-1551288049-bebda4e38f71'),
      svc('fashion-forecaster',   'Fashion forecaster',        'Business',   132,  600, 'photo-1539109136881-3be0616acf4b'),
      svc('merchandiser',         'Merchandiser / sourcing',   'Business',   412,  320, 'photo-1542060748-10c28b62716f'),
      svc('fashion-marketing',    'Fashion digital marketing', 'Business',   588,  240, 'photo-1554774853-aae0a22c8aa4'),
      svc('retail-management',    'Retail management',         'Business',   96,   480, 'photo-1441984904996-e0b6ba687e04'),
      svc('sustainability',       'Sustainability consulting', 'Business',   142,  380, 'photo-1542838132-92c53300491e'),
      svc('fashion-copywriting',  'Fashion copywriting',       'Business',   184,  90,  'photo-1486312338219-ce68d2c6f44d'),
      svc('costume-design',       'Costume design (Film/TV)',  'Niche',      78,   800, 'photo-1559827260-dc66d52bef19'),
      svc('creative-director',    'Creative director',         'Niche',      188,  1500,'photo-1490481651871-ab68de25d43d'),
    ];

    // Packages
    const packages = [
      pkg('pkg_amara_basic',    'u_amara', 'tech-pack-designer', 'basic',    'Tech pack for one piece',          'Production-ready tech pack for one garment.',                              120,  'USD', 1, 2, ['Front, back, side flats','Full bill of materials','Single size measurements','2 free changes','Editable PDF + working files']),
      pkg('pkg_amara_standard', 'u_amara', 'tech-pack-designer', 'standard', 'Capsule tech pack (3 styles)',     'Tech packs for 3 garments with grading.',                                  320,  'USD', 3, 4, ['Up to 3 styles','XS–XL graded','Construction details','4 free changes','Includes digital fittings']),
      pkg('pkg_amara_premium',  'u_amara', 'tech-pack-designer', 'premium',  'Full collection (8+)',             'Tech packs for full collection with CLO3D fitting and factory contacts.',  840,  'USD', 7, 99,['8+ styles','XXS–XXL custom grading','CLO3D virtual fitting','Sourcing notes','Unlimited revisions (30 days)']),

      pkg('pkg_yuna_basic',     'u_yuna',  'fashion-designer',   'basic',    'Single garment design',            'One garment from concept to tech pack.',                                   2400, 'USD', 14, 2, ['Concept moodboard','Sketch + flats','Materials selection','One round of changes']),
      pkg('pkg_yuna_standard',  'u_yuna',  'fashion-designer',   'standard', '5-piece capsule',                  'Coherent 5-piece capsule with shared materials.',                          8400, 'USD', 28, 4, ['5 garments','Shared color story','Tech packs included','4 rounds of changes']),
      pkg('pkg_yuna_premium',   'u_yuna',  'fashion-designer',   'premium',  '10-piece collection',              'Full collection from concept to delivery, factory liaison included.',      14000,'USD', 56, 99,['10 garments','Concept book','Tech packs','Factory liaison','Unlimited revisions']),

      pkg('pkg_elena_basic',    'u_elena', 'fashion-photography','basic',    'Half-day editorial shoot',         'Half-day editorial shoot, 5 final images.',                                1500, 'EUR', 7, 1, ['Half day','5 retouched images','Online gallery','One round of changes']),
      pkg('pkg_elena_standard', 'u_elena', 'fashion-photography','standard', 'Full-day campaign shoot',          'Full day, 15 final images, on-set styling.',                               3800, 'EUR', 10,2, ['Full day','15 retouched images','On-set styling','Two rounds of changes']),
      pkg('pkg_elena_premium',  'u_elena', 'fashion-photography','premium',  'Full campaign (2 days)',           'Two days, 30 images plus video, full creative direction.',                 7800, 'EUR', 14,4, ['Two days','30 retouched images','Behind-the-scenes video','Creative direction']),

      pkg('pkg_marco_basic',    'u_marco', 'fashion-designer',   'basic',    'Streetwear logo design',           'Logo + 1 graphic for your streetwear brand.',                              80,   'USD', 3, 2, ['Brand mark','One placement graphic','Two rounds of changes']),
      pkg('pkg_kai_basic',      'u_kai',   'pattern-maker',      'basic',    'Pattern grading (one style)',      'Grade one pattern from XS–XXL.',                                           280,  'EUR', 3, 1, ['Single style','XS–XXL','DXF + PDF']),
      pkg('pkg_sofia_basic',    'u_sofia', 'creative-director',  'basic',    'Brand world consulting (1 month)', 'One month of fractional creative direction for brand-launch.',             6500, 'EUR', 30,99,['Weekly calls','Brand book','Campaign concepts']),
      pkg('pkg_rina_basic',     'u_rina',  'textile-designer',   'basic',    'Original print collection (3)',    '3 original prints with full colorways.',                                   720,  'USD', 14,2, ['3 prints','Full colorways','Repeat-ready files','Two rounds of changes']),
      pkg('pkg_james_basic',    'u_james', 'fashion-designer',   'basic',    'Sneaker concept (1 model)',        'One sneaker model concept with last + colorways.',                         2100, 'GBP', 21,2, ['Concept sketches','Last design','3 colorways']),
    ];

    // Briefs (custom jobs posted by brands)
    const briefs = [
      brf('brief_kirei_ss27', 'u_kirei', 'Senior womenswear designer for SS27 capsule', 'fashion-designer', 'We need a senior designer for our 10-piece SS27 ready-to-wear capsule. Quiet luxury, hand-finished tailoring, organic materials.', 8000, 14000, 'USD', 'fixed', 8, 'remote', false, ['Couture','Tailoring','Linen']),
      brf('brief_vestra_tp',  'u_kirei', 'Tech pack engineer for denim line (12 SKUs)', 'tech-pack-designer','Need full tech packs for our SS27 denim drop. CLO3D output preferred.', 3200, 3200, 'USD', 'fixed', 3, 'hybrid', true, ['Tech pack','CLO3D','Denim','BOM']),
      brf('brief_leon_vogue', 'u_kirei', 'Editorial stylist for Vogue Italia February cover', 'fashion-photography','Cover styling for Vogue Italia Feb issue. Milan, on-site.', 12000, 12000, 'USD', 'day_rate', 1, 'onsite', false, ['Editorial','Vogue']),
      brf('brief_obscura_pat','u_hanako','Pattern maker for sustainable knitwear capsule', 'pattern-maker',    '8-piece knitwear capsule with sustainable yarns. Need blocks + grading.', 1800, 3000, 'USD', 'fixed', 4, 'remote', false, ['Pattern','Knit','Sustainable']),
      brf('brief_hanako_film','u_hanako','Director for our 90-second SS27 launch video',    'ad-film-commercials','90-second fashion film for our SS27 launch. Concept to delivery.', 22000, 22000, 'EUR', 'fixed', 6, 'remote', false, ['Film','Director']),
    ];

    // Conversations (between u_auriga and u_yuna for the active order)
    const conversations = [
      { id:'conv_auriga_yuna', participantIds:['u_auriga','u_yuna'], orderId:'order_auriga_yuna_1', briefId:null, lastMessagePreview:'Loving the v2 sketches. Can we push the shoulder line a touch?', lastMessageAt:t0, lastSenderId:'u_auriga', unreadCountByUser:{u_yuna:2,u_auriga:0}, createdAt:t0 },
    ];

    const messages = [
      { id:'msg1', conversationId:'conv_auriga_yuna', senderId:'u_yuna',   body:'Hi Sara — moodboard direction looks great. Sending v2 sketches now.',                              type:'text', attachments:[], sentAt:t0, delivered:true, reactions:[] },
      { id:'msg2', conversationId:'conv_auriga_yuna', senderId:'u_auriga', body:'Loving the v2 sketches. Can we push the shoulder line a touch?',                                  type:'text', attachments:[], sentAt:t0, delivered:true, reactions:[] },
    ];

    // Orders (one active between Auriga & Yuna)
    const orders = [
      mkOrder('order_auriga_yuna_1','u_auriga','u_yuna','pkg_yuna_basic',null,'Single garment · linen blazer','Linen blazer, simple drape, sample size 38.','in_progress',2400,'USD',7,'conv_auriga_yuna'),
      mkOrder('order_kirei_amara_1','u_kirei','u_amara','pkg_amara_standard',null,'Capsule tech pack (3 styles)','Need spec packs for our SS27 trousers, jacket, and dress.','delivered',320,'USD',3,null),
      mkOrder('order_hanako_marco_1','u_hanako','u_marco','pkg_marco_basic',null,'Streetwear logo design','Logo + graphic for our SS27 capsule sub-brand.','reviewed',80,'USD',3,null),
    ];

    // Reviews
    const reviews = [
      { id:'rev_kirei_amara', orderId:'order_kirei_amara_1', freelancerId:'u_amara', buyerId:'u_kirei', rating:5, body:'Amara turned my mess of sketches into a tech pack the factory accepted on first try. Re-hiring.', ratings:{communication:5,quality:5,expertise:5,delivery:5}, createdAt:t0 },
      { id:'rev_hanako_marco', orderId:'order_hanako_marco_1', freelancerId:'u_marco', buyerId:'u_hanako', rating:5, body:'Brilliant work, fast turnaround.', ratings:{communication:5,quality:5,expertise:5,delivery:5}, createdAt:t0 },
    ];

    // Notifications (for u_yuna mostly)
    const notifications = [
      { id:'n1', userId:'u_yuna',   kind:'order_placed',     title:'New order from Auriga',                  icon:'📦', actionUrl:'/dashboard/orders/order_auriga_yuna_1', actorId:'u_auriga', orderId:'order_auriga_yuna_1', read:false, createdAt:t0 },
      { id:'n2', userId:'u_yuna',   kind:'message_received', title:'Sara replied to your thread',            icon:'💬', actionUrl:'/dashboard/messages',                    actorId:'u_auriga', read:false, createdAt:t0 },
      { id:'n3', userId:'u_yuna',   kind:'payment_released', title:'$840 released to your account',          icon:'💸', actionUrl:'/dashboard/earnings',                    read:false, createdAt:t0 },
      { id:'n4', userId:'u_amara',  kind:'review_received',  title:'Maison Kirei left a 5★ review',          icon:'★',  actionUrl:'/dashboard/orders/order_kirei_amara_1', actorId:'u_kirei',  read:true,  createdAt:t0 },
      { id:'n5', userId:'u_auriga', kind:'order_delivered',  title:'Your order with Marco has been delivered', icon:'📦', actionUrl:'/dashboard/orders/order_hanako_marco_1', read:false, createdAt:t0 },
    ];

    // Payment methods + transactions
    const paymentMethods = [
      { id:'pm_yuna_visa',   userId:'u_yuna',   type:'card', brand:'visa',       last4:'4729', expMonth:'12', expYear:'2027', isDefault:true, createdAt:t0 },
      { id:'pm_auriga_visa', userId:'u_auriga', type:'card', brand:'visa',       last4:'4242', expMonth:'09', expYear:'2027', isDefault:true, createdAt:t0 },
      { id:'pm_kirei_mc',    userId:'u_kirei',  type:'card', brand:'mastercard', last4:'7821', expMonth:'06', expYear:'2028', isDefault:true, createdAt:t0 },
    ];

    const transactions = [
      { id:'tx1', userId:'u_yuna',   orderId:'order_auriga_yuna_1', kind:'release',      amount:{amount:240000,currency:'USD'}, fee:null, description:'Milestone release', status:'pending',   createdAt:t0 },
      { id:'tx2', userId:'u_yuna',   orderId:'order_kirei_amara_1', kind:'release',      amount:{amount:32000, currency:'USD'}, fee:null, description:'Order completed',   status:'completed', createdAt:t0 },
      { id:'tx3', userId:'u_auriga', orderId:'order_auriga_yuna_1', kind:'charge',       amount:{amount:240000,currency:'USD'}, fee:null, description:'Order escrow',      status:'completed', createdAt:t0 },
    ];

    // Subscriptions
    const subscriptions = [
      { id:'sub_yuna',  userId:'u_yuna',  plan:'pro',        monthlyAmount:{amount:2400,currency:'USD'}, status:'active', startedAt:t0, renewsAt:t0, paymentMethodId:'pm_yuna_visa' },
      { id:'sub_kirei', userId:'u_kirei', plan:'studio',     monthlyAmount:{amount:19900,currency:'USD'},status:'active', startedAt:t0, renewsAt:t0, paymentMethodId:'pm_kirei_mc' },
      { id:'sub_auriga',userId:'u_auriga',plan:'enterprise', monthlyAmount:{amount:240000,currency:'USD'},status:'active', startedAt:t0, renewsAt:t0, paymentMethodId:'pm_auriga_visa' },
    ];

    return {
      users, freelancers, services, packages, briefs, applications: [],
      conversations, messages, orders, reviews, notifications,
      paymentMethods, transactions, subscriptions,
      moderation: [], verifications: [], fraudSignals: [], disputes: [],
      _meta: { schemaVersion: 1, seededAt: t0 }
    };
  }

  // -- factories --

  function defaultNotifPrefs() {
    return { emailNewOrder:true, emailNewMessage:true, emailDelivery:true, emailWeeklyDigest:true, emailMarketing:false, pushNewOrder:true, pushNewMessage:true };
  }

  function mkFreelancer(user, o) {
    return {
      id: user.id, userId: user.id, name: user.name, handle: user.handle, avatar: user.avatar,
      cover: user.coverImage || `https://images.unsplash.com/photo-1488161628813-04466f872be2?w=1400&auto=format&fit=crop`,
      headline: o.headline, bio: o.bio,
      serviceSlug: o.service, serviceSlugs: [o.service],
      skills: o.skills || [], tools: o.tools || [], languages: o.languages || ['en'],
      city: o.city, country: o.country, countryCode: o.cc,
      currency: o.currency, fromPrice: o.from,
      rating: o.rating, reviewCount: o.reviewCount, completedOrders: o.completed,
      onTimePercent: o.onTime, completionPercent: o.completion, responseTimeMinutes: o.response,
      isAvailable: true,
      verificationLevel: o.badges.includes('top_1') ? 'top_1' : o.badges.includes('top_rated') ? 'top_rated' : 'verified',
      badges: o.badges,
      portfolioImageIds: [], packageIds: [],
      experience: [], socialLinks: [],
      profileViews30d: Math.round(o.reviewCount * 18),
      followerCount: Math.round(o.reviewCount * 96),
      createdAt: now(), updatedAt: now(),
    };
  }

  function svc(slug, name, group, count, from, img) {
    return {
      slug, name, group, icon: '✦',
      description: `${name} freelancers, verified by industry editors.`,
      heroImage: `https://images.unsplash.com/${img}?w=900&auto=format&fit=crop`,
      relatedSlugs: [], freelancerCount: count, averagePrice: from,
    };
  }

  function pkg(id, freelancerId, serviceSlug, tier, title, description, price, currency, days, revisions, bullets) {
    return {
      id, freelancerId, serviceSlug, tier, title, description,
      priceAmount: price, currency,
      deliveryDays: days, revisions, bullets, addOns: [],
      isActive: true, orderCount: Math.floor(Math.random() * 20),
      createdAt: now(), updatedAt: now(),
    };
  }

  function brf(id, brandId, title, serviceSlug, description, min, max, currency, pricingType, weeks, location, urgent, skills) {
    return {
      id, brandId, title, description, serviceSlug,
      budgetMin: { amount: min * 100, currency }, budgetMax: { amount: max * 100, currency },
      pricingType, durationWeeks: weeks, location, countries: [],
      skillsRequired: skills, attachmentIds: [], isUrgent: urgent,
      status: 'open', applicantCount: Math.floor(Math.random() * 12), applicationIds: [],
      postedAt: now(), closesAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    };
  }

  function mkOrder(id, buyerId, sellerId, packageId, briefId, title, description, status, priceUSD, currency, dueInDays, threadId) {
    const t = now();
    const due = new Date(Date.now() + dueInDays * 86400000).toISOString();
    return {
      id, buyerId, sellerId, packageId, briefId,
      title, description, status,
      timeline: [{ status: 'ordered', at: t, actorId: buyerId }, status !== 'ordered' ? { status, at: t } : null].filter(Boolean),
      amount: { amount: priceUSD * 100, currency },
      tier: packageId ? packageId.split('_').pop() : null,
      attachmentIds: [], deliverableIds: [], revisions: [], revisionsUsed: 0, revisionsAllowed: 2,
      orderedAt: t, dueAt: due,
      deliveredAt: status === 'delivered' || status === 'reviewed' ? t : null,
      reviewedAt: status === 'reviewed' ? t : null,
      hasReview: status === 'reviewed',
      reviewId: status === 'reviewed' ? `rev_${id}` : null,
      threadId,
    };
  }

  // ============================================================
  //  Persistence layer
  // ============================================================
  let _state = null;
  let _subs = [];

  function load() {
    if (!isBrowser) return seed();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && data._meta && data._meta.schemaVersion === 1) return data;
      }
    } catch (e) { /* ignore */ }
    const fresh = seed();
    save(fresh);
    return fresh;
  }

  function save(state) {
    _state = state;
    if (isBrowser) {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn('Store save failed', e); }
    }
    _subs.forEach(fn => { try { fn(state); } catch (e) { console.error(e); } });
  }

  function getState() {
    if (!_state) _state = load();
    return _state;
  }

  function setState(updater) {
    const next = typeof updater === 'function' ? updater(clone(getState())) : updater;
    if (next._meta && next._meta.schemaVersion) save(next);
    else save({ ..._state, ...next, _meta: _state._meta });
    return _state;
  }

  function reset() {
    if (isBrowser) localStorage.removeItem(KEY);
    _state = seed();
    if (isBrowser) localStorage.setItem(KEY, JSON.stringify(_state));
    _subs.forEach(fn => fn(_state));
    return _state;
  }

  function subscribe(fn) {
    _subs.push(fn);
    return () => { _subs = _subs.filter(s => s !== fn); };
  }

  // ============================================================
  //  Session (signed-in user)
  // ============================================================

  // Session memory fallback for non-browser environments (Node tests, SSR)
  let _memSession = null;

  function getSession() {
    if (isBrowser) {
      try {
        const raw = localStorage.getItem(SESSION_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    }
    return _memSession;
  }

  function setSession(session) {
    if (isBrowser) {
      if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      else localStorage.removeItem(SESSION_KEY);
    } else {
      _memSession = session;
    }
    _subs.forEach(fn => fn(getState()));
  }

  function clearSession() { setSession(null); }

  // ============================================================
  //  Public API
  // ============================================================

  return {
    // Helpers
    uid, now, sleep, clone,
    // State
    load, save, getState, setState, reset, subscribe,
    // Session
    getSession, setSession, clearSession,
    // Constants
    KEY, SESSION_KEY,
  };
});
