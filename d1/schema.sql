-- Pattern records — Cloudflare D1 (SQLite) schema.
--
-- This replaces the hosted Postgres backend. Two things move into application
-- code because SQLite has no equivalent:
--   * row ownership (was RLS)  -> every query is scoped by user_id in the
--     server-side data layer, which only ever runs behind a verified session.
--   * updated_at triggers      -> written explicitly on each update.
-- JSON columns are TEXT holding a JSON document.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  last_seen_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,           -- sha256 of the cookie token, never the token
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);

CREATE TABLE IF NOT EXISTS user_roles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT,
  tone_pref TEXT NOT NULL DEFAULT 'plain',
  depth_pref TEXT NOT NULL DEFAULT 'standard',
  domain_pref TEXT,
  wrapped_dek TEXT,
  onboarded_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS source_consents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL,
  tier INTEGER NOT NULL DEFAULT 1,
  granted INTEGER NOT NULL DEFAULT 0,
  granted_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, source_id)
);

CREATE TABLE IF NOT EXISTS birth_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  payload_ct TEXT NOT NULL,
  time_accuracy TEXT NOT NULL DEFAULT 'exact',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  fingerprint TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chart_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  birth_profile_id TEXT NOT NULL REFERENCES birth_profiles(id) ON DELETE CASCADE,
  fingerprint TEXT NOT NULL,
  engine TEXT NOT NULL,
  contract_version TEXT NOT NULL,
  positions TEXT NOT NULL DEFAULT '{}',
  houses TEXT NOT NULL DEFAULT '{}',
  aspects TEXT NOT NULL DEFAULT '[]',
  uncertainty TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, fingerprint)
);

CREATE TABLE IF NOT EXISTS natal_features (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_id TEXT NOT NULL REFERENCES chart_snapshots(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  family TEXT NOT NULL,
  title TEXT NOT NULL,
  strength REAL NOT NULL DEFAULT 0,
  payload TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS natal_features_snapshot_idx ON natal_features (snapshot_id);

CREATE TABLE IF NOT EXISTS cycle_instances (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_id TEXT NOT NULL REFERENCES chart_snapshots(id) ON DELETE CASCADE,
  cycle_key TEXT NOT NULL,
  transit_body TEXT NOT NULL,
  natal_point TEXT NOT NULL,
  aspect TEXT NOT NULL,
  domain TEXT NOT NULL DEFAULT 'general',
  phase TEXT NOT NULL DEFAULT 'active',
  orb REAL NOT NULL DEFAULT 0,
  importance REAL NOT NULL DEFAULT 0,
  ingress_at TEXT,
  exact_at TEXT,
  egress_at TEXT,
  computed_for TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, cycle_key, computed_for)
);
CREATE INDEX IF NOT EXISTS cycle_instances_day_idx ON cycle_instances (user_id, computed_for);

CREATE TABLE IF NOT EXISTS context_signals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '{}',
  confidence REAL NOT NULL DEFAULT 0.5,
  captured_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS context_signals_user_idx ON context_signals (user_id, source_id);

CREATE TABLE IF NOT EXISTS content_releases (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL UNIQUE,
  checksum TEXT NOT NULL,
  checksum_algorithm TEXT,
  stage_receipt TEXT,
  activation_audit TEXT,
  publication_state TEXT,
  writer_rollout TEXT,
  bundle TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_readings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading_date TEXT NOT NULL,
  snapshot_id TEXT,
  release_version TEXT,
  headline TEXT NOT NULL,
  body_ct TEXT NOT NULL,
  prompt TEXT,
  confidence TEXT NOT NULL DEFAULT 'medium',
  primary_cycle_key TEXT,
  language_mode TEXT NOT NULL DEFAULT 'template',
  language_model TEXT,
  language_meta TEXT NOT NULL DEFAULT '{}',
  context_version TEXT,
  local_context_ct TEXT,
  local_context_sources TEXT,
  local_context_expires_at TEXT,
  mixed_context_expires_at TEXT,
  retention_state TEXT,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS daily_readings_user_date_idx ON daily_readings (user_id, reading_date DESC);

CREATE TABLE IF NOT EXISTS reading_sources (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading_id TEXT NOT NULL REFERENCES daily_readings(id) ON DELETE CASCADE,
  lane TEXT NOT NULL,
  source_id TEXT NOT NULL,
  label TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS reading_sources_reading_idx ON reading_sources (reading_id);

CREATE TABLE IF NOT EXISTS reading_feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reading_id TEXT NOT NULL REFERENCES daily_readings(id) ON DELETE CASCADE,
  resonance INTEGER NOT NULL,
  labels TEXT NOT NULL DEFAULT '[]',
  note_ct TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, reading_id)
);

CREATE TABLE IF NOT EXISTS check_ins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  mood INTEGER,
  energy INTEGER,
  sleep INTEGER,
  stress INTEGER,
  note_ct TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT,
  UNIQUE (user_id, day)
);

