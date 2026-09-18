-- Web Design and Website Development become one service: Web Development.
-- Digital Marketing & SEO is added as a new service.
--
-- The owner merged the two web services on 2026-09-18: one page, one service,
-- one id, `web-development`. Both old ids go: `website` (Website Development)
-- and `web-design` (Web Design, itself the former Graphic Design — 0008).
--
-- Website Development's model is kept: its specialties ARE its roles, and its
-- competencies live in the technology stack rather than in skills. Web Design
-- joins as one more role, Web Designer. What a web designer listed as skills
-- (UI design, Typography, Domain & DNS setup, ...) and the setup specialties
-- (Domain & hosting setup, Business email setup) become stack options for
-- that role, so nothing a designer told us is lost.
--
-- 0002 is regenerated from taxonomy.ts and seeds the new ids directly on a
-- fresh database. On one that ran the old seeds this moves every row across;
-- on a fresh one the moves match nothing, so it is safe on both. (0008 still
-- creates `web-design` on a fresh database; the last step removes it again.)
--
-- Enquiries (leads.service) are left alone: they record what the person asked
-- for at the time.

-- 1. The new categories and their vocabulary — the same ids 0002 generates.
INSERT OR IGNORE INTO service_categories (id, name, position) VALUES ('web-development', 'Web Development', 5);
INSERT OR IGNORE INTO service_categories (id, name, position) VALUES ('digital-marketing', 'Digital Marketing & SEO', 9);
INSERT OR IGNORE INTO service_specialties (id, service_id, name, position) VALUES ('web-development--web-designer', 'web-development', 'Web Designer', 0);
INSERT OR IGNORE INTO service_specialties (id, service_id, name, position) VALUES ('web-development--frontend-developer', 'web-development', 'Frontend Developer', 1);
INSERT OR IGNORE INTO service_specialties (id, service_id, name, position) VALUES ('web-development--backend-developer', 'web-development', 'Backend Developer', 2);
INSERT OR IGNORE INTO service_specialties (id, service_id, name, position) VALUES ('web-development--full-stack-developer', 'web-development', 'Full-stack Developer', 3);
INSERT OR IGNORE INTO service_specialties (id, service_id, name, position) VALUES ('web-development--e-commerce-developer', 'web-development', 'E-commerce Developer', 4);
INSERT OR IGNORE INTO service_specialties (id, service_id, name, position) VALUES ('web-development--shopify-developer', 'web-development', 'Shopify Developer', 5);
INSERT OR IGNORE INTO service_specialties (id, service_id, name, position) VALUES ('web-development--ui-implementation-specialist', 'web-development', 'UI Implementation Specialist', 6);
INSERT OR IGNORE INTO service_specialties (id, service_id, name, position) VALUES ('web-development--api-integration-developer', 'web-development', 'API / Integration Developer', 7);
INSERT OR IGNORE INTO service_specialties (id, service_id, name, position) VALUES ('web-development--mobile-app-developer', 'web-development', 'Mobile App Developer', 8);
INSERT OR IGNORE INTO tools (id, name, service_id, status, created_at) VALUES ('web-development--tool--git', 'Git', 'web-development', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO tools (id, name, service_id, status, created_at) VALUES ('web-development--tool--figma', 'Figma', 'web-development', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO tools (id, name, service_id, status, created_at) VALUES ('web-development--tool--vercel', 'Vercel', 'web-development', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO tools (id, name, service_id, status, created_at) VALUES ('web-development--tool--cloudflare', 'Cloudflare', 'web-development', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO tools (id, name, service_id, status, created_at) VALUES ('web-development--tool--docker', 'Docker', 'web-development', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO tools (id, name, service_id, status, created_at) VALUES ('web-development--tool--webflow', 'Webflow', 'web-development', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO tools (id, name, service_id, status, created_at) VALUES ('web-development--tool--framer', 'Framer', 'web-development', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO tools (id, name, service_id, status, created_at) VALUES ('web-development--tool--wordpress', 'WordPress', 'web-development', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO tools (id, name, service_id, status, created_at) VALUES ('web-development--tool--shopify', 'Shopify', 'web-development', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO tools (id, name, service_id, status, created_at) VALUES ('web-development--tool--google-workspace', 'Google Workspace', 'web-development', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO service_specialties (id, service_id, name, position) VALUES ('digital-marketing--seo', 'digital-marketing', 'SEO', 0);
INSERT OR IGNORE INTO service_specialties (id, service_id, name, position) VALUES ('digital-marketing--local-seo', 'digital-marketing', 'Local SEO', 1);
INSERT OR IGNORE INTO service_specialties (id, service_id, name, position) VALUES ('digital-marketing--google-ads', 'digital-marketing', 'Google Ads', 2);
INSERT OR IGNORE INTO service_specialties (id, service_id, name, position) VALUES ('digital-marketing--meta-ads', 'digital-marketing', 'Meta Ads', 3);
INSERT OR IGNORE INTO service_specialties (id, service_id, name, position) VALUES ('digital-marketing--social-media', 'digital-marketing', 'Social media', 4);
INSERT OR IGNORE INTO service_specialties (id, service_id, name, position) VALUES ('digital-marketing--content-marketing', 'digital-marketing', 'Content marketing', 5);
INSERT OR IGNORE INTO service_specialties (id, service_id, name, position) VALUES ('digital-marketing--email-whatsapp-marketing', 'digital-marketing', 'Email & WhatsApp marketing', 6);
INSERT OR IGNORE INTO service_specialties (id, service_id, name, position) VALUES ('digital-marketing--analytics-reporting', 'digital-marketing', 'Analytics & reporting', 7);
INSERT OR IGNORE INTO skills (id, name, service_id, status, created_at) VALUES ('digital-marketing--skill--keyword-research', 'Keyword research', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO skills (id, name, service_id, status, created_at) VALUES ('digital-marketing--skill--technical-seo', 'Technical SEO', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO skills (id, name, service_id, status, created_at) VALUES ('digital-marketing--skill--campaign-setup', 'Campaign setup', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO skills (id, name, service_id, status, created_at) VALUES ('digital-marketing--skill--audience-targeting', 'Audience targeting', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO skills (id, name, service_id, status, created_at) VALUES ('digital-marketing--skill--copywriting', 'Copywriting', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO skills (id, name, service_id, status, created_at) VALUES ('digital-marketing--skill--conversion-tracking', 'Conversion tracking', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO skills (id, name, service_id, status, created_at) VALUES ('digital-marketing--skill--reporting', 'Reporting', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO tools (id, name, service_id, status, created_at) VALUES ('digital-marketing--tool--google-search-console', 'Google Search Console', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO tools (id, name, service_id, status, created_at) VALUES ('digital-marketing--tool--google-analytics', 'Google Analytics', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO tools (id, name, service_id, status, created_at) VALUES ('digital-marketing--tool--google-ads', 'Google Ads', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO tools (id, name, service_id, status, created_at) VALUES ('digital-marketing--tool--meta-ads-manager', 'Meta Ads Manager', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO tools (id, name, service_id, status, created_at) VALUES ('digital-marketing--tool--semrush', 'Semrush', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO tools (id, name, service_id, status, created_at) VALUES ('digital-marketing--tool--ahrefs', 'Ahrefs', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO tools (id, name, service_id, status, created_at) VALUES ('digital-marketing--tool--mailchimp', 'Mailchimp', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO tools (id, name, service_id, status, created_at) VALUES ('digital-marketing--tool--canva', 'Canva', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('lang-javascript', 'web-development', 'languages', 'JavaScript', 'frontend,fullstack,ecommerce,shopify,ui-implementation,integrations,mobile', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('lang-typescript', 'web-development', 'languages', 'TypeScript', NULL, 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-react', 'web-development', 'frameworks', 'React', 'frontend,fullstack,ecommerce,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-nextjs', 'web-development', 'frameworks', 'Next.js', 'frontend,fullstack,ecommerce,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-astro', 'web-development', 'frameworks', 'Astro', 'frontend,fullstack,ecommerce,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-vue', 'web-development', 'frameworks', 'Vue', 'frontend,fullstack,ecommerce,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-angular', 'web-development', 'frameworks', 'Angular', 'frontend,fullstack,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-svelte', 'web-development', 'frameworks', 'Svelte', 'frontend,fullstack,ecommerce,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('sty-tailwind', 'web-development', 'styling', 'Tailwind CSS', 'web-designer,frontend,fullstack,ecommerce,shopify,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('sty-css', 'web-development', 'styling', 'CSS', 'web-designer,frontend,fullstack,ecommerce,shopify,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('sty-sass', 'web-development', 'styling', 'Sass', 'frontend,fullstack,ecommerce,shopify,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-responsive', 'web-development', 'capabilities', 'Responsive design', 'web-designer,frontend,fullstack,ecommerce,shopify,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-accessibility', 'web-development', 'capabilities', 'Accessibility', 'web-designer,frontend,fullstack,ecommerce,shopify,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-performance', 'web-development', 'capabilities', 'Performance optimization', 'web-designer,frontend,fullstack,ecommerce,shopify,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-component-systems', 'web-development', 'capabilities', 'Component systems', 'frontend,fullstack,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('lang-python', 'web-development', 'languages', 'Python', 'backend,fullstack,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('lang-java', 'web-development', 'languages', 'Java', 'backend,fullstack,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('lang-php', 'web-development', 'languages', 'PHP', 'backend,fullstack,ecommerce,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-fastapi', 'web-development', 'frameworks', 'FastAPI', 'backend,fullstack,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-django', 'web-development', 'frameworks', 'Django', 'backend,fullstack,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-node', 'web-development', 'frameworks', 'Node.js', 'backend,fullstack,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-express', 'web-development', 'frameworks', 'Express', 'backend,fullstack,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-nestjs', 'web-development', 'frameworks', 'NestJS', 'backend,fullstack,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-laravel', 'web-development', 'frameworks', 'Laravel', 'backend,fullstack,ecommerce,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('db-postgresql', 'web-development', 'databases', 'PostgreSQL', 'backend,fullstack,ecommerce,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('db-mysql', 'web-development', 'databases', 'MySQL', 'backend,fullstack,ecommerce,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('db-mongodb', 'web-development', 'databases', 'MongoDB', 'backend,fullstack,ecommerce,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-api-development', 'web-development', 'capabilities', 'API development', 'backend,fullstack,integrations,ecommerce,mobile', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-authentication', 'web-development', 'capabilities', 'Authentication', 'backend,fullstack,integrations,mobile', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-payments', 'web-development', 'capabilities', 'Payments', 'backend,fullstack,ecommerce,shopify,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-admin-systems', 'web-development', 'capabilities', 'Admin systems', 'backend,fullstack,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-cloud-deployment', 'web-development', 'capabilities', 'Cloud deployment', 'backend,fullstack,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('lang-swift', 'web-development', 'languages', 'Swift', 'mobile', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('lang-kotlin', 'web-development', 'languages', 'Kotlin', 'mobile', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('lang-dart', 'web-development', 'languages', 'Dart', 'mobile', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-react-native', 'web-development', 'frameworks', 'React Native', 'mobile', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-flutter', 'web-development', 'frameworks', 'Flutter', 'mobile', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-swiftui', 'web-development', 'frameworks', 'SwiftUI', 'mobile', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-jetpack-compose', 'web-development', 'frameworks', 'Jetpack Compose', 'mobile', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-app-store', 'web-development', 'capabilities', 'App Store / Play Store release', 'mobile', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-push-notifications', 'web-development', 'capabilities', 'Push notifications', 'mobile', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-offline-sync', 'web-development', 'capabilities', 'Offline & sync', 'mobile', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-shopify', 'web-development', 'frameworks', 'Shopify', 'web-designer,ecommerce,shopify,fullstack,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-woocommerce', 'web-development', 'frameworks', 'WooCommerce', 'web-designer,ecommerce,fullstack', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-liquid', 'web-development', 'frameworks', 'Liquid', 'shopify,ecommerce', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-webflow', 'web-development', 'frameworks', 'Webflow', 'web-designer,frontend', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-framer', 'web-development', 'frameworks', 'Framer', 'web-designer,frontend', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-wordpress', 'web-development', 'frameworks', 'WordPress', 'web-designer,frontend,backend,fullstack,ecommerce', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-ui-design', 'web-development', 'capabilities', 'UI design', 'web-designer,frontend,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-typography', 'web-development', 'capabilities', 'Typography', 'web-designer', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-on-page-seo', 'web-development', 'capabilities', 'On-page SEO', 'web-designer,frontend,fullstack,ecommerce', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-analytics-setup', 'web-development', 'capabilities', 'Analytics setup', 'web-designer,frontend,fullstack,ecommerce', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-domain-dns', 'web-development', 'capabilities', 'Domain & DNS setup', 'web-designer,backend,fullstack', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-business-email', 'web-development', 'capabilities', 'Business email setup', 'web-designer', 'approved', '2026-01-01T00:00:00.000Z');

-- Positions follow the new order: Web Development first of the digital
-- services, Digital Marketing & SEO last.
UPDATE service_categories SET position = 0 WHERE id = 'tech-pack';
UPDATE service_categories SET position = 1 WHERE id = '3d-virtual-sampling';
UPDATE service_categories SET position = 2 WHERE id = 'seamless-pattern';
UPDATE service_categories SET position = 3 WHERE id = 'pattern-cad';
UPDATE service_categories SET position = 4 WHERE id = 'dobby-jacquard';
UPDATE service_categories SET position = 5 WHERE id = 'web-development';
UPDATE service_categories SET position = 6 WHERE id = 'ai-agent';
UPDATE service_categories SET position = 7 WHERE id = 'ai-photography';
UPDATE service_categories SET position = 8 WHERE id = 'ecom-listing';
UPDATE service_categories SET position = 9 WHERE id = 'digital-marketing';

-- 2. The technology stack keeps its ids — they are not service-prefixed — so
--    every stack_ids list stays valid. Only the owner and the roles move.
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'frontend,fullstack,ecommerce,shopify,ui-implementation,integrations,mobile' WHERE id = 'lang-javascript';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = NULL WHERE id = 'lang-typescript';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'frontend,fullstack,ecommerce,ui-implementation' WHERE id = 'fw-react';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'frontend,fullstack,ecommerce,ui-implementation' WHERE id = 'fw-nextjs';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'frontend,fullstack,ecommerce,ui-implementation' WHERE id = 'fw-astro';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'frontend,fullstack,ecommerce,ui-implementation' WHERE id = 'fw-vue';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'frontend,fullstack,ui-implementation' WHERE id = 'fw-angular';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'frontend,fullstack,ecommerce,ui-implementation' WHERE id = 'fw-svelte';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'web-designer,frontend,fullstack,ecommerce,shopify,ui-implementation' WHERE id = 'sty-tailwind';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'web-designer,frontend,fullstack,ecommerce,shopify,ui-implementation' WHERE id = 'sty-css';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'frontend,fullstack,ecommerce,shopify,ui-implementation' WHERE id = 'sty-sass';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'web-designer,frontend,fullstack,ecommerce,shopify,ui-implementation' WHERE id = 'cap-responsive';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'web-designer,frontend,fullstack,ecommerce,shopify,ui-implementation' WHERE id = 'cap-accessibility';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'web-designer,frontend,fullstack,ecommerce,shopify,ui-implementation' WHERE id = 'cap-performance';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'frontend,fullstack,ui-implementation' WHERE id = 'cap-component-systems';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'backend,fullstack,integrations' WHERE id = 'lang-python';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'backend,fullstack,integrations' WHERE id = 'lang-java';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'backend,fullstack,ecommerce,integrations' WHERE id = 'lang-php';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'backend,fullstack,integrations' WHERE id = 'fw-fastapi';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'backend,fullstack,integrations' WHERE id = 'fw-django';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'backend,fullstack,integrations' WHERE id = 'fw-node';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'backend,fullstack,integrations' WHERE id = 'fw-express';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'backend,fullstack,integrations' WHERE id = 'fw-nestjs';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'backend,fullstack,ecommerce,integrations' WHERE id = 'fw-laravel';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'backend,fullstack,ecommerce,integrations' WHERE id = 'db-postgresql';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'backend,fullstack,ecommerce,integrations' WHERE id = 'db-mysql';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'backend,fullstack,ecommerce,integrations' WHERE id = 'db-mongodb';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'backend,fullstack,integrations,ecommerce,mobile' WHERE id = 'cap-api-development';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'backend,fullstack,integrations,mobile' WHERE id = 'cap-authentication';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'backend,fullstack,ecommerce,shopify,integrations' WHERE id = 'cap-payments';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'backend,fullstack,integrations' WHERE id = 'cap-admin-systems';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'backend,fullstack,integrations' WHERE id = 'cap-cloud-deployment';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'mobile' WHERE id = 'lang-swift';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'mobile' WHERE id = 'lang-kotlin';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'mobile' WHERE id = 'lang-dart';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'mobile' WHERE id = 'fw-react-native';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'mobile' WHERE id = 'fw-flutter';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'mobile' WHERE id = 'fw-swiftui';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'mobile' WHERE id = 'fw-jetpack-compose';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'mobile' WHERE id = 'cap-app-store';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'mobile' WHERE id = 'cap-push-notifications';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'mobile' WHERE id = 'cap-offline-sync';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'web-designer,ecommerce,shopify,fullstack,integrations' WHERE id = 'fw-shopify';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'web-designer,ecommerce,fullstack' WHERE id = 'fw-woocommerce';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'shopify,ecommerce' WHERE id = 'fw-liquid';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'web-designer,frontend' WHERE id = 'fw-webflow';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'web-designer,frontend' WHERE id = 'fw-framer';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'web-designer,frontend,backend,fullstack,ecommerce' WHERE id = 'fw-wordpress';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'web-designer,frontend,ui-implementation' WHERE id = 'cap-ui-design';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'web-designer' WHERE id = 'cap-typography';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'web-designer,frontend,fullstack,ecommerce' WHERE id = 'cap-on-page-seo';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'web-designer,frontend,fullstack,ecommerce' WHERE id = 'cap-analytics-setup';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'web-designer,backend,fullstack' WHERE id = 'cap-domain-dns';
UPDATE technology_stacks SET service_id = 'web-development', applies_to = 'web-designer' WHERE id = 'cap-business-email';

-- What a web designer listed (skills and setup specialties), by name, and
-- the Web Designer stack option it became. A scratch table rather than a
-- UNION: D1 caps the number of terms in one compound SELECT. Dropped at the end.
CREATE TABLE _web_design_stack_map (name TEXT PRIMARY KEY, stack_id TEXT NOT NULL);
INSERT INTO _web_design_stack_map (name, stack_id) VALUES ('UI design', 'cap-ui-design');
INSERT INTO _web_design_stack_map (name, stack_id) VALUES ('Responsive layout', 'cap-responsive');
INSERT INTO _web_design_stack_map (name, stack_id) VALUES ('Typography', 'cap-typography');
INSERT INTO _web_design_stack_map (name, stack_id) VALUES ('Domain & DNS setup', 'cap-domain-dns');
INSERT INTO _web_design_stack_map (name, stack_id) VALUES ('On-page SEO', 'cap-on-page-seo');
INSERT INTO _web_design_stack_map (name, stack_id) VALUES ('Analytics setup', 'cap-analytics-setup');
INSERT INTO _web_design_stack_map (name, stack_id) VALUES ('Domain & hosting setup', 'cap-domain-dns');
INSERT INTO _web_design_stack_map (name, stack_id) VALUES ('Business email setup', 'cap-business-email');

-- 3. Website Development offerings move in place, remapping the service-
--    prefixed specialty and tool ids by name while the old rows still exist.
UPDATE specialist_service_offerings SET
  specialties = (SELECT json_group_array(n.id) FROM json_each(specialist_service_offerings.specialties) j
                 JOIN service_specialties o ON o.id = j.value
                 JOIN service_specialties n ON n.service_id = 'web-development' AND n.name = o.name),
  tool_ids    = (SELECT json_group_array(n.id) FROM json_each(specialist_service_offerings.tool_ids) j
                 JOIN tools o ON o.id = j.value
                 JOIN tools n ON n.service_id = 'web-development' AND n.name = o.name),
  service_id  = 'web-development'
WHERE service_id = 'website'
  AND json_valid(specialties) AND json_valid(tool_ids);

-- 4. A specialist who offered both keeps one offering. The designer side is
--    folded into it: its tools and its skills-as-stack join the developer's.
UPDATE specialist_service_offerings SET
  tool_ids = (SELECT json_group_array(DISTINCT id) FROM (
                SELECT j.value AS id FROM json_each(specialist_service_offerings.tool_ids) j
                UNION ALL
                SELECT n.id FROM specialist_service_offerings d, json_each(d.tool_ids) j
                JOIN tools o ON o.id = j.value
                JOIN tools n ON n.service_id = 'web-development' AND n.name = o.name
                WHERE d.profile_id = specialist_service_offerings.profile_id AND d.service_id = 'web-design')),
  stack_ids = (SELECT json_group_array(DISTINCT id) FROM (
                SELECT j.value AS id FROM json_each(specialist_service_offerings.stack_ids) j
                UNION ALL
                SELECT m.stack_id FROM specialist_service_offerings d, json_each(d.skill_ids) j
                JOIN skills o ON o.id = j.value
                JOIN _web_design_stack_map m ON m.name = o.name
                WHERE d.profile_id = specialist_service_offerings.profile_id AND d.service_id = 'web-design'
                UNION ALL
                SELECT m.stack_id FROM specialist_service_offerings d, json_each(d.specialties) j
                JOIN service_specialties o ON o.id = j.value
                JOIN _web_design_stack_map m ON m.name = o.name
                WHERE d.profile_id = specialist_service_offerings.profile_id AND d.service_id = 'web-design')),
  is_primary = MAX(is_primary, (SELECT MAX(d.is_primary) FROM specialist_service_offerings d
                                WHERE d.profile_id = specialist_service_offerings.profile_id AND d.service_id = 'web-design'))
WHERE service_id = 'web-development'
  AND profile_id IN (SELECT profile_id FROM specialist_service_offerings WHERE service_id = 'web-design')
  AND json_valid(tool_ids) AND json_valid(stack_ids);
DELETE FROM specialist_service_offerings
WHERE service_id = 'web-design'
  AND profile_id IN (SELECT profile_id FROM specialist_service_offerings WHERE service_id = 'web-development');

-- 5. Every other Web Design offering becomes a Web Designer offering.
UPDATE specialist_service_offerings SET
  stack_ids   = (SELECT json_group_array(DISTINCT stack_id) FROM (
                  SELECT m.stack_id FROM json_each(specialist_service_offerings.skill_ids) j
                  JOIN skills o ON o.id = j.value
                  JOIN _web_design_stack_map m ON m.name = o.name
                  UNION ALL
                  SELECT m.stack_id FROM json_each(specialist_service_offerings.specialties) j
                  JOIN service_specialties o ON o.id = j.value
                  JOIN _web_design_stack_map m ON m.name = o.name)),
  tool_ids    = (SELECT json_group_array(n.id) FROM json_each(specialist_service_offerings.tool_ids) j
                 JOIN tools o ON o.id = j.value
                 JOIN tools n ON n.service_id = 'web-development' AND n.name = o.name),
  specialties = '["web-development--web-designer"]',
  skill_ids   = '[]',
  role_key    = 'web-designer',
  service_id  = 'web-development'
WHERE service_id = 'web-design'
  AND json_valid(specialties) AND json_valid(skill_ids) AND json_valid(tool_ids);

-- 6. Projects: requirements first, while the project still says which service it was.
UPDATE project_requirements SET
  specialties = (SELECT json_group_array(n.id) FROM json_each(project_requirements.specialties) j
                 JOIN service_specialties o ON o.id = j.value
                 JOIN service_specialties n ON n.service_id = 'web-development' AND n.name = o.name),
  tool_ids    = (SELECT json_group_array(n.id) FROM json_each(project_requirements.tool_ids) j
                 JOIN tools o ON o.id = j.value
                 JOIN tools n ON n.service_id = 'web-development' AND n.name = o.name)
WHERE project_id IN (SELECT id FROM projects WHERE service_id = 'website')
  AND json_valid(specialties) AND json_valid(tool_ids);
UPDATE project_requirements SET
  stack_ids   = (SELECT json_group_array(DISTINCT stack_id) FROM (
                  SELECT j.value AS stack_id FROM json_each(project_requirements.stack_ids) j
                  UNION ALL
                  SELECT m.stack_id FROM json_each(project_requirements.skill_ids) j
                  JOIN skills o ON o.id = j.value
                  JOIN _web_design_stack_map m ON m.name = o.name
                  UNION ALL
                  SELECT m.stack_id FROM json_each(project_requirements.specialties) j
                  JOIN service_specialties o ON o.id = j.value
                  JOIN _web_design_stack_map m ON m.name = o.name)),
  tool_ids    = (SELECT json_group_array(n.id) FROM json_each(project_requirements.tool_ids) j
                 JOIN tools o ON o.id = j.value
                 JOIN tools n ON n.service_id = 'web-development' AND n.name = o.name),
  specialties = '["web-development--web-designer"]',
  skill_ids   = '[]'
WHERE project_id IN (SELECT id FROM projects WHERE service_id = 'web-design')
  AND json_valid(specialties) AND json_valid(skill_ids) AND json_valid(tool_ids) AND json_valid(stack_ids);

-- 7. Single specialty references: remap by name for Website Development, and
--    to Web Designer for Web Design.
UPDATE portfolio_items SET specialty_id =
  (SELECT n.id FROM service_specialties o
   JOIN service_specialties n ON n.service_id = 'web-development' AND n.name = o.name
   WHERE o.id = portfolio_items.specialty_id)
WHERE specialty_id IN (SELECT id FROM service_specialties WHERE service_id = 'website');
UPDATE portfolio_items SET specialty_id = 'web-development--web-designer'
WHERE specialty_id IN (SELECT id FROM service_specialties WHERE service_id = 'web-design');
UPDATE hire_requests SET specialty_id =
  (SELECT n.id FROM service_specialties o
   JOIN service_specialties n ON n.service_id = 'web-development' AND n.name = o.name
   WHERE o.id = hire_requests.specialty_id)
WHERE specialty_id IN (SELECT id FROM service_specialties WHERE service_id = 'website');
UPDATE hire_requests SET specialty_id = 'web-development--web-designer'
WHERE specialty_id IN (SELECT id FROM service_specialties WHERE service_id = 'web-design');

-- 8. Move every remaining reference to the services themselves.
UPDATE portfolio_items SET service_id = 'web-development' WHERE service_id IN ('website', 'web-design');
UPDATE projects        SET service_id = 'web-development' WHERE service_id IN ('website', 'web-design');
UPDATE hire_requests   SET service_id = 'web-development' WHERE service_id IN ('website', 'web-design');

-- Search text is rebuilt on each profile save; until then keep the service findable.
UPDATE specialist_search SET
  services = replace(replace(services, 'website development', 'web development'), 'web design', 'web development'),
  haystack = replace(replace(haystack, 'website development', 'web development'), 'web design', 'web development')
WHERE services LIKE '%website development%' OR services LIKE '%web design%'
   OR haystack LIKE '%website development%' OR haystack LIKE '%web design%';

-- 9. Drop the old categories. Specialties, skills and tools cascade (the stack
--    moved above); first release anything elsewhere that was merged into them.
UPDATE skills SET merged_into = NULL
WHERE merged_into IN (SELECT id FROM skills WHERE service_id IN ('website', 'web-design'))
  AND (service_id IS NULL OR service_id NOT IN ('website', 'web-design'));
UPDATE tools SET merged_into = NULL
WHERE merged_into IN (SELECT id FROM tools WHERE service_id IN ('website', 'web-design'))
  AND (service_id IS NULL OR service_id NOT IN ('website', 'web-design'));
DELETE FROM service_categories WHERE id IN ('website', 'web-design');

-- 10. Editor overrides written for the old pages would put their copy back on
--     the merged page and on the two homepage cards that changed meaning.
--     History keeps them, so any can be restored.
DELETE FROM site_content WHERE page IN ('/pages/services/website', '/pages/services/web-design');
DELETE FROM site_gallery WHERE page IN ('/pages/services/website', '/pages/services/web-design');
DELETE FROM site_content WHERE page = '/' AND key IN ('services.heading-7', 'services.text-6', 'services.heading-11', 'services.text-10');

DROP TABLE _web_design_stack_map;
