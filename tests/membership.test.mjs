import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { before, beforeEach, after, test } from "node:test";
import { createRecordsHarness } from "./helpers/records-harness.mjs";

let h, billing, policy, account, auth, readers, security, originalFetch, sub, sessions, calls;
let failCancel, stripeEmail, failEmailUpdate, customerRetrieveGate, customerUpdateGate;
const keys = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_MONTHLY_PRICE_ID",
  "STRIPE_YEARLY_PRICE_ID",
  "STRIPE_PORTAL_CONFIGURATION_ID",
];
const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
const now = Math.floor(Date.now() / 1000),
  end = now + 30 * 86400;
before(async () => {
  h = await createRecordsHarness();
  billing = await h.vite.ssrLoadModule("/src/lib/billing.server.ts");
  policy = await h.vite.ssrLoadModule("/src/lib/billing-policy.ts");
  account = await h.vite.ssrLoadModule("/src/lib/account-data.server.ts");
  auth = await h.vite.ssrLoadModule("/src/lib/auth.server.ts");
  readers = await h.vite.ssrLoadModule("/src/lib/mcp/readers.server.ts");
  security = await h.vite.ssrLoadModule("/src/lib/account-security.server.ts");
  originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(
      typeof input === "string" ? input : input instanceof URL ? input.href : input.url,
    );
    if (url.hostname !== "api.stripe.com") return originalFetch(input, init);
    const method = init.method ?? "GET",
      body = new URLSearchParams(String(init.body ?? ""));
    calls.push({ path: url.pathname, method, body });
    const json = (value, status = 200) => Response.json(value, { status });
    if (url.pathname === "/v1/customers") {
      stripeEmail = body.get("email");
      return json({ id: "cus_a", livemode: false });
    }
    if (url.pathname === "/v1/customers/cus_a") {
      const gate = method === "POST" ? customerUpdateGate : customerRetrieveGate;
      if (gate) {
        if (method === "POST") customerUpdateGate = null;
        else customerRetrieveGate = null;
        gate.entered();
        await gate.release;
      }
      if (method === "POST") {
        if (failEmailUpdate)
          return json({ error: { message: "Synthetic outage", type: "api_error" } }, 503);
        stripeEmail = body.get("email");
      }
      return json({ id: "cus_a", object: "customer", email: stripeEmail, livemode: false });
    }
    if (url.pathname === "/v1/billing_portal/sessions")
      return json({ id: "bps_a", url: "https://billing.stripe.com/p/session/test_a" });
    if (url.pathname.startsWith("/v1/prices/")) {
      const year = url.pathname.endsWith("price_year");
      return json({
        id: year ? "price_year" : "price_month",
        livemode: false,
        active: true,
        unit_amount: year ? 7200 : 800,
        currency: "usd",
        recurring: { interval: year ? "year" : "month", interval_count: 1 },
      });
    }
    if (url.pathname === "/v1/subscriptions")
      return json({ data: sub ? [sub] : [], has_more: false });
    if (url.pathname === "/v1/subscriptions/sub_a") {
      if (method === "DELETE") {
        if (failCancel)
          return json({ error: { message: "Synthetic outage", type: "api_error" } }, 503);
        sub.status = "canceled";
      }
      if (method === "POST") sub.cancel_at_period_end = body.get("cancel_at_period_end") === "true";
      return json(sub);
    }
    if (url.pathname === "/v1/checkout/sessions" && method === "POST") {
      const session = {
        id: "cs_test_a",
        customer: "cus_a",
        client_reference_id: h.userA,
        livemode: false,
        status: "open",
        payment_status: "unpaid",
        url: "https://checkout.stripe.com/c/pay/cs_test_a",
      };
      sessions.push(session);
      return json(session);
    }
    if (url.pathname === "/v1/checkout/sessions")
      return json({ data: sessions.filter((s) => s.status === "open"), has_more: false });
    if (url.pathname.endsWith("/expire")) {
      sessions[0].status = "expired";
      return json(sessions[0]);
    }
    if (url.pathname.startsWith("/v1/checkout/sessions/"))
      return json(sessions.find((s) => url.pathname.endsWith(s.id)));
    throw new Error("Unexpected Stripe fixture route: " + url.pathname);
  };
});
beforeEach(async () => {
  await h.reset();
  process.env.PATTERN_MEMBERSHIPS_ENABLED = "true";
  Object.assign(process.env, {
    STRIPE_SECRET_KEY: "sk_test_synthetic",
    STRIPE_WEBHOOK_SECRET: "whsec_synthetic",
    STRIPE_MONTHLY_PRICE_ID: "price_month",
    STRIPE_YEARLY_PRICE_ID: "price_year",
    STRIPE_PORTAL_CONFIGURATION_ID: "bpc_test",
  });
  sub = null;
  sessions = [];
  calls = [];
  failCancel = false;
  stripeEmail = null;
  failEmailUpdate = false;
  customerRetrieveGate = null;
  customerUpdateGate = null;
});
after(async () => {
  globalThis.fetch = originalFetch;
  await h?.close();
  for (const key of keys) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});
