/** Narrow source-copy checks; ordinary house, space, energy and process remain valid. */
export function dailyMentionsRisingAngle(text: string) {
  return (
    /\brising\s+(?:sign|placement|ruler|degree|cusp)\b|\b(?:natal|birth|chart)\s+rising\b|\b(?:your|the|my|our|their|its)\s+rising(?:['’]s\b|\s*(?:[.,;:!?—–]|$)|\s+(?:is|was|can|could|may|might|would|will|does|has|adds?|shapes?|describes?|defines?|sets?|reflects?|suggests?|indicates?|represents?|influences?|affects?|means?|speaks?)\b)/i.test(
      text,
    ) ||
    /\brising\s+(?:and|or)\s+(?:(?:your|the|natal)\s+)?(?:sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|node|ascendant|midheaven)\b/i.test(
      text,
    )
  );
}
export function dailyWritingReferenceClaim(text: string) {
  const signs =
    "aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces";
  const bodies = "sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto";
  const ordinal =
    "\\d{1,2}(?:st|nd|rd|th)?|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|eleventh|twelfth";
  return (
    new RegExp(`\\b(?:${ordinal})\\s+house\\b|\\bhouse\\s+(?:${ordinal})\\b`, "i").test(text) ||
    new RegExp(
      `\\b(?:${signs})\\s+(?:rising|sun|moon|ascendant)\\b|\\b(?:${bodies})\\s+(?:(?:is|was|lies|sits)\\s+(?:currently\\s+)?)?(?:in|through|occupies)\\s+(?:your\\s+)?(?:${signs})\\b`,
      "i",
    ).test(text) ||
    /\b(?:ascendant|midheaven|descendant|imum coeli|rising sign)\b/i.test(text) ||
    dailyMentionsRisingAngle(text) ||
    new RegExp(
      `\\b(?:${bodies})(?:['’]s)?\\s+(?:(?:forms?|makes?|is|was|has|in)\\s+)?(?:an?\\s+)?(?:conjunction|sextile|square|trine|opposition|quincunx)\\b`,
      "i",
    ).test(text) ||
    /\b(?:current|calculated|measured|natal)\s+orb\b|\borb\s+(?:of|is|measures|at)\b/i.test(text) ||
    /\b\d{4}-\d{2}-\d{2}\b|\b\d+(?:\.\d+)?\s*(?:degrees?\b|°)/i.test(text)
  );
}
