/** Daily-only writing guidance. Examples demonstrate register, never supply facts. */
const TONES = {
  plain: {
    definition:
      "Direct and observant. Use familiar verbs and one concrete distinction at a time. Sound matter-of-fact, with quiet confidence and no ceremonial lead-in or embellishment.",
    example:
      "A point can be clear before the words for it are. Another sentence may add useful detail, or simply say the same thing again.",
  },
  warm: {
    definition:
      "Attentive and conversational. Use natural direct address and an occasional contraction. Give the reader room to recognize a supplied possibility without assuming feelings, offering reassurance, praising them or sounding like a therapist. Warmth comes from the phrasing, not extra emotional claims.",
    example:
      "You might know the point you're trying to make before the words quite fit. It can take a moment to find a sentence that feels accurate.",
  },
  clinical: {
    definition:
      "Precise and reserved, using familiar words and active verbs. Name the distinction clearly and speak to the reader as 'you'. Say 'which part of the task is yours', not 'direct ownership of an output'. Reserve does not require jargon, diagnostic labels, a third-person case study or an 'Observation:' preface.",
    example:
      "Knowing a point and wording it are distinct tasks. A revision can improve precision without changing what the sentence says.",
  },
} as const;

export function dailyVoice(tone: keyof typeof TONES, depth: "standard" | "technical"): string {
  const voice = TONES[tone];
  return [
    `Tone: ${tone}. ${voice.definition}`,
    `Style example only — not a factual source: "${voice.example}"`,
    "Do not copy the example or borrow its subject unless supported by the supplied interpretation. Its purpose is sentence rhythm and register; example content never supplies a reading fact.",
    depth === "technical"
      ? "Depth: technical. Aim for about 140–240 words. Lead with the everyday meaning, then connect it to the named contact and relevant calculated detail in a compact passage. Explain what a detail means only when supplied editorial copy supports that explanation."
      : "Depth: standard. Aim for about 90–170 words. Keep the everyday meaning in the foreground; the evidence panel already shows the calculation. Planet names, orb values and dates are optional, and should not lead the opening.",
    "Open from a specific contrast or concrete detail in I1, in ordinary language. Do not use its first sentence as an automatic lead. A published sentence can be retained when it says the point most clearly; otherwise compose the opening from another supported detail rather than swapping adjectives for decorative variety.",
    "Write two to four paragraphs of one to four complete sentences each; usually two or three paragraphs are enough. Each paragraph should add a distinct thought. Do not pad to meet the suggested word range.",
    "Use domain, phase or timing copy only when it adds a distinct, useful thought. Calendar phase describes the calculated contact, not the reader's feelings. Do not add a phase paragraph merely to say that something is building, settling or mostly anticipation. End when the meaningful contrast is complete, without a recap or stock bridge such as 'most legible'.",
    "Keep everyday scenes conditional and supported by the supplied copy. A scene offers a comparison; it does not establish that an event happened, a preference changed or a moment of hesitation made something clear. Use one natural qualification when needed, rather than stacking may, might and could.",
    "Treat the interpretation as a frame for reflection, not a force that causes behavior or a confirmed personal state. Prefer 'offers a way to read' or 'frames' to claims that a planet makes the reader feel, act or recover. Do not invent a psychological interpretation for a supporting cycle that has no supplied curated meaning.",
  ].join("\n");
}