CREATE TABLE IF NOT EXISTS life_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  occurred_on TEXT NOT NULL,
  domain TEXT NOT NULL DEFAULT 'general',
  label_ct TEXT NOT NULL,
  body_ct TEXT,
  cycle_key TEXT,
  feature_key TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT,
  revision INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS audit_events_user_idx ON audit_events (user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- language layer (AI-generated prose over deterministic facts)
-- ---------------------------------------------------------------------------

-- daily_readings declares above: language_mode ('model' | 'template'), language_model,
-- language_meta (citations, dropped paragraphs, safety flags, fallback reason).

CREATE TABLE IF NOT EXISTS feature_narratives (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_id TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'template',
  model TEXT,
  narrative_ct TEXT NOT NULL,
  citations TEXT NOT NULL DEFAULT '[]',
  essay_version TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, snapshot_id, feature_key)
);

CREATE TABLE IF NOT EXISTS content_drafts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  base_version TEXT,
  base_bundle TEXT,
  base_hash TEXT,
  review_candidate_hash TEXT,
  review_base_hash TEXT,
  reviewed_at TEXT,
  published_version TEXT,
  model TEXT,
  bundle TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS content_drafts_status_idx ON content_drafts (status, created_at DESC);

-- ---------------------------------------------------------------------------
-- synthetic evaluation runs (admin only; fixed synthetic inputs, no member data)
-- ---------------------------------------------------------------------------

