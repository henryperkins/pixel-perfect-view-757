// Synthetic browser fixture only. No request goes to a live records or auth service.
const key = "pattern-assistant-ui-fixture";
const initial = {
  signedIn: true,
  linked: true,
  enabled: true,
  granted: false,
  error: "",
  scopes: ["today", "pattern"],
  member: true,
};
const state = () => ({ ...initial, ...JSON.parse(localStorage.getItem(key) ?? "{}") });
function save(patch: object) {
  localStorage.setItem(key, JSON.stringify({ ...state(), ...patch }));
}
Object.assign(window, {
  assistantFixture: {
    reset: (patch = {}) => localStorage.setItem(key, JSON.stringify({ ...initial, ...patch })),
    state,
    save,
  },
});
const session = () =>
  state().signedIn
    ? {
        access_token: "synthetic-direct-access-token",
        user: { id: "assistant-test", email: "assistant@example.invalid" },
      }
    : null;
let listener: ((event: string, value: unknown) => void) | undefined;
const success = async () => ({ error: null });
const login = async () => {
  save({ signedIn: true });
  listener?.("SIGNED_IN", session());
  return { error: null };
};
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: session() }, error: null }),
    onAuthStateChange: (fn: typeof listener) => {
      listener = fn;
      return {
        data: {
          subscription: {
            unsubscribe: () => {
              listener = undefined;
            },
          },
        },
      };
    },
    signOut: async () => {
      save({ signedIn: false });
      listener?.("SIGNED_OUT", null);
      return { error: null };
    },
    signInWithPassword: login,
    signUp: success,
    resetPasswordForEmail: success,
    updateUser: success,
  },
};
export const lovable = {
  auth: {
    signInWithOAuth: async () => {
      await login();
      return { redirected: false, error: null };
    },
  },
};
const check = () => {
  if (state().error) throw new Error(state().error);
};
export const currentSession = async () => ({
  session: state().member ? { userId: "member-test", email: "member@example.invalid" } : null,
});
export const signIn = async () => {
  save({ member: true });
  return { ok: true };
};
export const signUp = signIn;
export const signOut = async () => {
  save({ member: false });
};
export const fetchAssistantAccess = async () => {
  check();
  return {
    enabled: state().enabled,
    link: state().linked ? { email: "assistant@example.invalid", linkedAt: "2026-10-12" } : null,
    grants: state().granted
      ? [
          {
            clientId: "client-test",
            clientName: "Example assistant",
            scopes: state().scopes,
            createdAt: "2026-10-12",
          },
        ]
      : [],
  };
};
export const linkAssistantIdentity = async () => {
  check();
  save({ linked: true });
};
export const unlinkAssistantIdentity = async () => {
  check();
  save({ linked: false, granted: false });
};
export const revokeAssistantGrant = async () => {
  check();
  save({ granted: false });
};
export const fetchAssistantAuthorization = async ({
  data,
}: {
  data: { authorizationId: string };
}) => {
  check();
  if (data.authorizationId === "expired") throw new Error("Expired request");
  return {
    kind: "consent",
    linked: state().linked,
    email: "assistant@example.invalid",
    clientName: "Example assistant",
    clientId: "client-test",
    redirectOrigin: window.location.origin,
  };
};
export const decideAssistantAuthorization = async ({
  data,
}: {
  data: { action: string; scopes: string[] };
}) => {
  check();
  save({ granted: data.action === "approve", scopes: data.scopes });
  localStorage.setItem("assistant-decision", JSON.stringify(data));
  return { redirectUrl: `${window.location.origin}/fixture-callback?decision=${data.action}` };
};
export const fetchBootstrap = async () => ({ consents: [], profile: {}, hasChart: true });
export const fetchJournal = async () => ({ events: [], checkIns: [], feedback: [] });
export const addEvent = success,
  eraseData = success,
  exportData = success,
  savePrefs = success,
  updateConsent = success;

export const useServerFn = (fn: unknown) => fn;
