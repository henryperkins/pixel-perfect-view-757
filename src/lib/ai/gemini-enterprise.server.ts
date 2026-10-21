/** Server-only project binding for the Gemini Enterprise key. Not imported by reader UI. */
export const GEMINI_ENTERPRISE_PROJECT = "river-bruin-511100-g8";

/**
 * The project-scoped global endpoint. The project-less express URL resolves to
 * us-central1, which does not serve gemini-4-argon.
 */
export function geminiEnterpriseURL(model: string): string {
  return `https://aiplatform.googleapis.com/v1/projects/${GEMINI_ENTERPRISE_PROJECT}/locations/global/publishers/google/models/${model}:generateContent`;
}
