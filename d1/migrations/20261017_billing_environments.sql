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