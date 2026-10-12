import data from "test-data";
import { verifyAssistantIdentity } from "../../../src/lib/assistant.server.ts";

Object.assign(process.env, {
  SUPABASE_PROJECT_ID: "assistant-fixture",
  SUPABASE_URL: "https://assistant-fixture.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "synthetic-runtime-publishable-key",
});

export default {
  async test() {
    const identity = await verifyAssistantIdentity(data.token);
    if (identity.subject !== "runtime-member") throw Error("Valid identity was rejected");
    console.log("PASS: direct assistant identity verifies in native workerd");
    for (const status of [301, 302, 303, 307, 308]) {
      process.env.SUPABASE_URL = `https://assistant-fixture.supabase.co/redirect/${status}`;
      let rejected = false;
      try {
        await verifyAssistantIdentity(data.token);
      } catch (error) {
        rejected = /expired|authorization request/.test(error.message);
      }
      if (!rejected) throw Error(`Redirect ${status} did not fail closed`);
    }
    const diagnostics = await (
      await fetch("https://assistant-fixture.supabase.co/diagnostics")
    ).json();
    if (diagnostics.forwarded !== 0) throw Error("Credentials followed a provider redirect");
    console.log("PASS: five provider redirect statuses rejected without forwarding credentials");
  },
};
