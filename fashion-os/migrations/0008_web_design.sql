-- Graphic Design becomes Web Design.
--
-- The owner renamed the service and changed what it sells: a complete website,
-- designed and set up on the client's own domain. The page moved to
-- /pages/services/web-design, and unlike Graphics & Prints the id moves with
-- it, so 'graphic-design' is gone from the directory, projects and hire
-- requests as well.
--
-- 0002 is regenerated from taxonomy.ts and seeds 'web-design' directly on a
-- fresh database. On one that ran the old 0002 this moves the rows across; on
-- a fresh one every statement below matches nothing, so it is safe on both.
--
-- Graphic-design specialties, skills and tools mean nothing for web design.
-- Where the new list has an entry of the same name (Figma, Typography) the
-- choice carries over; the rest is dropped with the old category.
--
-- Enquiries (leads.service) are left alone: they record what the person asked
-- for at the time.

-- 1. The new category and its vocabulary — the same ids 0002 generates.
INSERT OR IGNORE INTO service_categories (id, name, position) VALUES ('web-design', 'Web Design', 9);
INSERT OR IGNORE INTO service_specialties (id, service_id, name, position) VALUES ('web-design--brand-websites', 'web-design', 'Brand websites', 0);
INSERT OR IGNORE INTO service_specialties (id, service_id, name, position) VALUES ('web-design--online-store-design', 'web-design', 'Online store design', 1);
INSERT OR IGNORE INTO service_specialties (id, service_id, name, position) VALUES ('web-design--landing-pages', 'web-design', 'Landing pages', 2);
INSERT OR IGNORE INTO service_specialties (id, service_id, name, position) VALUES ('web-design--website-redesign', 'web-design', 'Website redesign', 3);
INSERT OR IGNORE INTO service_specialties (id, service_id, name, position) VALUES ('web-design--domain-hosting-setup', 'web-design', 'Domain & hosting setup', 4);
INSERT OR IGNORE INTO service_specialties (id, service_id, name, position) VALUES ('web-design--business-email-setup', 'web-design', 'Business email setup', 5);
INSERT OR IGNORE INTO skills (id, name, service_id, status, created_at) VALUES ('web-design--skill--ui-design', 'UI design', 'web-design', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO skills (id, name, service_id, status, created_at) VALUES ('web-design--skill--responsive-layout', 'Responsive layout', 'web-design', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO skills (id, name, service_id, status, created_at) VALUES ('web-design--skill--typography', 'Typography', 'web-design', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO skills (id, name, service_id, status, created_at) VALUES ('web-design--skill--domain-dns-setup', 'Domain & DNS setup', 'web-design', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO skills (id, name, service_id, status, created_at) VALUES ('web-design--skill--on-page-seo', 'On-page SEO', 'web-design', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO skills (id, name, service_id, status, created_at) VALUES ('web-design--skill--analytics-setup', 'Analytics setup', 'web-design', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO tools (id, name, service_id, status, created_at) VALUES ('web-design--tool--figma', 'Figma', 'web-design', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO tools (id, name, service_id, status, created_at) VALUES ('web-design--tool--webflow', 'Webflow', 'web-design', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO tools (id, name, service_id, status, created_at) VALUES ('web-design--tool--framer', 'Framer', 'web-design', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO tools (id, name, service_id, status, created_at) VALUES ('web-design--tool--wordpress', 'WordPress', 'web-design', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO tools (id, name, service_id, status, created_at) VALUES ('web-design--tool--shopify', 'Shopify', 'web-design', 'approved', '2026-01-01T00:00:00.000Z');
INSERT OR IGNORE INTO tools (id, name, service_id, status, created_at) VALUES ('web-design--tool--google-workspace', 'Google Workspace', 'web-design', 'approved', '2026-01-01T00:00:00.000Z');

-- 2. Re-point chosen ids by name, while the old rows still exist to read names from.
UPDATE specialist_service_offerings SET
  specialties = (SELECT json_group_array(n.id) FROM json_each(specialist_service_offerings.specialties) j
                 JOIN service_specialties o ON o.id = j.value
                 JOIN service_specialties n ON n.service_id = 'web-design' AND n.name = o.name),
  skill_ids   = (SELECT json_group_array(n.id) FROM json_each(specialist_service_offerings.skill_ids) j
                 JOIN skills o ON o.id = j.value
                 JOIN skills n ON n.service_id = 'web-design' AND n.name = o.name),
  tool_ids    = (SELECT json_group_array(n.id) FROM json_each(specialist_service_offerings.tool_ids) j
                 JOIN tools o ON o.id = j.value
                 JOIN tools n ON n.service_id = 'web-design' AND n.name = o.name)
WHERE service_id = 'graphic-design'
  AND json_valid(specialties) AND json_valid(skill_ids) AND json_valid(tool_ids);

UPDATE project_requirements SET
  specialties = (SELECT json_group_array(n.id) FROM json_each(project_requirements.specialties) j
                 JOIN service_specialties o ON o.id = j.value
                 JOIN service_specialties n ON n.service_id = 'web-design' AND n.name = o.name),
  skill_ids   = (SELECT json_group_array(n.id) FROM json_each(project_requirements.skill_ids) j
                 JOIN skills o ON o.id = j.value
                 JOIN skills n ON n.service_id = 'web-design' AND n.name = o.name),
  tool_ids    = (SELECT json_group_array(n.id) FROM json_each(project_requirements.tool_ids) j
                 JOIN tools o ON o.id = j.value
                 JOIN tools n ON n.service_id = 'web-design' AND n.name = o.name)
WHERE project_id IN (SELECT id FROM projects WHERE service_id = 'graphic-design')
  AND json_valid(specialties) AND json_valid(skill_ids) AND json_valid(tool_ids);

UPDATE portfolio_items SET specialty_id =
  (SELECT n.id FROM service_specialties o
   JOIN service_specialties n ON n.service_id = 'web-design' AND n.name = o.name
   WHERE o.id = portfolio_items.specialty_id)
WHERE specialty_id IN (SELECT id FROM service_specialties WHERE service_id = 'graphic-design');

UPDATE hire_requests SET specialty_id =
  (SELECT n.id FROM service_specialties o
   JOIN service_specialties n ON n.service_id = 'web-design' AND n.name = o.name
   WHERE o.id = hire_requests.specialty_id)
WHERE specialty_id IN (SELECT id FROM service_specialties WHERE service_id = 'graphic-design');

-- 3. Move every reference to the service itself.
UPDATE specialist_service_offerings SET service_id = 'web-design' WHERE service_id = 'graphic-design';
UPDATE portfolio_items SET service_id = 'web-design' WHERE service_id = 'graphic-design';
UPDATE projects        SET service_id = 'web-design' WHERE service_id = 'graphic-design';
UPDATE hire_requests   SET service_id = 'web-design' WHERE service_id = 'graphic-design';

-- Search text is rebuilt on each profile save; until then keep the service name findable.
UPDATE specialist_search SET
  services = replace(services, 'graphic design', 'web design'),
  haystack = replace(haystack, 'graphic design', 'web design')
WHERE services LIKE '%graphic design%' OR haystack LIKE '%graphic design%';

-- 4. Drop the old category. Specialties, skills, tools and stacks cascade;
--    first release anything elsewhere that was merged into one of them.
UPDATE skills SET merged_into = NULL
WHERE merged_into IN (SELECT id FROM skills WHERE service_id = 'graphic-design')
  AND (service_id IS NULL OR service_id <> 'graphic-design');
UPDATE tools SET merged_into = NULL
WHERE merged_into IN (SELECT id FROM tools WHERE service_id = 'graphic-design')
  AND (service_id IS NULL OR service_id <> 'graphic-design');
DELETE FROM service_categories WHERE id = 'graphic-design';

-- 5. Editor overrides written for the old copy would put it back on the new
--    page and on the homepage card. History keeps them, so any can be restored.
DELETE FROM site_content WHERE page = '/pages/services/graphic-design';
DELETE FROM site_content WHERE page = '/' AND key IN ('services.heading-11', 'services.text-10');
