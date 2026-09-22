-- Phase 3C: stories and rhymes get a picture of their own (ADR-042, ADR-043).
--
-- Additive. `illustration` joins the media kinds, and a text points at one, so the 27 activities
-- that read a story inherit its picture instead of repeating the id.

alter table public.media_assets drop constraint media_assets_kind_check;
alter table public.media_assets
  add constraint media_assets_kind_check
  check (kind in ('shape', 'object', 'animal', 'illustration'));

alter table public.teaching_texts add column illustration_id text references public.media_assets (id);
comment on column public.teaching_texts.illustration_id is
  'A picture for the story or rhyme itself: a listening child needs somewhere to rest their eyes.';