async function customer() {
  await h
    .records()
    .exec("INSERT INTO billing_customers(user_id,stripe_customer_id) VALUES(?,?)", [
      h.userA,
      "cus_a",
    ]);
}
async function confirmChange(next) {
  const raw = randomBytes(32).toString("hex"),
    user = h.sqlite.prepare("SELECT email,password_hash FROM users WHERE id=?").get(h.userA);
  h.sqlite
    .prepare(
      "INSERT INTO account_tokens(token_hash,user_id,purpose,email,new_email,password_hash,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?)",
    )
    .run(
      createHash("sha256").update(raw).digest("hex"),
      h.userA,
      "change",
      user.email,
      next,
      user.password_hash,
      Date.now(),
      Date.now() + 60_000,
    );
  return security.consumeAccountToken(raw, "confirm", undefined, h.records());
}
function deferredCustomerRequest() {
  let entered, unblock;
  const started = new Promise((resolve) => {
    entered = resolve;
  });
  const release = new Promise((resolve) => {
    unblock = resolve;
  });
  return { entered, release, started, unblock };
}
function subscription(status = "active") {
  sub = {
    id: "sub_a",
    customer: "cus_a",
    status,
    livemode: false,
    trial_start: status === "trialing" ? now : null,
    trial_end: status === "trialing" ? now + 7 * 86400 : null,
    cancel_at_period_end: false,
    items: { data: [{ price: { id: "price_month" }, quantity: 1, current_period_end: end }] },
    latest_invoice: { id: "in_a", status: "paid" },
  };
}
function event(id = "evt_a", type = "invoice.paid") {
  return { id, type, livemode: false, data: { object: { customer: "cus_a" } } };
}

test("monthly and yearly checkout use configured prices, one trial and no duplicate session", async () => {
  const first = await billing.startCheckout(
    h.userA,
    "fixture@example.invalid",
    "month",
    h.records(),
  );
  assert.match(first.url, /^https:\/\/checkout.stripe.com/);
  assert.deepEqual(
    await billing.startCheckout(h.userA, "fixture@example.invalid", "month", h.records()),
    first,
  );
  assert.equal(
    calls.filter((c) => c.path === "/v1/checkout/sessions" && c.method === "POST").length,
    1,
  );
  const request = calls.find((c) => c.path === "/v1/checkout/sessions" && c.method === "POST");
  assert.equal(request.body.get("subscription_data[trial_period_days]"), "7");
  assert.equal(request.body.get("line_items[0][price]"), "price_month");
  assert.equal(request.body.has("payment_method_types[0]"), false);
  await h.records().exec("UPDATE billing_customers SET trial_used=1 WHERE user_id=?", [h.userA]);
  await billing.startCheckout(h.userA, "fixture@example.invalid", "year", h.records());
  const annual = calls
    .filter((c) => c.path === "/v1/checkout/sessions" && c.method === "POST")
    .at(-1);
  assert.equal(annual.body.get("line_items[0][price]"), "price_year");
  assert.equal(annual.body.has("subscription_data[trial_period_days]"), false);
  assert.ok(calls.some((c) => c.path.endsWith("/expire")));
});

