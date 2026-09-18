-- ============================================================
-- GENERATED FILE — do not edit.
-- Source: src/data/taxonomy.ts
-- Regenerate: node scripts/gen-taxonomy-sql.mjs
--
-- Seeds the controlled taxonomy (plan §5). Custom values proposed by
-- freelancers are inserted at runtime with status='pending' and only become
-- public filters once an admin approves or merges them.
-- ============================================================

-- ---------- Tech Pack ----------
INSERT INTO service_categories (id, name, position) VALUES ('tech-pack', 'Tech Pack', 0);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('tech-pack--womenswear', 'tech-pack', 'Womenswear', 0);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('tech-pack--menswear', 'tech-pack', 'Menswear', 1);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('tech-pack--kidswear', 'tech-pack', 'Kidswear', 2);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('tech-pack--activewear', 'tech-pack', 'Activewear', 3);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('tech-pack--denim', 'tech-pack', 'Denim', 4);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('tech-pack--knitwear', 'tech-pack', 'Knitwear', 5);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('tech-pack--accessories', 'tech-pack', 'Accessories', 6);
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('tech-pack--skill--flats', 'Flats', 'tech-pack', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('tech-pack--skill--bom', 'BOM', 'tech-pack', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('tech-pack--skill--measurements', 'Measurements', 'tech-pack', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('tech-pack--skill--construction', 'Construction', 'tech-pack', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('tech-pack--skill--grading-notes', 'Grading notes', 'tech-pack', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('tech-pack--skill--fit-commentary', 'Fit commentary', 'tech-pack', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('tech-pack--skill--trim-specification', 'Trim specification', 'tech-pack', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('tech-pack--tool--adobe-illustrator', 'Adobe Illustrator', 'tech-pack', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('tech-pack--tool--clo3d', 'CLO3D', 'tech-pack', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('tech-pack--tool--plm', 'PLM', 'tech-pack', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('tech-pack--tool--excel', 'Excel', 'tech-pack', 'approved', '2026-01-01T00:00:00.000Z');

-- ---------- 3D Virtual Sampling ----------
INSERT INTO service_categories (id, name, position) VALUES ('3d-virtual-sampling', '3D Virtual Sampling', 1);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('3d-virtual-sampling--garment-simulation', '3d-virtual-sampling', 'Garment simulation', 0);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('3d-virtual-sampling--fit-review', '3d-virtual-sampling', 'Fit review', 1);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('3d-virtual-sampling--colourways', '3d-virtual-sampling', 'Colourways', 2);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('3d-virtual-sampling--render-production', '3d-virtual-sampling', 'Render production', 3);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('3d-virtual-sampling--animation', '3d-virtual-sampling', 'Animation', 4);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('3d-virtual-sampling--digital-avatars', '3d-virtual-sampling', 'Digital avatars', 5);
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('3d-virtual-sampling--skill--fabric-simulation', 'Fabric simulation', '3d-virtual-sampling', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('3d-virtual-sampling--skill--rendering', 'Rendering', '3d-virtual-sampling', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('3d-virtual-sampling--skill--fit-analysis', 'Fit analysis', '3d-virtual-sampling', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('3d-virtual-sampling--skill--colourway-production', 'Colourway production', '3d-virtual-sampling', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('3d-virtual-sampling--skill--avatar-setup', 'Avatar setup', '3d-virtual-sampling', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('3d-virtual-sampling--tool--clo3d', 'CLO3D', '3d-virtual-sampling', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('3d-virtual-sampling--tool--browzwear', 'Browzwear', '3d-virtual-sampling', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('3d-virtual-sampling--tool--marvelous-designer', 'Marvelous Designer', '3d-virtual-sampling', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('3d-virtual-sampling--tool--blender', 'Blender', '3d-virtual-sampling', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('3d-virtual-sampling--tool--substance', 'Substance', '3d-virtual-sampling', 'approved', '2026-01-01T00:00:00.000Z');

-- ---------- Graphics & Prints ----------
INSERT INTO service_categories (id, name, position) VALUES ('seamless-pattern', 'Graphics & Prints', 2);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('seamless-pattern--apparel-prints', 'seamless-pattern', 'Apparel prints', 0);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('seamless-pattern--repeat-patterns', 'seamless-pattern', 'Repeat patterns', 1);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('seamless-pattern--textile-prints', 'seamless-pattern', 'Textile prints', 2);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('seamless-pattern--home-textiles', 'seamless-pattern', 'Home textiles', 3);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('seamless-pattern--print-ready-files', 'seamless-pattern', 'Print-ready files', 4);
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('seamless-pattern--skill--repeat-design', 'Repeat design', 'seamless-pattern', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('seamless-pattern--skill--colour-separation', 'Colour separation', 'seamless-pattern', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('seamless-pattern--skill--print-production', 'Print production', 'seamless-pattern', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('seamless-pattern--skill--colourway-development', 'Colourway development', 'seamless-pattern', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('seamless-pattern--tool--adobe-illustrator', 'Adobe Illustrator', 'seamless-pattern', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('seamless-pattern--tool--adobe-photoshop', 'Adobe Photoshop', 'seamless-pattern', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('seamless-pattern--tool--procreate', 'Procreate', 'seamless-pattern', 'approved', '2026-01-01T00:00:00.000Z');

-- ---------- Pattern CAD ----------
INSERT INTO service_categories (id, name, position) VALUES ('pattern-cad', 'Pattern CAD', 3);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('pattern-cad--base-patterns', 'pattern-cad', 'Base patterns', 0);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('pattern-cad--grading', 'pattern-cad', 'Grading', 1);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('pattern-cad--marker-making', 'pattern-cad', 'Marker making', 2);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('pattern-cad--digitising', 'pattern-cad', 'Digitising', 3);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('pattern-cad--fit-corrections', 'pattern-cad', 'Fit corrections', 4);
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('pattern-cad--skill--grading', 'Grading', 'pattern-cad', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('pattern-cad--skill--marker-planning', 'Marker planning', 'pattern-cad', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('pattern-cad--skill--pattern-drafting', 'Pattern drafting', 'pattern-cad', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('pattern-cad--skill--fit-correction', 'Fit correction', 'pattern-cad', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('pattern-cad--skill--dxf-export', 'DXF export', 'pattern-cad', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('pattern-cad--tool--gerber', 'Gerber', 'pattern-cad', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('pattern-cad--tool--lectra', 'Lectra', 'pattern-cad', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('pattern-cad--tool--optitex', 'Optitex', 'pattern-cad', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('pattern-cad--tool--tukatech', 'Tukatech', 'pattern-cad', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('pattern-cad--tool--clo3d', 'Clo3D', 'pattern-cad', 'approved', '2026-01-01T00:00:00.000Z');

-- ---------- Dobby & Jacquard ----------
INSERT INTO service_categories (id, name, position) VALUES ('dobby-jacquard', 'Dobby & Jacquard', 4);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('dobby-jacquard--dobby-structures', 'dobby-jacquard', 'Dobby structures', 0);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('dobby-jacquard--jacquard-artwork', 'dobby-jacquard', 'Jacquard artwork', 1);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('dobby-jacquard--weave-simulation', 'dobby-jacquard', 'Weave simulation', 2);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('dobby-jacquard--loom-ready-files', 'dobby-jacquard', 'Loom-ready files', 3);
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('dobby-jacquard--skill--weave-construction', 'Weave construction', 'dobby-jacquard', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('dobby-jacquard--skill--yarn-planning', 'Yarn planning', 'dobby-jacquard', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('dobby-jacquard--skill--textile-cad', 'Textile CAD', 'dobby-jacquard', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('dobby-jacquard--skill--loom-ready-production-files', 'Loom-ready production files', 'dobby-jacquard', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('dobby-jacquard--tool--nedgraphics', 'NedGraphics', 'dobby-jacquard', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('dobby-jacquard--tool--arahweave', 'ArahWeave', 'dobby-jacquard', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('dobby-jacquard--tool--pointcarre', 'Pointcarre', 'dobby-jacquard', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('dobby-jacquard--tool--eat', 'EAT', 'dobby-jacquard', 'approved', '2026-01-01T00:00:00.000Z');

-- ---------- Web Development ----------
INSERT INTO service_categories (id, name, position) VALUES ('web-development', 'Web Development', 5);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('web-development--web-designer', 'web-development', 'Web Designer', 0);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('web-development--frontend-developer', 'web-development', 'Frontend Developer', 1);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('web-development--backend-developer', 'web-development', 'Backend Developer', 2);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('web-development--full-stack-developer', 'web-development', 'Full-stack Developer', 3);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('web-development--e-commerce-developer', 'web-development', 'E-commerce Developer', 4);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('web-development--shopify-developer', 'web-development', 'Shopify Developer', 5);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('web-development--ui-implementation-specialist', 'web-development', 'UI Implementation Specialist', 6);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('web-development--api-integration-developer', 'web-development', 'API / Integration Developer', 7);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('web-development--mobile-app-developer', 'web-development', 'Mobile App Developer', 8);
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('web-development--tool--git', 'Git', 'web-development', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('web-development--tool--figma', 'Figma', 'web-development', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('web-development--tool--vercel', 'Vercel', 'web-development', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('web-development--tool--cloudflare', 'Cloudflare', 'web-development', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('web-development--tool--docker', 'Docker', 'web-development', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('web-development--tool--webflow', 'Webflow', 'web-development', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('web-development--tool--framer', 'Framer', 'web-development', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('web-development--tool--wordpress', 'WordPress', 'web-development', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('web-development--tool--shopify', 'Shopify', 'web-development', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('web-development--tool--google-workspace', 'Google Workspace', 'web-development', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('lang-javascript', 'web-development', 'languages', 'JavaScript', 'frontend,fullstack,ecommerce,shopify,ui-implementation,integrations,mobile', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('lang-typescript', 'web-development', 'languages', 'TypeScript', NULL, 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-react', 'web-development', 'frameworks', 'React', 'frontend,fullstack,ecommerce,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-nextjs', 'web-development', 'frameworks', 'Next.js', 'frontend,fullstack,ecommerce,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-astro', 'web-development', 'frameworks', 'Astro', 'frontend,fullstack,ecommerce,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-vue', 'web-development', 'frameworks', 'Vue', 'frontend,fullstack,ecommerce,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-angular', 'web-development', 'frameworks', 'Angular', 'frontend,fullstack,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-svelte', 'web-development', 'frameworks', 'Svelte', 'frontend,fullstack,ecommerce,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('sty-tailwind', 'web-development', 'styling', 'Tailwind CSS', 'web-designer,frontend,fullstack,ecommerce,shopify,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('sty-css', 'web-development', 'styling', 'CSS', 'web-designer,frontend,fullstack,ecommerce,shopify,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('sty-sass', 'web-development', 'styling', 'Sass', 'frontend,fullstack,ecommerce,shopify,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-responsive', 'web-development', 'capabilities', 'Responsive design', 'web-designer,frontend,fullstack,ecommerce,shopify,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-accessibility', 'web-development', 'capabilities', 'Accessibility', 'web-designer,frontend,fullstack,ecommerce,shopify,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-performance', 'web-development', 'capabilities', 'Performance optimization', 'web-designer,frontend,fullstack,ecommerce,shopify,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-component-systems', 'web-development', 'capabilities', 'Component systems', 'frontend,fullstack,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('lang-python', 'web-development', 'languages', 'Python', 'backend,fullstack,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('lang-java', 'web-development', 'languages', 'Java', 'backend,fullstack,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('lang-php', 'web-development', 'languages', 'PHP', 'backend,fullstack,ecommerce,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-fastapi', 'web-development', 'frameworks', 'FastAPI', 'backend,fullstack,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-django', 'web-development', 'frameworks', 'Django', 'backend,fullstack,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-node', 'web-development', 'frameworks', 'Node.js', 'backend,fullstack,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-express', 'web-development', 'frameworks', 'Express', 'backend,fullstack,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-nestjs', 'web-development', 'frameworks', 'NestJS', 'backend,fullstack,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-laravel', 'web-development', 'frameworks', 'Laravel', 'backend,fullstack,ecommerce,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('db-postgresql', 'web-development', 'databases', 'PostgreSQL', 'backend,fullstack,ecommerce,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('db-mysql', 'web-development', 'databases', 'MySQL', 'backend,fullstack,ecommerce,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('db-mongodb', 'web-development', 'databases', 'MongoDB', 'backend,fullstack,ecommerce,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-api-development', 'web-development', 'capabilities', 'API development', 'backend,fullstack,integrations,ecommerce,mobile', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-authentication', 'web-development', 'capabilities', 'Authentication', 'backend,fullstack,integrations,mobile', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-payments', 'web-development', 'capabilities', 'Payments', 'backend,fullstack,ecommerce,shopify,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-admin-systems', 'web-development', 'capabilities', 'Admin systems', 'backend,fullstack,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-cloud-deployment', 'web-development', 'capabilities', 'Cloud deployment', 'backend,fullstack,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('lang-swift', 'web-development', 'languages', 'Swift', 'mobile', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('lang-kotlin', 'web-development', 'languages', 'Kotlin', 'mobile', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('lang-dart', 'web-development', 'languages', 'Dart', 'mobile', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-react-native', 'web-development', 'frameworks', 'React Native', 'mobile', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-flutter', 'web-development', 'frameworks', 'Flutter', 'mobile', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-swiftui', 'web-development', 'frameworks', 'SwiftUI', 'mobile', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-jetpack-compose', 'web-development', 'frameworks', 'Jetpack Compose', 'mobile', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-app-store', 'web-development', 'capabilities', 'App Store / Play Store release', 'mobile', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-push-notifications', 'web-development', 'capabilities', 'Push notifications', 'mobile', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-offline-sync', 'web-development', 'capabilities', 'Offline & sync', 'mobile', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-shopify', 'web-development', 'frameworks', 'Shopify', 'web-designer,ecommerce,shopify,fullstack,integrations', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-woocommerce', 'web-development', 'frameworks', 'WooCommerce', 'web-designer,ecommerce,fullstack', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-liquid', 'web-development', 'frameworks', 'Liquid', 'shopify,ecommerce', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-webflow', 'web-development', 'frameworks', 'Webflow', 'web-designer,frontend', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-framer', 'web-development', 'frameworks', 'Framer', 'web-designer,frontend', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('fw-wordpress', 'web-development', 'frameworks', 'WordPress', 'web-designer,frontend,backend,fullstack,ecommerce', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-ui-design', 'web-development', 'capabilities', 'UI design', 'web-designer,frontend,ui-implementation', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-typography', 'web-development', 'capabilities', 'Typography', 'web-designer', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-on-page-seo', 'web-development', 'capabilities', 'On-page SEO', 'web-designer,frontend,fullstack,ecommerce', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-analytics-setup', 'web-development', 'capabilities', 'Analytics setup', 'web-designer,frontend,fullstack,ecommerce', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-domain-dns', 'web-development', 'capabilities', 'Domain & DNS setup', 'web-designer,backend,fullstack', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO technology_stacks (id, service_id, group_key, name, applies_to, status, created_at) VALUES ('cap-business-email', 'web-development', 'capabilities', 'Business email setup', 'web-designer', 'approved', '2026-01-01T00:00:00.000Z');

-- ---------- AI Agent ----------
INSERT INTO service_categories (id, name, position) VALUES ('ai-agent', 'AI Agent', 6);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('ai-agent--customer-support', 'ai-agent', 'Customer support', 0);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('ai-agent--lead-generation', 'ai-agent', 'Lead generation', 1);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('ai-agent--sales-assistance', 'ai-agent', 'Sales assistance', 2);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('ai-agent--knowledge-base-agent', 'ai-agent', 'Knowledge-base agent', 3);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('ai-agent--automation', 'ai-agent', 'Automation', 4);
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('ai-agent--skill--prompt-design', 'Prompt design', 'ai-agent', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('ai-agent--skill--workflow-design', 'Workflow design', 'ai-agent', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('ai-agent--skill--knowledge-bases', 'Knowledge bases', 'ai-agent', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('ai-agent--skill--api-work', 'API work', 'ai-agent', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('ai-agent--skill--evaluation', 'Evaluation', 'ai-agent', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('ai-agent--tool--python', 'Python', 'ai-agent', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('ai-agent--tool--typescript', 'TypeScript', 'ai-agent', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('ai-agent--tool--make', 'Make', 'ai-agent', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('ai-agent--tool--zapier', 'Zapier', 'ai-agent', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('ai-agent--tool--n8n', 'n8n', 'ai-agent', 'approved', '2026-01-01T00:00:00.000Z');

-- ---------- AI Video & Photography ----------
INSERT INTO service_categories (id, name, position) VALUES ('ai-photography', 'AI Video & Photography', 7);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('ai-photography--product-imagery', 'ai-photography', 'Product imagery', 0);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('ai-photography--lifestyle-imagery', 'ai-photography', 'Lifestyle imagery', 1);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('ai-photography--campaigns', 'ai-photography', 'Campaigns', 2);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('ai-photography--short-video', 'ai-photography', 'Short video', 3);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('ai-photography--retouching', 'ai-photography', 'Retouching', 4);
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('ai-photography--skill--art-direction', 'Art direction', 'ai-photography', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('ai-photography--skill--image-generation', 'Image generation', 'ai-photography', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('ai-photography--skill--retouching', 'Retouching', 'ai-photography', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('ai-photography--skill--motion', 'Motion', 'ai-photography', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('ai-photography--skill--product-consistency', 'Product consistency', 'ai-photography', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('ai-photography--tool--adobe-photoshop', 'Adobe Photoshop', 'ai-photography', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('ai-photography--tool--runway', 'Runway', 'ai-photography', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('ai-photography--tool--midjourney', 'Midjourney', 'ai-photography', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('ai-photography--tool--blender', 'Blender', 'ai-photography', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('ai-photography--tool--after-effects', 'After Effects', 'ai-photography', 'approved', '2026-01-01T00:00:00.000Z');

-- ---------- E-Commerce Listing ----------
INSERT INTO service_categories (id, name, position) VALUES ('ecom-listing', 'E-Commerce Listing', 8);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('ecom-listing--shopify', 'ecom-listing', 'Shopify', 0);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('ecom-listing--amazon', 'ecom-listing', 'Amazon', 1);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('ecom-listing--myntra', 'ecom-listing', 'Myntra', 2);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('ecom-listing--flipkart', 'ecom-listing', 'Flipkart', 3);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('ecom-listing--catalog-upload', 'ecom-listing', 'Catalog upload', 4);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('ecom-listing--seo-content', 'ecom-listing', 'SEO content', 5);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('ecom-listing--product-attributes', 'ecom-listing', 'Product attributes', 6);
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('ecom-listing--skill--product-data', 'Product data', 'ecom-listing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('ecom-listing--skill--seo', 'SEO', 'ecom-listing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('ecom-listing--skill--marketplace-requirements', 'Marketplace requirements', 'ecom-listing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('ecom-listing--skill--bulk-upload', 'Bulk upload', 'ecom-listing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('ecom-listing--skill--catalog-operations', 'Catalog operations', 'ecom-listing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('ecom-listing--tool--shopify', 'Shopify', 'ecom-listing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('ecom-listing--tool--amazon-seller-central', 'Amazon Seller Central', 'ecom-listing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('ecom-listing--tool--excel', 'Excel', 'ecom-listing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('ecom-listing--tool--pim', 'PIM', 'ecom-listing', 'approved', '2026-01-01T00:00:00.000Z');

-- ---------- Digital Marketing & SEO ----------
INSERT INTO service_categories (id, name, position) VALUES ('digital-marketing', 'Digital Marketing & SEO', 9);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('digital-marketing--seo', 'digital-marketing', 'SEO', 0);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('digital-marketing--local-seo', 'digital-marketing', 'Local SEO', 1);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('digital-marketing--google-ads', 'digital-marketing', 'Google Ads', 2);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('digital-marketing--meta-ads', 'digital-marketing', 'Meta Ads', 3);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('digital-marketing--social-media', 'digital-marketing', 'Social media', 4);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('digital-marketing--content-marketing', 'digital-marketing', 'Content marketing', 5);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('digital-marketing--email-whatsapp-marketing', 'digital-marketing', 'Email & WhatsApp marketing', 6);
INSERT INTO service_specialties (id, service_id, name, position) VALUES ('digital-marketing--analytics-reporting', 'digital-marketing', 'Analytics & reporting', 7);
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('digital-marketing--skill--keyword-research', 'Keyword research', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('digital-marketing--skill--technical-seo', 'Technical SEO', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('digital-marketing--skill--campaign-setup', 'Campaign setup', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('digital-marketing--skill--audience-targeting', 'Audience targeting', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('digital-marketing--skill--copywriting', 'Copywriting', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('digital-marketing--skill--conversion-tracking', 'Conversion tracking', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO skills (id, name, service_id, status, created_at) VALUES ('digital-marketing--skill--reporting', 'Reporting', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('digital-marketing--tool--google-search-console', 'Google Search Console', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('digital-marketing--tool--google-analytics', 'Google Analytics', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('digital-marketing--tool--google-ads', 'Google Ads', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('digital-marketing--tool--meta-ads-manager', 'Meta Ads Manager', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('digital-marketing--tool--semrush', 'Semrush', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('digital-marketing--tool--ahrefs', 'Ahrefs', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('digital-marketing--tool--mailchimp', 'Mailchimp', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
INSERT INTO tools (id, name, service_id, status, created_at) VALUES ('digital-marketing--tool--canva', 'Canva', 'digital-marketing', 'approved', '2026-01-01T00:00:00.000Z');
