import type Stripe from "stripe";
import { billingConfig, billingEnvironment } from "./billing-config.server";
import { createStripeClient, type StripeEnv } from "./stripe.server";
import { records, type DBClient } from "./d1.server";
import { appOrigin } from "./app-origin.server";
import { requireVerifiedEmail } from "./account-security.server";
import {
  membershipAccess,
  PLANS,
  TRIAL_DAYS,
  type MembershipPlan,
  type MembershipRow,
} from "./billing-policy";

type Customer = {
  user_id: string;
  environment: StripeEnv;
  stripe_customer_id: string;
  trial_used: number;
  deleting: number;
  checkout_id: string | null;
  checkout_attempt: string | null;
  checkout_plan: string | null;
};
export async function stripeClient(env = billingEnvironment()) {
  return createStripeClient(env);
}
const idOf = (value: string | { id: string } | null | undefined) =>
  typeof value === "string" ? value : value?.id;
async function customerFor(db: DBClient, userId: string, env: StripeEnv) {
  return (
    await db.exec<Customer>(
      "SELECT * FROM billing_customers_v2 WHERE user_id=? AND environment=?",
      [userId, env],
    )
  )[0];
}
async function rowsFor(db: DBClient, userId: string, env: StripeEnv) {
  return db.exec<MembershipRow>(
    "SELECT * FROM memberships_v2 WHERE user_id=? AND environment=? ORDER BY updated_at DESC",
    [userId, env],
  );
}
/** A renewable lease plus DB write fencing prevents an expired worker overwriting its successor. */
export async function withBillingLock<T>(
  db: DBClient,
  userId: string,
  operation: () => Promise<T>,
): Promise<T> {
  const token = crypto.randomUUID(),
    now = Date.now();
  const [lock] = await db.exec<{ token: string }>(
    "INSERT INTO billing_locks_v2(user_id,token,expires_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET token=excluded.token,expires_at=excluded.expires_at WHERE billing_locks_v2.expires_at<? RETURNING token",
    [userId, token, now + 180_000, now],
  );
  if (lock?.token !== token)
    throw new Error("A membership change is already in progress. Please try again shortly.");
  db.bindBillingFence(() => ({
    sql: "SELECT CASE WHEN EXISTS(SELECT 1 FROM billing_locks_v2 WHERE user_id=? AND token=? AND expires_at>?) THEN 1 ELSE json('billing-lease-lost') END",
    params: [userId, token, Date.now()],
  }));
  const heartbeat = setInterval(() => {
    void db
      .exec("UPDATE billing_locks_v2 SET expires_at=? WHERE user_id=? AND token=?", [
        Date.now() + 180_000,
        userId,
        token,
      ])
      .catch(() => {});
  }, 30_000);
  try {
    return await operation();
  } finally {
    clearInterval(heartbeat);
    db.bindBillingFence(null);
    await db.exec("DELETE FROM billing_locks_v2 WHERE user_id=? AND token=?", [userId, token]);
  }
}
export async function getMembership(userId: string, db = records()) {
  let env: StripeEnv;
  try {
    env = billingEnvironment();
  } catch {
    return {
      enabled: false,
      checkoutReady: false,
      testMode: false,
      fullAccess: false,
      accessUntil: null,
      paidThrough: null,
      renewalPending: false,
      membership: null,
      trialEligible: false,
      hasCustomer: false,
    };
  }
  const config = await billingConfig(),
    rows = await rowsFor(db, userId, env),
    customer = await customerFor(db, userId, env);
  const current =
    rows.find((r) => !["canceled", "incomplete_expired"].includes(r.status)) ?? rows[0];
  return {
    enabled: config.enabled,
    checkoutReady:
      config.enabled &&
      Boolean(
        process.env[env === "sandbox" ? "STRIPE_SANDBOX_API_KEY" : "STRIPE_LIVE_API_KEY"] &&
        process.env["LOVABLE_API_KEY"],
      ) &&
      !customer?.deleting,
    testMode: env === "sandbox",
    ...membershipAccess(rows),
    trialEligible: !customer?.trial_used,
    hasCustomer: Boolean(customer),
    membership: current
      ? {
          status: current.status,
          plan: current.plan,
          cancelAtPeriodEnd: Boolean(current.cancel_at_period_end),
          periodEnd: current.current_period_end
            ? new Date(current.current_period_end * 1000).toISOString()
            : null,
        }
      : null,
  };
}
export type MembershipState = Awaited<ReturnType<typeof getMembership>>;
async function currentAccountEmail(db: DBClient, userId: string) {
  const [account] = await db.exec<{ email: string }>("SELECT email FROM users WHERE id=?", [
    userId,
  ]);
  if (!account) throw new Error("Your account is unavailable. Please sign in again.");
  return account.email;
}
async function matchCustomerEmail(
  stripe: Stripe,
  customerId: string,
  userId: string,
  db: DBClient,
) {
  const current = await stripe.customers.retrieve(customerId);
  if (current.deleted) throw new Error("Your billing customer was deleted. Contact support.");
  let email = current.email;
  for (let pass = 0; pass < 3; pass++) {
    const next = await currentAccountEmail(db, userId);
    if (email === next && current.metadata["userId"] === userId) return;
    email = (
      await stripe.customers.update(customerId, {
        email: next,
        metadata: { ...current.metadata, userId },
      })
    ).email;
    if (email === (await currentAccountEmail(db, userId))) return;
  }
  throw new Error("Your account email changed during the billing update. Please try again.");
}
async function resolveOrCreateCustomer(
  stripe: ReturnType<typeof createStripeClient>,
  options: { email?: string; userId?: string },
): Promise<string> {
  if (options.userId && !/^[a-zA-Z0-9_-]+$/.test(options.userId)) throw new Error("Invalid userId");
  if (options.userId) {
    const found = await stripe.customers.search({
      query: `metadata['userId']:'${options.userId}'`,
      limit: 1,
    });
    if (found.data[0]) return found.data[0].id;
  }
  if (options.email) {
    const existing = await stripe.customers.list({ email: options.email, limit: 1 });
    if (existing.data[0]) {
      const customer = existing.data[0];
      if (options.userId && customer.metadata?.["userId"] !== options.userId)
        await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, userId: options.userId },
        });
      return customer.id;
    }
  }
  const created = await stripe.customers.create({
    ...(options.email && { email: options.email }),
    ...(options.userId && { metadata: { userId: options.userId } }),
  });
  return created.id;
}
async function allSubscriptions(stripe: Stripe, customer: string) {
  const rows: Stripe.Subscription[] = [];
  for await (const sub of stripe.subscriptions.list({ customer, status: "all", limit: 100 }))
    rows.push(sub);
  return rows;
}
async function catalogPrice(stripe: Stripe, plan: MembershipPlan) {
  const prices = await stripe.prices.list({
    lookup_keys: [plan === "month" ? "plus_monthly" : "plus_yearly"],
    active: true,
    limit: 1,
  });
  const price = prices.data[0];
  if (
    !price ||
    price.unit_amount !== PLANS[plan].amount ||
    price.currency !== "usd" ||
    price.recurring?.interval !== plan ||
    price.recurring.interval_count !== 1
  )
    throw new Error("Membership pricing could not be verified. Please try again later.");
  return price;
}
function planFor(price: Stripe.Price): MembershipPlan | null {
  const key = price.lookup_key ?? price.metadata?.["lovable_external_id"];
  if (key === "plus_monthly") return "month";
  if (key === "plus_yearly") return "year";
  // Legacy grandfathered prices are identified by their actual recurring catalog shape.
  if (
    price.currency === "usd" &&
    price.recurring?.interval_count === 1 &&
    ["month", "year"].includes(price.recurring.interval)
  )
    return price.recurring.interval as MembershipPlan;
  return null;
}
/** Only settled recurring subscription lines purchase coverage, not an invoice's current subscription period. */
async function syncSubscription(
  db: DBClient,
  userId: string,
  stripe: Stripe,
  subscriptionId: string,
  env: StripeEnv,
) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId),
    customer = await customerFor(db, userId, env);
  if (
    !customer ||
    idOf(sub.customer) !== customer.stripe_customer_id ||
    sub.livemode !== (env === "live")
  )
    throw new Error("Membership does not belong to this account.");
  const item = sub.items.data[0],
    plan = item ? planFor(item.price) : null;
  const supported = Boolean(plan && sub.items.data.length === 1 && item?.quantity === 1);
  if (supported) {
    for await (const invoice of stripe.invoices.list({
      customer: customer.stripe_customer_id,
      subscription: sub.id,
      status: "paid",
      limit: 100,
    })) {
      let start = Infinity,
        end = 0;
      for await (const line of stripe.invoices.listLineItems(invoice.id, { limit: 100 })) {
        if (
          line.parent?.type !== "subscription_item_details" ||
          line.parent.subscription_item_details?.subscription !== sub.id ||
          line.parent.subscription_item_details.proration ||
          line.amount < 0
        )
          continue;
        start = Math.min(start, line.period.start);
        end = Math.max(end, line.period.end);
      }
      if (end && Number.isFinite(start))
        await db.exec(
          "INSERT INTO billing_coverage(environment,invoice_id,subscription_id,user_id,period_start,period_end,amount_paid) VALUES(?,?,?,?,?,?,?) ON CONFLICT(environment,invoice_id) DO UPDATE SET period_start=excluded.period_start,period_end=excluded.period_end,amount_paid=excluded.amount_paid",
          [env, invoice.id, sub.id, userId, start, end, invoice.amount_paid],
        );
    }
  }
  const [coverage] = await db.exec<{ end: number }>(
    "SELECT MAX(period_end) AS end FROM billing_coverage WHERE environment=? AND subscription_id=? AND suspended=0",
    [env, sub.id],
  );
  const [suspended] = await db.exec<{ n: number }>(
    "SELECT COUNT(*) AS n FROM billing_coverage WHERE environment=? AND subscription_id=? AND suspended=1 AND period_end>?",
    [env, sub.id, Math.floor(Date.now() / 1000)],
  );
  await db.batch([
    {
      sql: "INSERT INTO memberships_v2(stripe_subscription_id,environment,user_id,status,plan,current_period_end,trial_end,paid_until,cancel_at_period_end,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(environment,stripe_subscription_id) DO UPDATE SET status=excluded.status,plan=excluded.plan,current_period_end=excluded.current_period_end,trial_end=excluded.trial_end,paid_until=excluded.paid_until,cancel_at_period_end=excluded.cancel_at_period_end,updated_at=excluded.updated_at",
      params: [
        sub.id,
        env,
        userId,
        !supported ? "unsupported" : suspended?.n ? "suspended" : sub.status,
        plan ?? "month",
        item?.current_period_end ?? 0,
        sub.trial_end ?? 0,
        coverage?.end ?? 0,
        sub.cancel_at_period_end ? 1 : 0,
        new Date().toISOString(),
      ],
    },
    {
      sql: "UPDATE billing_customers_v2 SET trial_used=MAX(trial_used,?) WHERE user_id=? AND environment=?",
      params: [sub.trial_start ? 1 : 0, userId, env],
    },
  ]);
}
export async function syncBillingEmail(userId: string, _email: string, db = records()) {
  await withBillingLock(db, userId, async () => {
    for (const env of ["sandbox", "live"] as const) {
      const customer = await customerFor(db, userId, env);
      if (customer && !customer.deleting)
        await matchCustomerEmail(createStripeClient(env), customer.stripe_customer_id, userId, db);
    }
  });
}
export async function startCheckout(
  userId: string,
  _email: string,
  plan: MembershipPlan,
  db = records(),
) {
  const env = billingEnvironment();
  await requireVerifiedEmail(userId, db);
  if ((await customerFor(db, userId, env))?.deleting)
    throw new Error("Account deletion is in progress. Checkout is unavailable.");
  if (!(await getMembership(userId, db)).checkoutReady)
    throw new Error("Membership checkout is unavailable. Please try again later.");
  return withBillingLock(db, userId, async () => {
    const stripe = createStripeClient(env);
    let customer = await customerFor(db, userId, env);
    if (customer?.deleting)
      throw new Error("Account deletion is in progress. Checkout is unavailable.");
    const email = await currentAccountEmail(db, userId);
    if (!customer) {
      const customerId = await resolveOrCreateCustomer(stripe, { email, userId });
      await db.exec(
        "INSERT INTO billing_customers_v2(user_id,environment,stripe_customer_id) VALUES(?,?,?)",
        [userId, env, customerId],
      );
      customer = await customerFor(db, userId, env);
      if (!customer) throw new Error("Billing customer could not be saved.");
    }
    await matchCustomerEmail(stripe, customer.stripe_customer_id, userId, db);
    const subscriptions = await allSubscriptions(stripe, customer.stripe_customer_id);
    if (subscriptions.some((s) => !["canceled", "incomplete_expired"].includes(s.status)))
      throw new Error("You already have a membership. Manage it in Context & privacy.");
    if (subscriptions.some((s) => Boolean(s.trial_start))) {
      customer.trial_used = 1;
      await db.exec(
        "UPDATE billing_customers_v2 SET trial_used=1 WHERE user_id=? AND environment=?",
        [userId, env],
      );
    }
    if (customer.checkout_id) {
      const existing = await stripe.checkout.sessions.retrieve(customer.checkout_id);
      if (existing.status === "open" && customer.checkout_plan === plan && existing.client_secret)
        return { clientSecret: existing.client_secret };
      if (existing.status === "open") await stripe.checkout.sessions.expire(existing.id);
      customer.checkout_attempt = null;
    }
    const price = await catalogPrice(stripe, plan),
      attempt = customer.checkout_attempt ?? crypto.randomUUID();
    if (price.livemode !== (env === "live"))
      throw new Error("Price environment does not match checkout.");
    await db.exec(
      "UPDATE billing_customers_v2 SET checkout_attempt=?,checkout_plan=? WHERE user_id=? AND environment=?",
      [attempt, plan, userId, env],
    );
    const session = await stripe.checkout.sessions.create(
      {
        mode: "subscription",
        ui_mode: "embedded_page",
        customer: customer.stripe_customer_id,
        client_reference_id: userId,
        line_items: [{ price: price.id, quantity: 1 }],
        return_url: `${appOrigin()}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
        payment_method_collection: "always",
        managed_payments: { enabled: true },
        metadata: { userId, managed_payments: "true" },
        subscription_data: {
          metadata: { userId },
          ...(!customer.trial_used
            ? {
                trial_period_days: TRIAL_DAYS,
                trial_settings: { end_behavior: { missing_payment_method: "cancel" as const } },
              }
            : {}),
        },
      } as Stripe.Checkout.SessionCreateParams,
      { idempotencyKey: `pattern-${env}-checkout-${attempt}` },
    );
    await db.exec(
      "UPDATE billing_customers_v2 SET checkout_id=? WHERE user_id=? AND environment=?",
      [session.id, userId, env],
    );
    if (!session.client_secret) throw new Error("Stripe did not return a client secret.");
    return { clientSecret: session.client_secret };
  });
}
export async function membershipPortal(userId: string, _email: string, db = records()) {
  const env = billingEnvironment();
  return withBillingLock(db, userId, async () => {
    const customer = await customerFor(db, userId, env);
    if (!customer || customer.deleting) throw new Error("There is no membership to manage.");
    const stripe = createStripeClient(env);
    await matchCustomerEmail(stripe, customer.stripe_customer_id, userId, db);
    const config = await billingConfig();
    const portal = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      ...(config.portalConfigurationId ? { configuration: config.portalConfigurationId } : {}),
      return_url: `${appOrigin()}/privacy`,
    });
    return { url: portal.url };
  });
}
export async function updateMembership(
  userId: string,
  action: "cancel" | "resume" | MembershipPlan,
  db = records(),
) {
  const env = billingEnvironment();
  if (action === "month" || action === "year") await requireVerifiedEmail(userId, db);
  await withBillingLock(db, userId, async () => {
    const customer = await customerFor(db, userId, env);
    if (!customer || customer.deleting) throw new Error("There is no membership to manage.");
    const stripe = createStripeClient(env);
    const subscriptions = (await allSubscriptions(stripe, customer.stripe_customer_id)).filter(
      (s) => !["canceled", "incomplete_expired"].includes(s.status),
    );
    if (subscriptions.length !== 1)
      throw new Error("Membership needs support before it can be changed.");
    const sub = subscriptions[0];
    if (!sub) throw new Error("No active membership was found.");
    const item = sub.items.data[0];
    if (!item || sub.items.data.length !== 1 || item.quantity !== 1 || !planFor(item.price))
      throw new Error("This membership configuration is not supported.");
    if (action === "cancel" || action === "resume")
      await stripe.subscriptions.update(
        sub.id,
        { cancel_at_period_end: action === "cancel" },
        { idempotencyKey: `pattern-${env}-${sub.id}-${action}-${sub.cancel_at_period_end}` },
      );
    else {
      const price = await catalogPrice(stripe, action);
      if (item.price.id !== price.id) {
        if (sub.pending_update)
          throw new Error(
            "A plan change is awaiting payment. Update your card before trying again.",
          );
        const updated = await stripe.subscriptions.update(
          sub.id,
          {
            items: [{ id: item.id, price: price.id }],
            proration_behavior: "always_invoice",
            payment_behavior: "pending_if_incomplete",
          },
          {
            idempotencyKey: `pattern-${env}-${sub.id}-${item.price.id}-${price.id}-${item.current_period_end}`,
          },
        );
        await syncSubscription(db, userId, stripe, sub.id, env);
        if (updated.pending_update)
          throw new Error(
            "Your plan change needs payment or card authentication. Open billing details to complete it; your existing plan remains unchanged.",
          );
      }
    }
    await syncSubscription(db, userId, stripe, sub.id, env);
  });
  return getMembership(userId, db);
}
export const cancelMembership = (userId: string, db = records()) =>
  updateMembership(userId, "cancel", db);
export async function refreshMembership(userId: string, sessionId?: string, db = records()) {
  const env = billingEnvironment();
  let pending = false;
  await withBillingLock(db, userId, async () => {
    const customer = await customerFor(db, userId, env);
    if (!customer || customer.deleting) throw new Error("No membership checkout was found.");
    const stripe = createStripeClient(env);
    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (
        session.livemode !== (env === "live") ||
        idOf(session.customer) !== customer.stripe_customer_id ||
        session.client_reference_id !== userId
      )
        throw new Error("This checkout belongs to another account.");
      pending =
        session.status !== "complete" ||
        !["paid", "no_payment_required"].includes(session.payment_status);
    }
    if (!pending)
      for (const sub of await allSubscriptions(stripe, customer.stripe_customer_id))
        await syncSubscription(db, userId, stripe, sub.id, env);
  });
  return { ...(await getMembership(userId, db)), checkoutPending: pending };
}
export async function prepareBillingDeletion(userId: string, db = records()) {
  for (const env of ["sandbox", "live"] as const) {
    const customer = await customerFor(db, userId, env);
    if (!customer) continue;
    await db.exec("UPDATE billing_customers_v2 SET deleting=1 WHERE user_id=? AND environment=?", [
      userId,
      env,
    ]);
    const stripe = createStripeClient(env);
    for await (const session of stripe.checkout.sessions.list({
      customer: customer.stripe_customer_id,
      status: "open",
      limit: 100,
    }))
      await stripe.checkout.sessions.expire(session.id);
    for (const sub of await allSubscriptions(stripe, customer.stripe_customer_id))
      if (!["canceled", "incomplete_expired"].includes(sub.status))
        await stripe.subscriptions.cancel(
          sub.id,
          { invoice_now: false, prorate: false },
          { idempotencyKey: `pattern-${env}-delete-${sub.id}` },
        );
  }
}
export async function handleBillingEvent(
  event: Stripe.Event,
  db = records(),
  env: StripeEnv = event.livemode ? "live" : "sandbox",
) {
  if (event.livemode !== (env === "live")) throw new Error("Payment event environment mismatch.");
  const object = event.data.object as unknown as { id: string; customer?: string | { id: string } };
  await db.exec(
    "INSERT OR IGNORE INTO billing_events_v2(id,environment,type,customer_id,object_id,received_at) VALUES(?,?,?,?,?,?)",
    [
      event.id,
      env,
      event.type,
      idOf(object.customer) ?? null,
      object.id ?? null,
      new Date().toISOString(),
    ],
  );
  await processBillingEvent(event.id, env, db);
}
async function processBillingEvent(id: string, env: StripeEnv, db: DBClient) {
  const [event] = await db.exec<{
    type: string;
    customer_id: string | null;
    object_id: string | null;
    status: string;
    attempts: number;
  }>("SELECT * FROM billing_events_v2 WHERE id=? AND environment=?", [id, env]);
  if (!event || event.status === "processed") return;
  try {
    const stripe = createStripeClient(env);
    let customerId = event.customer_id;
    if (event.type.startsWith("charge.dispute.") || event.type === "charge.refunded") {
      const obj = event.object_id;
      if (obj) {
        const dispute = event.type.startsWith("charge.dispute.")
          ? await stripe.disputes.retrieve(obj)
          : null;
        const charge = await stripe.charges.retrieve(dispute ? (idOf(dispute.charge) ?? "") : obj);
        customerId = idOf(charge.customer) ?? null;
        const payments = await stripe.invoicePayments.list({
          payment: { type: "payment_intent", payment_intent: idOf(charge.payment_intent) ?? "" },
          limit: 100,
        });
        for (const payment of payments.data)
          await db.exec(
            "UPDATE billing_coverage SET suspended=? WHERE environment=? AND invoice_id=?",
            [
              dispute ? (dispute.status === "won" ? 0 : 1) : charge.refunded ? 1 : 0,
              env,
              idOf(payment.invoice) ?? "",
            ],
          );
      }
    }
    const [customer] = customerId
      ? await db.exec<Customer>(
          "SELECT * FROM billing_customers_v2 WHERE environment=? AND stripe_customer_id=?",
          [env, customerId],
        )
      : [];
    if (customer && !customer.deleting)
      await withBillingLock(db, customer.user_id, async () => {
        for (const sub of await allSubscriptions(stripe, customer.stripe_customer_id))
          await syncSubscription(db, customer.user_id, stripe, sub.id, env);
      });
    await db.exec(
      "UPDATE billing_events_v2 SET status='processed',processed_at=? WHERE id=? AND environment=?",
      [new Date().toISOString(), id, env],
    );
  } catch (error) {
    await db.exec(
      "UPDATE billing_events_v2 SET status=?,attempts=attempts+1,retry_at=? WHERE id=? AND environment=?",
      [
        event.attempts >= 9 ? "failed" : "pending",
        Date.now() + Math.min(3600_000, 30_000 * 2 ** event.attempts),
        id,
        env,
      ],
    );
    throw error;
  }
}
export async function reconcileBilling(env: StripeEnv, db = records(), cursor = "") {
  const events = await db.exec<{ id: string }>(
    "SELECT id FROM billing_events_v2 WHERE environment=? AND status='pending' AND retry_at<=? LIMIT 25",
    [env, Date.now()],
  );
  for (const event of events)
    try {
      await processBillingEvent(event.id, env, db);
    } catch {
      /* Durable retry timestamp already recorded. */
    }
  const customers = await db.exec<Customer>(
    "SELECT * FROM billing_customers_v2 WHERE environment=? AND deleting=0 AND user_id>? ORDER BY user_id LIMIT 20",
    [env, cursor],
  );
  const stripe = createStripeClient(env);
  for (const customer of customers)
    try {
      await withBillingLock(db, customer.user_id, async () => {
        for (const sub of await allSubscriptions(stripe, customer.stripe_customer_id))
          await syncSubscription(db, customer.user_id, stripe, sub.id, env);
      });
    } catch {
      console.warn("Billing reconciliation deferred an account.");
    }
  const [failures] = await db.exec<{ n: number }>(
    "SELECT count(*) AS n FROM billing_events_v2 WHERE environment=? AND status='failed'",
    [env],
  );
  return {
    events: events.length,
    customers: customers.length,
    failedEvents: failures?.n ?? 0,
    nextCursor: customers.length === 20 ? (customers.at(-1)?.user_id ?? null) : null,
  };
}
