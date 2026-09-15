-- Image strips an editor can grow.
--
-- A site_content row replaces one keyed element, so an editor could swap an
-- image but never add one. The running strip on a service page needs a list:
-- as many images as the owner wants, in the order they want, and the page's
-- own images back with one click.
--
-- The page marks the container with `data-cms-gallery="<name>"`; whatever it
-- holds in the template is the default. A row here is the editor's whole list
-- for that one container and replaces those children when it has any images.
-- No row puts the default back, so a reset is a delete, as with site_content.
-- Changes are recorded in site_content_history under the key `gallery.<name>`
-- with the list as JSON, so the page's history and undo cover them too.

CREATE TABLE site_gallery (
  page        TEXT NOT NULL,            -- '/', '/pages/services/tech-pack', …
  gallery     TEXT NOT NULL,            -- the container's data-cms-gallery name
  items       TEXT NOT NULL,            -- JSON [{src, alt}], in display order
  updated_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
  updated_at  TEXT NOT NULL,
  PRIMARY KEY (page, gallery)
);