test("access ends at the trial or paid end, waits briefly for a pending renewal, and stops when payment fails", async () => {
  const grace = policy.RENEWAL_GRACE_SECONDS,
    row = () => h.sqlite.prepare("SELECT * FROM memberships").get(),
    at = (rows, seconds) => policy.membershipAccess(rows, seconds * 1000);
  await customer();
  subscription("trialing");
  await billing.handleBillingEvent(event(), h.records());
  assert.equal((await billing.getMembership(h.userA, h.records())).fullAccess, true);
  const trial = row(),
    trialEnd = trial.trial_end;
  assert.equal(at([{ ...trial, cancel_at_period_end: 1 }], trialEnd).fullAccess, false);
  assert.equal(at([trial], trialEnd).renewalPending, true);
  assert.equal(at([trial], trialEnd + grace).fullAccess, false);

  // Stripe converts the trial, then drafts the first invoice for about an hour before charging it.
  const firstEnd = trialEnd + 30 * 86400;
  sub.status = "active";
  sub.items.data[0].current_period_end = firstEnd;
  sub.latest_invoice.status = "draft";
  await billing.handleBillingEvent(
    event("evt_converted", "customer.subscription.updated"),
    h.records(),
  );
  const converting = row();
  assert.equal(converting.paid_until, 0);
  const firstCharge = at([converting], trialEnd + 3600);
  assert.equal(firstCharge.fullAccess, true);
  assert.equal(firstCharge.renewalPending, true);
  assert.equal(firstCharge.paidThrough, new Date(trialEnd * 1000).toISOString());
  assert.equal(at([converting], trialEnd + grace).fullAccess, false);

  sub.latest_invoice.status = "paid";
  await billing.handleBillingEvent(event("evt_paid"), h.records());
  const paid = row();
  assert.equal(paid.paid_until, firstEnd);
  assert.equal(at([paid], trialEnd + 3600).renewalPending, false);
  assert.equal(
    at([paid], firstEnd - 1).accessUntil,
    new Date((firstEnd + grace) * 1000).toISOString(),
  );

  sub.items.data[0].current_period_end = firstEnd + 30 * 86400;
  sub.latest_invoice.status = "draft";
  await billing.handleBillingEvent(
    event("evt_renewing", "customer.subscription.updated"),
    h.records(),
  );
  const renewing = row();
  assert.equal(renewing.paid_until, firstEnd);
  assert.equal(at([renewing], firstEnd + 3600).renewalPending, true);

  sub.status = "past_due";
  sub.latest_invoice.status = "open";
  await billing.handleBillingEvent(event("evt_failed", "invoice.payment_failed"), h.records());
  const failed = row();
  assert.equal(failed.paid_until, firstEnd);
  assert.equal(at([failed], firstEnd).fullAccess, false);
  assert.equal(at([failed], firstEnd + 3600).renewalPending, false);
});

test("cancel really updates Stripe, preserves current access, and ends access on termination", async () => {
  await customer();
  subscription();
  await billing.handleBillingEvent(event(), h.records());
  const canceled = await billing.cancelMembership(h.userA, h.records());
  assert.equal(sub.cancel_at_period_end, true);
  assert.equal(canceled.fullAccess, true);
  assert.equal(canceled.membership.cancelAtPeriodEnd, true);
  assert.equal(canceled.accessUntil, new Date(end * 1000).toISOString());
  sub.status = "canceled";
  await billing.handleBillingEvent(
    event("evt_ended", "customer.subscription.deleted"),
    h.records(),
  );
  assert.equal((await billing.getMembership(h.userA, h.records())).fullAccess, false);
});

