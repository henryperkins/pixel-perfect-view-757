import { analyticEpisode } from "@/lib/ai/reading-evaluation.transit.fixtures.mjs";
import { composeDailyGuidance } from "@/lib/daily-guidance";
const day = new Date().toISOString().slice(0, 10);
const state = {
  ownerId: "mobile-audit-member",
  day,
  dropResponse: [],
  member: !location.search.includes("visitor=1"),
  assistantSession: null as {
    access_token: string;
    user: { id: string; email: string };
  } | null,
  admin: false,
  overrides: {} as Record<string, unknown>,
  responses: {} as Record<string, unknown[]>,
  delay: 0,
  hold: [] as string[],
  upcomingResponses: null as Record<string, unknown> | null,
  upcomingActive: 0,
  upcomingMaximumActive: 0,
  upcomingSignals: [] as (AbortSignal | undefined)[],
  fail: [],
  events: [
    {
      id: "entry-1",
      label: "A walk after work",
      body: "I took a different route home and had time to think.",
      occurred_on: day,
      domain: "general",
      cycle_key: null,
      feature_key: null,
      revision: 1,
    },
  ],
  calls: [],
  wellness: {
    mood: null,
    energy: null,
    sleep: null,
    stress: null,
    note: null,
    savedAt: null,
    sleepEnabled: false,
    stressEnabled: false,
    retentionDays: 90,
  },
  longText: false,
};
let stored: string | null = null;
try {
  stored = sessionStorage.getItem("synthetic-server-state");
} catch {
  /* Fault fixture: storage may be blocked. */
}
if (stored) Object.assign(state, JSON.parse(stored));
// Local browser checks can select loading, empty, unavailable and administrator states.
Object.assign(state, (window as unknown as { interfaceFixture?: object }).interfaceFixture);
const persist = () => {
  try {
    sessionStorage.setItem(
      "synthetic-server-state",
      JSON.stringify({ wellness: state.wellness, events: state.events }),
    );
  } catch {
    /* Fault fixture: server remains in memory. */
  }
};
const heldCalls: { name: string; resolve: () => void }[] = [];
const ephemeris = {
  engine: "Swiss fixture",
  precision: "high",
  degraded: false,
  degradedReason: null,
  transitEngine: "kepler-approx@fixture",
};
const uncertainty = {
  accuracy: "unknown",
  housesReliable: false,
  angleClaimsSuppressed: true,
  ascendantSpreadDeg: 360,
  moonSpreadDeg: 14,
};
const features = [
  {
    feature_key: "sun_aries",
    title: "Sun in Aries",
    family: "luminary",
    strength: 0.9,
    payload: { sign: "Aries", degree: 5 },
    summary: "A clear starting point",
  },
  {
    feature_key: "moon_square_saturn",
    title: "Moon square Saturn",
    family: "aspect",
    strength: 0.7,
    payload: { a: "moon", b: "saturn", orb: 2 },
    summary: "Space for a quieter response",
  },
];
const pattern = {
  needsOnboarding: false,
  narrativeCacheKey: "fixture",
  features,
  ephemeris,
  uncertainty,
  engine: "Swiss fixture",
  houseSystem: "Placidus",
  rising: null,
  snapshot: { birth: null },
  placements: [],
  allAspects: [{ a: "sun", b: "moon", aspect: "square", orb: 1.2 }],
  houseCusps: [],
  computedAt: day + "T12:00:00Z",
  fingerprint: "synthetic",
};
const PRECISE_BODIES = [
  ["sun", "Sun", 84],
  ["moon", "Moon", 210],
  ["mercury", "Mercury", 70],
  ["venus", "Venus", 100],
  ["mars", "Mars", 200],
  ["jupiter", "Jupiter", 150],
  ["saturn", "Saturn", 280],
  ["uranus", "Uranus", 275],
  ["neptune", "Neptune", 290],
  ["pluto", "Pluto", 196],
];
function precisePattern() {
  return {
    ...pattern,
    engine: "swiss-ephemeris@2.10.3-7",
    houseSystem: "placidus",
    uncertainty: {
      accuracy: "exact",
      minutes: 2,
      housesReliable: true,
      angleClaimsSuppressed: false,
      ascendantSpreadDeg: 0.5,
      moonSpreadDeg: 0.1,
    },
    sources: {
      positions: "service",
      houses: "service",
      angles: "service",
      latitude: 48.8566,
      longitude: 2.3522,
      utcISO: "1990-06-15T14:30:00.000Z",
    },
    placements: PRECISE_BODIES.map(([key, label, lon]) => ({
      key,
      label,
      lon,
      position: `${lon}°`,
      house: 1,
      retrograde: false,
      angleDependent: false,
    })),
    snapshot: {
      birth: {
        birthDate: "1990-06-15",
        birthTime: "16:30",
        placeLabel: "Paris, France",
        latitude: 48.8566,
        longitude: 2.3522,
        accuracy: "exact",
        timezone: "Europe/Paris",
        updated_at: "2026-10-01T12:00:00Z",
      },
    },
  };
}
const cycles = [analyticEpisode().primary];
const today = () => ({
  needsOnboarding: false,
  day: state.day,
  timezone: "UTC",
  cycles,
  reading: {
    id: "reading-1",
    headline: "Leave room for an unhurried answer",
    paragraphs: [
      "You may want to settle a decision quickly today. Give the question a little room before you commit.",
      "One clear conversation can make the next step easier. Write down what you want to ask, then choose a time when you can both listen.",
    ],
    prompt: "Which conversation would benefit from a little more time?",
    primary_cycle_key: null,
    confidence: "moderate",
    release_version: "fixture",
  },
  ephemeris,
  uncertainty,
  wellness: state.wellness,
  localContext: {
    markedMoments: true,
    guidance: composeDailyGuidance({
      day: state.day,
      now: new Date(state.day + "T12:00:00Z"),
      timezone: "UTC",
      granted: new Set(),
      primary: cycles[0],
      source: { key: "hard:saturn:*", releaseVersion: "fixture", themes: ["structure"] },
      checkIn: null,
      preferredDomain: null,
    }),
  },
  feedback: null,
  provenance: [],
  language: { mode: "template" },
});
async function call(name, args) {
  state.calls.push({
    name,
    args: structuredClone(args?.signal ? { ...args, signal: undefined } : args),
    at: Date.now(),
  });
  if (state.hold.includes(name))
    await new Promise<void>((resolve) => heldCalls.push({ name, resolve }));
  const wait = state.delay;
  if (wait) await new Promise((r) => setTimeout(r, wait));
  if (state.fail.includes(name)) throw new Error("Synthetic network failure");
  if (Object.hasOwn(state.overrides, name)) return structuredClone(state.overrides[name]);
  const queued = state.responses[name];
  if (queued?.length) return structuredClone(queued.shift());
  switch (name) {
    case "currentSession":
      return {
        session: state.member
          ? { userId: state.ownerId, email: "member@example.invalid", isAdmin: state.admin }
          : null,
      };
    case "signOut":
      state.member = false;
      return { ok: true };
    case "signIn":
    case "signUp":
      state.member = true;
      return { ok: true };
    case "fetchToday":
      return today();
    case "fetchPattern":
      return typeof location !== "undefined" &&
        new URLSearchParams(location.search).get("chart") === "precise"
        ? precisePattern()
        : pattern;
    case "fetchJournal":
      return { events: structuredClone(state.events), checkIns: [], feedback: [] };
    case "fetchReadingJournal":
      return { enabled: true, entries: structuredClone(state.events) };
    case "fetchBootstrap":
      return {
        consents: [
          ...(state.wellness.sleepEnabled ? [{ source_id: "WEL01", granted: true }] : []),
          ...(state.wellness.stressEnabled ? [{ source_id: "WEL03", granted: true }] : []),
        ],
        profile: { display_name: "Alex", tone: "plain", depth: "standard", domain_pref: null },
        hasChart: true,
      };
    case "fetchMembership":
      return {
        enabled: true,
        fullAccess: true,
        hasCustomer: true,
        checkoutReady: true,
        trialEligible: false,
        accessUntil: "2027-01-01T00:00:00Z",
        membership: { status: "active", cancelAtPeriodEnd: false },
      };
    case "fetchAssistantAccess":
      return { enabled: true, link: null, grants: [] };
    case "fetchAccountSecurity":
      return { email: "member@example.invalid", confirmed: true };
    case "fetchEmailDelivery":
      return { deliveries: [] };
    case "fetchCycles":
      return {
        ...today(),
        engine: "Swiss fixture",
        contractVersion: "fixture",
        referenceAt: day + "T12:00:00Z",
        computedAt: day + "T12:00:00Z",
        preferredDomain: null,
      };
    case "fetchUpcomingCycles":
      if (state.upcomingResponses)
        return structuredClone(
          state.upcomingResponses[args.data.domain + "/" + args.data.duration],
        );
      return {
        needsOnboarding: false,
        calculation: { status: "unavailable", reason: "Synthetic empty state" },
        timezone: "UTC",
      };
    case "fetchSkyEvents":
      return {
        calculation: { status: "unavailable", reason: "Synthetic empty state" },
        timezone: "UTC",
      };
    case "fetchFeatureNarrative":
      return {
        available: true,
        cacheKey: "fixture",
        paragraphs: [
          "You may feel ready to begin before every detail is settled. Make room for one small step, and notice what it teaches you.",
          "Your response can be both direct and considerate. Leave space for someone else to find their words.",
        ],
        reflectionQuestion: "Where could you make room for a slower answer?",
        facts: [],
        citations: [],
        evidenceAvailable: false,
        model: null,
      };
    case "fetchBirthRecord":
      return {
        birthDate: "1990-04-12",
        birthTime: "12:30",
        accuracy: "exact",
        placeLabel: "Paris, France",
        latitude: 48.85,
        longitude: 2.35,
        timezone: "Europe/Paris",
        revision: "synthetic-birth-1",
        fingerprint: "synthetic",
        created_at: "2026-10-01T12:00:00Z",
        updated_at: "2026-10-01T12:00:00Z",
        utcISO: "1990-04-12T10:30:00Z",
      };
    case "addEvent": {
      const id = args.data.clientMutationId ?? crypto.randomUUID();
      const prior = state.events.find((e) => e.id === id);
      if (!prior)
        state.events.push({
          id,
          label: args.data.label,
          body: args.data.body,
          domain: args.data.domain,
          occurred_on: args.data.occurredOn,
          cycle_key: args.data.cycleKey ?? null,
          feature_key: args.data.featureKey ?? null,
          revision: 0,
        });
      persist();
      if (state.dropResponse.includes(name)) throw new Error("Synthetic lost acknowledgement");
      return {
        ok: true,
        id,
        entry: structuredClone(state.events.find((e) => e.id === id)),
        replayed: Boolean(prior),
      };
    }
    case "fetchJournalSubmission": {
      const entry = state.events.find((e) => e.id === args.data.clientMutationId);
      return entry ? { state: "saved", entry: structuredClone(entry) } : { state: "missing" };
    }
    case "editEvent": {
      const old = state.events.find((e) => e.id === args.data.id);
      if (!old || old.revision !== args.data.expectedRevision)
        throw new Error(
          "This entry changed in another tab. Compare the latest entry before saving your draft.",
        );
      state.events = state.events.map((e) =>
        e.id === args.data.id
          ? { ...e, label: args.data.label, body: args.data.body, revision: e.revision + 1 }
          : e,
      );
      persist();
      if (state.dropResponse.includes(name)) throw new Error("Synthetic lost acknowledgement");
      return { id: old.id, revision: old.revision + 1 };
    }
    case "removeEvent":
      state.events = state.events.filter((e) => e.id !== args.data.id);
      persist();
      return { ok: true };
    case "saveDailyCheckIn":
      state.wellness = { ...state.wellness, ...args.data, savedAt: new Date().toISOString() };
      persist();
      if (state.dropResponse.includes(name)) throw new Error("Synthetic lost acknowledgement");
      return { checkIn: state.wellness };
    case "sendFeedback":
      return { feedback: { resonance: args.data.resonance } };
    default:
      return { ok: true };
  }
}
Object.assign(window, {
  mobileAudit: {
    state,
    today,
    pattern,
    resetCalls: () => (state.calls = []),
    releaseNext: (name: string) => {
      const index = heldCalls.findIndex((call) => call.name === name);
      if (index !== -1) heldCalls.splice(index, 1)[0]!.resolve();
    },
  },
});
export const useServerFn = (fn) => fn;
export const useAssistantSession = () => ({
  session: state.assistantSession,
  loading: false,
  error: "",
  recovery: false,
});
export const createIsomorphicFn = () => {
  const o = { server: () => o, client: (fn) => fn };
  return o;
};
export const activateContentRelease = (args) => call("activateContentRelease", args);
export const addEvent = (args) => call("addEvent", args);
export const approveContentDraftReview = (args) => call("approveContentDraftReview", args);
export const cancelMembership = (args) => call("cancelMembership", args);
export const changeMembership = (args) => call("changeMembership", args);
export function unwrapBilling(value) {
  if (value && typeof value === "object" && "error" in value)
    throw Object.assign(new Error(String(value.error)), { retryable: value.retryable === true });
  return value;
}
export const retryBillingContention = (failureCount, error) =>
  failureCount < 2 && error instanceof Error && error.retryable === true;
