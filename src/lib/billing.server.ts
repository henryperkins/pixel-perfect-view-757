import Stripe from "stripe";
import { billingConfig, type BillingConfig } from "./billing-config.server";
import { records, type DBClient } from "./d1.server";
import { appOrigin } from "./app-origin.server";
import {
  membershipAccess,
  PLANS,
  TRIAL_DAYS,
  type MembershipPlan,
  type MembershipRow,
} from "./billing-policy";

type Customer = {
  user_id: string;
  stripe_customer_id: string;
  trial_used: number;
  deleting: number;
  checkout_id: string | null;
  checkout_attempt: string | null;
  checkout_plan: string | null;
};
export async function stripeClient() {
  const key = (await billingConfig()).secretKey;
  // This release accepts test payments only, including on the published app.
  if (!key || !/^(sk|rk)_test_/.test(key))
    throw new Error("Test membership payments are not configured.");
  return new Stripe(key, {
    httpClient: Stripe.createFetchHttpClient(),
    maxNetworkRetries: 0,
    timeout: 20_000,
  });
}
function priceId(plan: MembershipPlan, config: BillingConfig) {
  const value = plan === "month" ? config.monthPriceId : config.yearPriceId;
  if (!value) throw new Error("Membership prices are not configured.");
  return value;
}
function ready(config: BillingConfig) {
  return (
    config.enabled &&
    /^(sk|rk)_test_/.test(config.secretKey) &&
    Boolean(
      config.webhookSecret &&
      config.monthPriceId &&
      config.yearPriceId &&
      config.portalConfigurationId,
    )
  );
}
async function assertReady() {
  if (!ready(await billingConfig()))
    throw new Error("Membership checkout is unavailable. Please try again later.");
}
async function customerFor(db: DBClient, userId: string) {
  return (await db.exec<Customer>("SELECT * FROM billing_customers WHERE user_id=?", [userId]))[0];
}
async function rowsFor(db: DBClient, userId: string) {
  return db.exec<MembershipRow>(
    "SELECT * FROM memberships WHERE user_id=? ORDER BY updated_at DESC",
    [userId],
  );
}

/** One lease serializes checkout, webhook refresh and deletion across workers. */
export async function withBillingLock<T>(
  db: DBClient,
  userId: string,
  operation: () => Promise<T>,
): Promise<T> {
  const token = crypto.randomUUID(),
    now = Date.now();
  const acquired = await db.exec<{ token: string }>(
    "INSERT INTO billing_locks(user_id,token,expires_at) VALUES(?,?,?) ON CONFLICT(user_id) DO UPDATE SET token=excluded.token,expires_at=excluded.expires_at WHERE billing_locks.expires_at<? RETURNING token",
    [userId, token, now + 180_000, now],
  );
  if (acquired[0]?.token !== token)
    throw new Error("A membership change is already in progress. Please try again shortly.");
  try {
    return await operation();
  } finally {
    await db.exec("DELETE FROM billing_locks WHERE user_id=? AND token=?", [userId, token]);
  }
}

export async function getMembership(userId: string, db = records()) {
  const config = await billingConfig();
  if (!config.enabled)
    return {
      enabled: false,
      checkoutReady: false,
      testMode: true,
      fullAccess: true,
      accessUntil: null,
      paidThrough: null,
      renewalPending: false,
      membership: null,
      trialEligible: true,
      hasCustomer: false,
    };
  const rows = await rowsFor(db, userId);
  const customer = await customerFor(db, userId);
  const current =
    rows.find((row) => !["canceled", "incomplete_expired"].includes(row.status)) ?? rows[0];
  return {
    enabled: true,
    checkoutReady: ready(config) && !customer?.deleting,
    testMode: true,
    ...membershipAccess(rows),
    trialEligible: !customer?.trial_used,
    hasCustomer: Boolean(customer),
    membership: current
      ? {
          status: current.status,
          plan: current.plan,
          cancelAtPeriodEnd: Boolean(current.cancel_at_period_end),
          periodEnd: new Date(current.current_period_end * 1000).toISOString(),
        }
      : null,
  };
}
export type MembershipState = Awaited<ReturnType<typeof getMembership>>;