test("duplicate and out-of-order webhooks use current Stripe state and never resurrect expired access", async () => {
  await customer();
  subscription();
  await billing.handleBillingEvent(event(), h.records());
  const count = calls.length;
  await billing.handleBillingEvent(event(), h.records());
  assert.equal(calls.length, count);
  sub.status = "canceled";
  await billing.handleBillingEvent(event("evt_new"), h.records());
  await billing.handleBillingEvent(event("evt_old"), h.records());
  assert.equal((await billing.getMembership(h.userA, h.records())).fullAccess, false);
  await assert.rejects(
    billing.handleBillingEvent({ ...event(), id: "evt_live", livemode: true }, h.records()),
    /Live payments/,
  );
});

test("checkout cannot grant access to a different account or create a second active subscription", async () => {
  await customer();
  subscription();
  await assert.rejects(
    billing.startCheckout(h.userA, "fixture@example.invalid", "month", h.records()),
    /already have/,
  );
  sessions.push({
    id: "cs_test_other",
    customer: "cus_other",
    client_reference_id: h.userB,
    status: "complete",
    payment_status: "paid",
  });
  await assert.rejects(
    billing.refreshMembership(h.userA, "cs_test_other", h.records()),
    /another account/,
  );
  assert.equal((await billing.getMembership(h.userB, h.records())).fullAccess, false);
});

test("checkout and the portal use the stored account email when the caller email is stale", async () => {
  await customer();
  stripeEmail = "old@example.invalid";
  h.sqlite.prepare("UPDATE users SET email=? WHERE id=?").run("new@example.invalid", h.userA);
  const updates = () =>
    calls.filter((c) => c.path === "/v1/customers/cus_a" && c.method === "POST").length;
  await billing.startCheckout(h.userA, "old@example.invalid", "month", h.records());
  assert.equal(stripeEmail, "new@example.invalid");
  assert.equal(updates(), 1);
  const portal = await billing.membershipPortal(h.userA, "new@example.invalid", h.records());
  assert.match(portal.url, /^https:\/\/billing.stripe.com/);
  assert.equal(updates(), 1);
  h.sqlite.prepare("UPDATE users SET email=? WHERE id=?").run("newer@example.invalid", h.userA);
  await billing.membershipPortal(h.userA, "new@example.invalid", h.records());
  assert.equal(stripeEmail, "newer@example.invalid");
});

test("a confirmed email change reaches Stripe, and a Stripe outage cannot block it", async () => {
  await customer();
  stripeEmail = h.sqlite.prepare("SELECT email FROM users WHERE id=?").get(h.userA).email;
  await confirmChange("new@example.invalid");
  assert.equal(stripeEmail, "new@example.invalid");
  failEmailUpdate = true;
  assert.equal((await confirmChange("later@example.invalid")).signInRequired, true);
  assert.equal(
    h.sqlite.prepare("SELECT email FROM users WHERE id=?").get(h.userA).email,
    "later@example.invalid",
  );
  assert.equal(stripeEmail, "new@example.invalid");
});

test("a portal request paused during retrieval cannot rewind a confirmed account email", async () => {
  await customer();
  const old = h.sqlite.prepare("SELECT email FROM users WHERE id=?").get(h.userA).email;
  stripeEmail = old;
  const gate = deferredCustomerRequest();
  customerRetrieveGate = gate;
  const opening = billing.membershipPortal(h.userA, old, h.records());
  try {
    await gate.started;
    assert.equal((await confirmChange("confirmed@example.invalid")).signInRequired, true);
  } finally {
    gate.unblock();
  }
  await opening;
  assert.equal(stripeEmail, "confirmed@example.invalid");
  assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM billing_locks").get().n, 0);
});

test("a confirmation during a customer update is reconciled before the portal succeeds", async () => {
  await customer();
  const old = h.sqlite.prepare("SELECT email FROM users WHERE id=?").get(h.userA).email;
  stripeEmail = "outdated@example.invalid";
  const gate = deferredCustomerRequest();
  customerUpdateGate = gate;
  const opening = billing.membershipPortal(h.userA, old, h.records());
  try {
    await gate.started;
    assert.equal((await confirmChange("confirmed@example.invalid")).signInRequired, true);
  } finally {
    gate.unblock();
  }
  await opening;
  assert.equal(stripeEmail, "confirmed@example.invalid");
});

