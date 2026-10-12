-- Label new canonical checksums; historical values keep their original unlabelled semantics.
ALTER TABLE content_releases ADD COLUMN checksum_algorithm TEXT;
ALTER TABLE content_releases ADD COLUMN stage_receipt TEXT;
ALTER TABLE content_releases ADD COLUMN activation_audit TEXT;
ALTER TABLE content_releases ADD COLUMN publication_state TEXT;