const idOf = (value: string | { id: string } | null | undefined) =>
  typeof value === "string" ? value : value?.id;

/** Always fetch Stripe's current object while holding the lease: stale events cannot rewind access. */
async function syncSubscription(
  db: DBClient,
  userId: string,
  stripe: Stripe,
  subscriptionId: string,
) {
  const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["latest_invoice"] });
  const customer = await customerFor(db, userId);
  if (!customer || idOf(sub.customer) !== customer.stripe_customer_id || sub.livemode)
    throw new Error("Membership does not belong to this test account.");
  const item = sub.items.data[0];
  if (!item) return;
  const config = await billingConfig();
  const plan =
    item?.price.id === priceId("month", config)
      ? "month"
      : item?.price.id === priceId("year", config)
        ? "year"
        : null;
  if (!plan || sub.items.data.length !== 1 || item.quantity !== 1) return;
  const previous = (await rowsFor(db, userId)).find((r) => r.stripe_subscription_id === sub.id);
  const invoice = typeof sub.latest_invoice === "object" ? sub.latest_invoice : null;
  // Stripe moves current_period_end forward before a renewal invoice has been paid.
  const paidUntil = Math.max(
    previous?.paid_until ?? 0,
    invoice?.status === "paid" && sub.status !== "trialing" ? item.current_period_end : 0,
  );
  await db.batch([
    {
      sql: "INSERT INTO memberships(stripe_subscription_id,user_id,status,plan,current_period_end,trial_end,paid_until,cancel_at_period_end,updated_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(stripe_subscription_id) DO UPDATE SET status=excluded.status,plan=excluded.plan,current_period_end=excluded.current_period_end,trial_end=excluded.trial_end,paid_until=excluded.paid_until,cancel_at_period_end=excluded.cancel_at_period_end,updated_at=excluded.updated_at",
      params: [
        sub.id,
        userId,
        sub.status,
        plan,
        item.current_period_end,
        sub.trial_end ?? 0,
        paidUntil,
        sub.cancel_at_period_end ? 1 : 0,
        new Date().toISOString(),
      ],
    },
    {
      sql: "UPDATE billing_customers SET trial_used=MAX(trial_used,?) WHERE user_id=?",
      params: [sub.trial_start ? 1 : 0, userId],
    },
  ]);
}

async function allSubscriptions(stripe: Stripe, customerId: string) {
  const result: Stripe.Subscription[] = [];
  for await (const sub of stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 100,
  }))
    result.push(sub);
  return result;
}

/** Stripe receipts and Checkout use the customer's email, so it follows the account email. */
async function matchCustomerEmail(stripe: Stripe, customerId: string, email: string) {
  const current = await stripe.customers.retrieve(customerId);
  if (!current.deleted && current.email !== email)
    await stripe.customers.update(customerId, { email });
}

/** Called after an email change. Checkout and the portal correct any update this misses. */
export async function syncBillingEmail(userId: string, email: string, db = records()) {
  const customer = await customerFor(db, userId);
  if (!customer || customer.deleting) return;
  await matchCustomerEmail(await stripeClient(), customer.stripe_customer_id, email);
}