export const changeEmail = (args) => call("changeEmail", args);
export const changePassword = (args) => call("changePassword", args);
export const clearCurrentLocation = (args) => call("clearCurrentLocation", args);
export const confirmEmail = (args) => call("confirmEmail", args);
export const decideAssistantAuthorization = (args) => call("decideAssistantAuthorization", args);
export const deleteAccount = (args) => call("deleteAccount", args);
export const discardContentDraft = (args) => call("discardContentDraft", args);
export const draftContentRelease = (args) => call("draftContentRelease", args);
export const editContentDraft = (args) => call("editContentDraft", args);
export const editEvent = (args) => call("editEvent", args);
export const exportData = (args) => call("exportData", args);
export const fetchAccountSecurity = (args) => call("fetchAccountSecurity", args);
export const fetchAssistantAccess = (args) => call("fetchAssistantAccess", args);
export const fetchAssistantAuthorization = (args) => call("fetchAssistantAuthorization", args);
export const fetchBirthRecord = (args) => call("fetchBirthRecord", args);
export const fetchBootstrap = (args) => call("fetchBootstrap", args);
export const fetchCoarseLocation = (args) => call("fetchCoarseLocation", args);
export const fetchContentDrafts = (args) => call("fetchContentDrafts", args);
export const fetchCycles = (args) => call("fetchCycles", args);
export const fetchDraftComparison = (args) => call("fetchDraftComparison", args);
export const fetchEdgePlane = (args) => call("fetchEdgePlane", args);
export const fetchEmailDelivery = (args) => call("fetchEmailDelivery", args);
export const fetchFeatureNarrative = (args) => call("fetchFeatureNarrative", args);
export const fetchJournal = (args) => call("fetchJournal", args);
export const fetchLanguageProviders = (args) => call("fetchLanguageProviders", args);
export const fetchMembership = (args) => call("fetchMembership", args);
export const fetchPattern = (args) => call("fetchPattern", args);
export const fetchReadingEvaluationRun = (args) => call("fetchReadingEvaluationRun", args);
export const fetchReadingJournal = (args) => call("fetchReadingJournal", args);
export const fetchReadingQuality = (args) => call("fetchReadingQuality", args);
export const fetchReleases = (args) => call("fetchReleases", args);
export const fetchRememberedAssistantGrants = (args) =>
  call("fetchRememberedAssistantGrants", args);
