-- September rich-media assets include generated raster illustrations alongside the
-- original SVG assets. They are still repository-local files under public/media/.

alter table public.media_assets drop constraint media_assets_file_check;
alter table public.media_assets
  add constraint media_assets_file_check
  check (file ~ '^[a-z0-9-]+/[a-z0-9-]+\.(svg|webp)$');
