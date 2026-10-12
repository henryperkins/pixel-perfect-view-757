/** Client-safe re-exports of the auth RPCs plus the session shape. */
export { signIn, signUp, signOut, currentSession } from "./auth.functions";

export type SessionShape = { userId: string; email: string; isAdmin?: boolean } | null;