export const fetchSkyEvents = (args) => call("fetchSkyEvents", args);
export const fetchToday = (args) => call("fetchToday", args);
export const fetchUpcomingCycles = async (args) => {
  state.upcomingActive++;
  state.upcomingSignals.push(args.signal);
  state.upcomingMaximumActive = Math.max(state.upcomingMaximumActive, state.upcomingActive);
  try {
    return await call("fetchUpcomingCycles", args);
  } finally {
    state.upcomingActive--;
  }
};
export const linkAssistantIdentity = (args) => call("linkAssistantIdentity", args);
export const openMembershipPortal = (args) => call("openMembershipPortal", args);
export const previewReadingEvaluationPlan = (args) => call("previewReadingEvaluationPlan", args);
export const publishContentDraft = (args) => call("publishContentDraft", args);
export const rebaseContentDraft = (args) => call("rebaseContentDraft", args);
export const reconcileContentPublication = (args) => call("reconcileContentPublication", args);
export const refreshMembership = (args) => call("refreshMembership", args);
export const removeEvent = (args) => call("removeEvent", args);
export const requestPasswordReset = (args) => call("requestPasswordReset", args);
export const resetPassword = (args) => call("resetPassword", args);
export const resetPersonalization = (args) => call("resetPersonalization", args);
export const resetRememberedAssistantGrant = (args) => call("resetRememberedAssistantGrant", args);
export const revokeAssistantGrant = (args) => call("revokeAssistantGrant", args);
export const runReadingEvaluationCase = (args) => call("runReadingEvaluationCase", args);
export const saveBirthProfile = (args) => call("saveBirthProfile", args);
export const saveCurrentLocation = (args) => call("saveCurrentLocation", args);
export const saveDailyCheckIn = (args) => call("saveDailyCheckIn", args);
export const savePrefs = (args) => call("savePrefs", args);
export const sendConfirmation = (args) => call("sendConfirmation", args);
export const sendFeedback = (args) => call("sendFeedback", args);
export const startCheckout = (args) => call("startCheckout", args);
export const startReadingEvaluationRun = (args) => call("startReadingEvaluationRun", args);
export const stopReadingEvaluationRun = (args) => call("stopReadingEvaluationRun", args);
export const triggerEdgeRun = (args) => call("triggerEdgeRun", args);
export const unlinkAssistantIdentity = (args) => call("unlinkAssistantIdentity", args);
export const updateConsent = (args) => call("updateConsent", args);
export const currentSession = (args) => call("currentSession", args);
export const signIn = (args) => call("signIn", args);
export const signUp = (args) => call("signUp", args);
export const signOut = (args) => call("signOut", args);
export const signOutAll = (args) => call("signOutAll", args);
export const fetchJournalSubmission = (args) => call("fetchJournalSubmission", args);
