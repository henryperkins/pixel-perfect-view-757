-- Frozen baseline and approval of the exact candidate; nullable on historical drafts.
ALTER TABLE content_drafts ADD COLUMN base_bundle TEXT;
ALTER TABLE content_drafts ADD COLUMN base_hash TEXT;
ALTER TABLE content_drafts ADD COLUMN review_candidate_hash TEXT;
ALTER TABLE content_drafts ADD COLUMN review_base_hash TEXT;
ALTER TABLE content_drafts ADD COLUMN reviewed_at TEXT;
ALTER TABLE content_drafts ADD COLUMN published_version TEXT;
