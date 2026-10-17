-- Serving policy is mutable metadata; the published bundle/checksum remain immutable.
ALTER TABLE content_releases ADD COLUMN writer_rollout TEXT;
