-- Phase 3B: the pictures a child looks at (ADR-042).
--
-- Additive. The assets themselves are SVG files in the repository under public/media/; these
-- tables mirror the registry so that the database stays a complete picture of the content
-- (ADR-028), and so a future feature can join an activity to what it shows.
--
-- RLS on, no policy, no browser grant, like every other reference table.

create table public.media_assets (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  kind text not null check (kind in ('shape', 'object', 'animal')),
  -- A path under public/media/, never a URL: content must not depend on an outside host.
  file text not null check (file ~ '^[a-z0-9-]+/[a-z0-9-]+\.svg$'),
  -- French, and never empty: it is what assistive technology reads to the family.
  alt text not null check (btrim(alt) <> ''),
  origin text not null check (origin in ('official', 'teka-edu-adaptation', 'teka-edu-created')),
  provenance text not null check (btrim(provenance) <> '')
);
comment on table public.media_assets is
  'Pictures shipped with the release, mirrored from content/media/registry.json (ADR-042).';

create table public.media_asset_tags (
  media_id text not null references public.media_assets (id) on delete cascade,
  position smallint not null check (position > 0),
  tag text not null check (btrim(tag) <> ''),
  primary key (media_id, position)
);
comment on table public.media_asset_tags is
  'The words a lesson uses for a picture, in order; the first is the one a renderer asks for.';

create table public.activity_media (
  activity_id text not null references public.activities (id) on delete cascade,
  position smallint not null check (position > 0),
  media_id text not null references public.media_assets (id),
  primary key (activity_id, position),
  -- One picture is used once per activity: a duplicate is an authoring mistake.
  constraint activity_media_unique unique (activity_id, media_id) deferrable initially immediate
);

create index activity_media_media_id_idx on public.activity_media (media_id);
create index media_asset_tags_media_id_idx on public.media_asset_tags (media_id);

alter table public.media_assets enable row level security;
alter table public.media_asset_tags enable row level security;
alter table public.activity_media enable row level security;

revoke all on table
  public.media_assets,
  public.media_asset_tags,
  public.activity_media
  from anon, authenticated;
