-- Additive frozen plans and a pre-call reservation ledger. Existing app rows remain readable.
ALTER TABLE evaluation_runs ADD COLUMN plan TEXT;
ALTER TABLE evaluation_runs ADD COLUMN qualification_profile TEXT;
ALTER TABLE evaluation_runs ADD COLUMN campaign_id TEXT;
ALTER TABLE evaluation_runs ADD COLUMN attempt_limit INTEGER;
ALTER TABLE evaluation_runs ADD COLUMN dollar_ceiling_micros INTEGER;
ALTER TABLE evaluation_runs ADD COLUMN review_reserve_micros INTEGER;
ALTER TABLE evaluation_runs ADD COLUMN enterprise_thinking TEXT;
ALTER TABLE evaluation_runs ADD COLUMN arm_key TEXT;
ALTER TABLE evaluation_runs ADD COLUMN campaign_attempt_limit INTEGER;
ALTER TABLE evaluation_results ADD COLUMN reserved_micros INTEGER NOT NULL DEFAULT 0;
ALTER TABLE evaluation_results ADD COLUMN attempted INTEGER NOT NULL DEFAULT 0;