export async function startCheckout(
  userId: string,
  email: string,
  plan: MembershipPlan,
  db = records(),
) {
  await assertReady();
  return withBillingLock(db, userId, async () => {
    const stripe = await stripeClient();
    let customer = await customerFor(db, userId);
    if (customer?.deleting)
      throw new Error("Account deletion is in progress. Checkout is unavailable.");
    if (!customer) {
      const created = await stripe.customers.create(
        { email, metadata: { pattern_user_id: userId } },
        { idempotencyKey: `pattern-customer-${userId}` },
      );
      await db.exec("INSERT INTO billing_customers(user_id,stripe_customer_id) VALUES(?,?)", [
        userId,
        created.id,
      ]);
      customer = (await customerFor(db, userId))!;
    } else await matchCustomerEmail(stripe, customer.stripe_customer_id, email);
    const subscriptions = await allSubscriptions(stripe, customer.stripe_customer_id);
    if (subscriptions.some((s) => !["canceled", "incomplete_expired"].includes(s.status)))
      throw new Error("You already have a membership. Manage it in Context & privacy.");
    if (subscriptions.some((s) => Boolean(s.trial_start))) {
      await db.exec("UPDATE billing_customers SET trial_used=1 WHERE user_id=?", [userId]);
      customer.trial_used = 1;
    }
    if (customer.checkout_id) {
      const existing = await stripe.checkout.sessions.retrieve(customer.checkout_id);
      if (existing.status === "open" && customer.checkout_plan === plan && existing.url)
        return { url: existing.url };
      if (existing.status === "open") await stripe.checkout.sessions.expire(existing.id);
      await db.exec(
        "UPDATE billing_customers SET checkout_id=NULL,checkout_attempt=NULL WHERE user_id=?",
        [userId],
      );
      customer.checkout_attempt = null;
    }
    const price = await stripe.prices.retrieve(priceId(plan, await billingConfig()));
    if (
      price.livemode ||
      !price.active ||
      price.unit_amount !== PLANS[plan].amount ||
      price.currency !== "usd" ||
      price.recurring?.interval !== plan ||
      price.recurring.interval_count !== 1
    )
      throw new Error("Membership pricing could not be verified. Please try again later.");
    const attempt =
      customer.checkout_attempt && customer.checkout_plan === plan
        ? customer.checkout_attempt
        : crypto.randomUUID();
    await db.exec(
      "UPDATE billing_customers SET checkout_attempt=?,checkout_plan=? WHERE user_id=?",
      [attempt, plan, userId],
    );
    const session = await stripe.checkout.sessions.create(
      {
        integration_identifier: `pattern_membership_${attempt
          .replace(/-/g, "")
          .slice(0, 8)
          .split("")
          .map((letter) => String.fromCharCode(97 + parseInt(letter, 16)))
          .join("")}`,
        mode: "subscription",
        customer: customer.stripe_customer_id,
        client_reference_id: userId,
        line_items: [{ price: price.id, quantity: 1 }],
        success_url: `${appOrigin()}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appOrigin()}/plans?canceled=true`,
        payment_method_collection: "always",
        subscription_data: {
          metadata: { pattern_user_id: userId },
          ...(!customer.trial_used
            ? {
                trial_period_days: TRIAL_DAYS,
                trial_settings: { end_behavior: { missing_payment_method: "cancel" as const } },
              }
            : {}),
        },
        metadata: { pattern_user_id: userId },
      },
      { idempotencyKey: `pattern-checkout-${attempt}` },
    );
    await db.exec("UPDATE billing_customers SET checkout_id=? WHERE user_id=?", [
      session.id,
      userId,
    ]);
    if (!session.url) throw new Error("Checkout could not be opened. Please try again.");
    return { url: session.url };
  });
}

export async function membershipPortal(userId: string, email: string, db = records()) {
  await assertReady();
  const customer = await customerFor(db, userId);
  if (!customer || customer.deleting) throw new Error("There is no membership to manage.");
  const configuration = (await billingConfig()).portalConfigurationId;
  if (!configuration)
    throw new Error("Membership management is unavailable. Please try again later.");
  const stripe = await stripeClient();
  await matchCustomerEmail(stripe, customer.stripe_customer_id, email);
  return {
    url: (
      await stripe.billingPortal.sessions.create({
        customer: customer.stripe_customer_id,
        configuration,
        return_url: `${appOrigin()}/privacy`,
      })
    ).url,
  };
}

