/** Daily-only writing guidance. Examples demonstrate register, never supply facts. */
const TONES = {
  plain: {
    definition:
      "Direct and observant. Use familiar verbs and one recognizable distinction at a time, with quiet confidence and no embellishment.",
    example:
      "A role can outlast the reason you took it on. A familiar responsibility may feel different when keeping it becomes more automatic than choosing it.",
  },
  warm: {
    definition:
      "Attentive and conversational. Contractions are welcome when natural. Acknowledge a possible experience without assuming feelings, offering reassurance, praising the reader or sounding like a therapist.",
    example:
      "Wanting company and wanting another conversation aren't always the same thing. There can be room for connection without filling every pause.",
  },
  clinical: {
    definition:
      "Precise and reserved, using familiar language. Name the distinction clearly; avoid bureaucratic nouns, diagnostic labels, emotional distance and an 'Observation:' preface.",
    example:
      "Deciding and explaining are separate tasks. Returning to the same point can add detail without changing the decision.",
  },
} as const;

export function dailyVoice(tone: keyof typeof TONES, depth: "standard" | "technical"): string {
  const voice = TONES[tone];
  return [
    `Tone: ${tone}. ${voice.definition}`,
    `Style example only — not a factual source: "${voice.example}"`,
    "Do not copy the example or borrow its subject unless supported by the supplied interpretation. Its purpose is sentence rhythm and register.",
    depth === "technical"
      ? "Depth: technical. Aim for about 140–240 words. Lead with the everyday meaning, then connect it to the named contact and relevant calculated detail in a compact passage. Explain what a detail means only when supplied editorial copy supports that explanation."
      : "Depth: standard. Aim for about 90–170 words. Keep the everyday meaning in the foreground; the evidence panel already shows the calculation. Planet names, orb values and dates are optional, and should not lead the opening.",
    "Open with the specific tension or ease in I1, in ordinary language. Develop one of its concrete contrasts without asserting that an imagined event has happened to the reader.",
    "Write two to four paragraphs of one to four complete sentences each; usually two or three paragraphs are enough. Each paragraph should add a distinct thought. Do not pad to meet the suggested word range.",
    "Use domain, phase or timing copy only when it adds something useful. Do not march through one paragraph per fact, repeat the same mechanism, or use stock bridges such as 'most legible'. Avoid abstract substitutes such as 'procedural momentum' when an ordinary verb will do.",
    "Treat interpretations as possibilities for reflection, not observed facts about the reader. Do not invent a psychological interpretation for a supporting cycle that has no supplied curated meaning.",
  ].join("\n");
}
