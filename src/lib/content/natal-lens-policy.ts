/** Bounded lexical checks, not psychological verification or editorial approval. */
export function natalLensWordingProblem(text: string): "certainty" | "clinical" | null {
  if (
    /\b(?:your|the reader['’]s)\s+(?:nervous system|attachment style|trauma response|biological wiring)\b|\b(?:diagnosis|diagnosed|neurologically|hardwired)\b/i.test(
      text,
    )
  )
    return "clinical";
  if (
    /\byou\s+(?:always|never|are fundamentally)\b|\byour\s+(?:innate nature|true nature|fixed personality)\b|\b(?:verified temperament|proven character)\b/i.test(
      text,
    )
  )
    return "certainty";
  return null;
}

/** Natal mechanisms must not disclose their selectors or introduce technical claims. */
export function natalMechanismHasTechnicalClaim(text: string): boolean {
  return /\b(?:aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces|sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|houses?|cusps?|ascendant|midheaven|natal|trine|sextile|square|conjunction|opposition|quincunx|orb|degrees?)\b|\d|°/i.test(
    text,
  );
}