export async function cancelMembership(userId: string, db = records()) {
  await assertReady();
  await withBillingLock(db, userId, async () => {
    const customer = await customerFor(db, userId);
    if (!customer || customer.deleting) throw new Error("There is no membership to cancel.");
    const stripe = await stripeClient();
    for (const sub of await allSubscriptions(stripe, customer.stripe_customer_id)) {
      if (["canceled", "incomplete_expired"].includes(sub.status)) continue;
      await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
      await syncSubscription(db, userId, stripe, sub.id);
    }
  });
  return getMembership(userId, db);
}

/** The return page verifies ownership and refreshes Stripe; it never trusts a paid URL. */
export async function refreshMembership(userId: string, sessionId?: string, db = records()) {
  await assertReady();
  await withBillingLock(db, userId, async () => {
    const customer = await customerFor(db, userId);
    if (!customer || customer.deleting) throw new Error("No membership checkout was found.");
    const stripe = await stripeClient();
    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (
        session.livemode ||
        idOf(session.customer) !== customer.stripe_customer_id ||
        session.client_reference_id !== userId
      )
        throw new Error("This checkout belongs to another account.");
      if (
        session.status !== "complete" ||
        !["paid", "no_payment_required"].includes(session.payment_status)
      )
        return;
    }
    for (const sub of await allSubscriptions(stripe, customer.stripe_customer_id))
      await syncSubscription(db, userId, stripe, sub.id);
  });
  return getMembership(userId, db);
}

/** Deletion is blocked until all outstanding checkout sessions and subscriptions are stopped. */
export async function prepareBillingDeletion(userId: string, db = records()) {
  const customer = await customerFor(db, userId);
  if (!customer) return;
  const stripe = await stripeClient();
  await db.exec("UPDATE billing_customers SET deleting=1 WHERE user_id=?", [userId]);
  for await (const session of stripe.checkout.sessions.list({
    customer: customer.stripe_customer_id,
    status: "open",
    limit: 100,
  }))
    await stripe.checkout.sessions.expire(session.id);
  for (const sub of await allSubscriptions(stripe, customer.stripe_customer_id)) {
    if (!["canceled", "incomplete_expired"].includes(sub.status))
      await stripe.subscriptions.cancel(sub.id, { invoice_now: false, prorate: false });
  }
}

export async function handleBillingEvent(event: Stripe.Event, db = records()) {
  await assertReady();
  if (event.livemode) throw new Error("Live payments are not enabled.");
  if ((await db.exec("SELECT id FROM billing_events WHERE id=?", [event.id])).length) return;
  const relevant =
    event.type.startsWith("customer.subscription.") ||
    [
      "invoice.paid",
      "invoice.payment_failed",
      "invoice.payment_action_required",
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
    ].includes(event.type);
  if (!relevant) return;
  const object = event.data.object as unknown as {
    customer?: string | { id: string };
    payment_status?: string;
  };
  if (
    event.type.startsWith("checkout.session.") &&
    !["paid", "no_payment_required"].includes(object.payment_status ?? "")
  )
    return;
  const customerId = idOf(object.customer);
  if (!customerId) return;
  const customer = (
    await db.exec<Customer>("SELECT * FROM billing_customers WHERE stripe_customer_id=?", [
      customerId,
    ])
  )[0];
  // Deleted accounts are never recreated by delayed Stripe events.
  if (!customer) return;
  await withBillingLock(db, customer.user_id, async () => {
    const stripe = await stripeClient();
    if (!customer.deleting)
      for (const sub of await allSubscriptions(stripe, customerId))
        await syncSubscription(db, customer.user_id, stripe, sub.id);
    await db.exec("INSERT OR IGNORE INTO billing_events(id,processed_at) VALUES(?,?)", [
      event.id,
      new Date().toISOString(),
    ]);
  });
}
