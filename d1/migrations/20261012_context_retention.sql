ALTER TABLE daily_readings ADD COLUMN context_version TEXT;
ALTER TABLE daily_readings ADD COLUMN local_context_ct TEXT;
ALTER TABLE daily_readings ADD COLUMN local_context_sources TEXT;
ALTER TABLE daily_readings ADD COLUMN local_context_expires_at TEXT;
ALTER TABLE daily_readings ADD COLUMN mixed_context_expires_at TEXT;
ALTER TABLE daily_readings ADD COLUMN retention_state TEXT;
