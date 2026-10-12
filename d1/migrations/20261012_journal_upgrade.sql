-- Declarative upgrade: migrate-records inspects each column and applies only missing additions.
-- Apply through scripts/migrate-records.mjs; do not blindly execute this file on production.
ALTER TABLE life_events ADD COLUMN body_ct TEXT;
ALTER TABLE life_events ADD COLUMN cycle_key TEXT;
ALTER TABLE life_events ADD COLUMN feature_key TEXT;
ALTER TABLE life_events ADD COLUMN updated_at TEXT;
ALTER TABLE life_events ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