test("billing lock prevents a concurrent checkout/deletion", async () => {
  await billing.withBillingLock(h.records(), h.userA, async () => {
    await assert.rejects(
      billing.startCheckout(h.userA, "fixture@example.invalid", "month", h.records()),
      /already in progress/,
    );
  });
  assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM billing_locks").get().n, 0);
});

test("account deletion stops open checkouts and subscriptions first; cancellation failure keeps account for retry", async () => {
  await customer();
  subscription();
  h.sqlite
    .prepare("UPDATE users SET password_hash=? WHERE id=?")
    .run(await auth.hashPassword("test password"), h.userA);
  sessions.push({ id: "cs_test_a", status: "open" });
  failCancel = true;
  await assert.rejects(account.deleteAccount(h.userA, "test password", h.records()));
  assert.ok(h.sqlite.prepare("SELECT id FROM users WHERE id=?").get(h.userA));
  assert.equal(h.sqlite.prepare("SELECT deleting FROM billing_customers").get().deleting, 1);
  await assert.rejects(
    billing.startCheckout(h.userA, "fixture@example.invalid", "month", h.records()),
    /deletion/,
  );
  failCancel = false;
  await account.deleteAccount(h.userA, "test password", h.records());
  assert.equal(sub.status, "canceled");
  assert.equal(sessions[0].status, "expired");
  assert.equal(h.sqlite.prepare("SELECT id FROM users WHERE id=?").get(h.userA), undefined);
  await billing.handleBillingEvent(event("evt_delayed"), h.records());
  assert.equal(h.sqlite.prepare("SELECT COUNT(*) n FROM billing_customers").get().n, 0);
});

test("server chapter and assistant reads enforce membership, including saved full essays", async () => {
  const seeded = await h.seedChart(h.records());
  const snap = await h.app.loadSnapshot(h.records(), h.userA);
  const context = await h.app.featureNarrativeContext(
    h.records(),
    h.userA,
    snap,
    h.app.snapshotToChart(snap),
  );
  const paragraphs = [
    "Opening chapter paragraph.",
    "MEMBERS ONLY continuation.",
    "Something to sit with: Where do you recognise this pattern?",
  ];
  await h.records().from("natal_features").insert({
    user_id: h.userA,
    snapshot_id: seeded.snapshotId,
    feature_key: "sun",
    family: "placement",
    title: "Sun in Aries",
  });
  await h
    .records()
    .from("feature_narratives")
    .insert({
      user_id: h.userA,
      snapshot_id: seeded.snapshotId,
      feature_key: "sun",
      mode: "model",
      essay_version: context.essayKey,
      narrative_ct: await h.cryptoModule.encryptJson(seeded.dek, {
        format: "pattern-natal-evidence-1",
        narrative: paragraphs.join("\n\n"),
        paragraphs,
        facts: [],
      }),
      citations: [
        { paragraph: 1, facts: [] },
        { paragraph: 2, facts: [] },
      ],
    });
  const free = await h.app.getFeatureNarrative(h.records(), h.userA, "sun");
  assert.equal(free.locked, true);
  assert.equal(free.paragraphs.length, 1);
  assert.equal(JSON.stringify(free).includes("MEMBERS ONLY"), false);
  assert.equal((await readers.readChapter(h.userA, "sun")).status, "unavailable");
  await customer();
  subscription();
  await billing.handleBillingEvent(event(), h.records());
  const paid = await h.app.getFeatureNarrative(h.records(), h.userA, "sun");
  assert.equal(paid.locked, false);
  assert.equal(paid.paragraphs.length, 3);
  assert.equal((await readers.readChapter(h.userA, "sun")).status, "available");
  // Renewal was canceled and the paid period has ended.
  h.sqlite.prepare("UPDATE memberships SET paid_until=?,cancel_at_period_end=1").run(now - 1);
  assert.equal((await h.app.getFeatureNarrative(h.records(), h.userA, "sun")).paragraphs.length, 1);
  assert.equal((await readers.readChapter(h.userA, "sun")).status, "unavailable");
});