-- The pattern-workflows edge plane drives one Workflow per run and calls the app
-- once per case, so a run continues after the admin leaves /content.
CREATE TABLE IF NOT EXISTS evaluation_runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued',
  provider TEXT NOT NULL,
  bundle_source TEXT NOT NULL,
  case_ids TEXT NOT NULL,
  plan TEXT,
  qualification_profile TEXT,
  campaign_id TEXT,
  attempt_limit INTEGER,
  dollar_ceiling_micros INTEGER,
  review_reserve_micros INTEGER,
  enterprise_thinking TEXT,
  arm_key TEXT,
  campaign_attempt_limit INTEGER,
  completed INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  workflow_instance_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS evaluation_runs_user_idx ON evaluation_runs (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS evaluation_results (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES evaluation_runs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  case_id TEXT NOT NULL,
  result TEXT NOT NULL,
  reserved_micros INTEGER NOT NULL DEFAULT 0,
  attempted INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (run_id, position)
);

-- Opt-in assistant identities. These never replace Pattern sessions or data keys.
CREATE TABLE IF NOT EXISTS identity_links (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  issuer TEXT NOT NULL,
  subject TEXT NOT NULL,
  email TEXT,
  linked_at TEXT NOT NULL DEFAULT (datetime('now')),
  revision INTEGER NOT NULL DEFAULT 0,
  UNIQUE (issuer, subject)
);
CREATE TABLE IF NOT EXISTS assistant_grants (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  link_id TEXT NOT NULL REFERENCES identity_links(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  client_name TEXT,
  scopes TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
  authorization_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  revoked_at TEXT,
  UNIQUE (user_id, client_id)
);
CREATE TRIGGER IF NOT EXISTS assistant_unlink AFTER DELETE ON identity_links
BEGIN DELETE FROM assistant_grants WHERE user_id = OLD.user_id; END;
CREATE TRIGGER IF NOT EXISTS assistant_revoke_insert AFTER INSERT ON assistant_grants WHEN NEW.status = 'revoked'
BEGIN UPDATE identity_links SET revision = revision + 1 WHERE id = NEW.link_id; END;
CREATE TRIGGER IF NOT EXISTS assistant_revoke_update AFTER UPDATE OF status ON assistant_grants WHEN NEW.status = 'revoked'
BEGIN UPDATE identity_links SET revision = revision + 1 WHERE id = NEW.link_id; END;

-- Additive membership and account recovery storage. No existing member data changes.
CREATE TABLE IF NOT EXISTS billing_customers (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  trial_used INTEGER NOT NULL DEFAULT 0,
  deleting INTEGER NOT NULL DEFAULT 0,
  checkout_id TEXT,
  checkout_attempt TEXT,
  checkout_plan TEXT
);
CREATE TABLE IF NOT EXISTS memberships (
  stripe_subscription_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  plan TEXT NOT NULL,
  current_period_end INTEGER NOT NULL,
  trial_end INTEGER NOT NULL DEFAULT 0,
  paid_until INTEGER NOT NULL DEFAULT 0,
  cancel_at_period_end INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS memberships_user_idx ON memberships(user_id);
CREATE TABLE IF NOT EXISTS billing_events (
  id TEXT PRIMARY KEY,
  processed_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS billing_locks (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS account_email_state (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  confirmed_at TEXT
);
CREATE TABLE IF NOT EXISTS account_tokens (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL CHECK(purpose IN ('verify','reset','change')),
  email TEXT NOT NULL,
  new_email TEXT,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS account_tokens_user_idx ON account_tokens(user_id, purpose);
CREATE TABLE IF NOT EXISTS account_rate_limits (
  key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  attempts INTEGER NOT NULL
);

-- Additive gateway billing storage. Legacy tables remain intact for rollback.
CREATE TABLE IF NOT EXISTS billing_customers_v2 (
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 environment TEXT NOT NULL CHECK(environment IN ('sandbox','live')),
 stripe_customer_id TEXT NOT NULL,
 trial_used INTEGER NOT NULL DEFAULT 0, deleting INTEGER NOT NULL DEFAULT 0,
 checkout_id TEXT, checkout_attempt TEXT, checkout_plan TEXT,
 PRIMARY KEY(user_id,environment), UNIQUE(environment,stripe_customer_id)
);
CREATE TABLE IF NOT EXISTS memberships_v2 (
 stripe_subscription_id TEXT NOT NULL, environment TEXT NOT NULL CHECK(environment IN ('sandbox','live')),
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 status TEXT NOT NULL, plan TEXT NOT NULL, current_period_end INTEGER NOT NULL DEFAULT 0,
 trial_end INTEGER NOT NULL DEFAULT 0, paid_until INTEGER NOT NULL DEFAULT 0,
 cancel_at_period_end INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL,
 PRIMARY KEY(environment,stripe_subscription_id)
);
CREATE INDEX IF NOT EXISTS memberships_v2_owner ON memberships_v2(user_id,environment);
CREATE TABLE IF NOT EXISTS billing_locks_v2 (
 user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, token TEXT NOT NULL, expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS billing_events_v2 (
 id TEXT NOT NULL, environment TEXT NOT NULL CHECK(environment IN ('sandbox','live')),
 type TEXT NOT NULL, customer_id TEXT, object_id TEXT,
 status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0,
 retry_at INTEGER NOT NULL DEFAULT 0, received_at TEXT NOT NULL, processed_at TEXT,
 PRIMARY KEY(environment,id)
);
CREATE TABLE IF NOT EXISTS billing_coverage (
 environment TEXT NOT NULL, invoice_id TEXT NOT NULL, subscription_id TEXT NOT NULL,
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 period_start INTEGER NOT NULL, period_end INTEGER NOT NULL, amount_paid INTEGER NOT NULL,
 suspended INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(environment,invoice_id)
);
INSERT OR IGNORE INTO billing_customers_v2 SELECT user_id,'sandbox',stripe_customer_id,trial_used,deleting,checkout_id,checkout_attempt,checkout_plan FROM billing_customers;
-- Preserve paid access on migration. Reconciliation replaces coverage with verified invoice periods.
INSERT OR IGNORE INTO memberships_v2 SELECT stripe_subscription_id,'sandbox',user_id,status,plan,current_period_end,trial_end,paid_until,cancel_at_period_end,updated_at FROM memberships;