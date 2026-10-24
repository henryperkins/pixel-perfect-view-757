/**
 * Editorial copy for the relocation map. Interpretive tradition, not chart
 * data: every line is presented as "traditionally" or "astrologers read".
 */
import type { AngleKind } from "./astrocartography";

export const PLANET_THEME: Record<string, string> = {
  sun: "vitality, confidence and being recognised for who you are",
  moon: "comfort, belonging and emotional ease",
  mercury: "learning, conversation, writing and quick connections",
  venus: "affection, pleasure, beauty and easy social warmth",
  mars: "drive, courage, competition and friction",
  jupiter: "growth, opportunity, generosity and optimism",
  saturn: "discipline, responsibility, long effort and tests of patience",
  uranus: "sudden change, independence and the unexpected",
  neptune: "imagination, spirituality, idealism and blurred edges",
  pluto: "intensity, transformation and questions of power",
};

/** Where each angle's line plays out, with its verb in singular and plural form. */
const ANGLE_SCENE: Record<AngleKind, [one: string, many: string, scene: string]> = {
  MC: ["shows up", "show up", "in your public life — career, ambitions and how strangers see you."],
  IC: ["settles", "settle", "into your private life — home, family, roots and what restores you."],
  AC: ["colours", "colour", "your body and presence — how you feel, act and first come across."],
  DC: ["arrives", "arrive", "through other people — partners, close collaborators and rivals."],
};

function lens(angle: AngleKind, plural: boolean): string {
  const [one, many, scene] = ANGLE_SCENE[angle];
  return `${plural ? many : one} ${scene}`;
}

/** Singular lens, for "A planet here …". */
export const ANGLE_LENS: Record<AngleKind, string> = {
  MC: lens("MC", false),
  IC: lens("IC", false),
  AC: lens("AC", false),
  DC: lens("DC", false),
};

export function lineReading(bodyKey: string, bodyLabel: string, angle: AngleKind): string {
  const theme = PLANET_THEME[bodyKey];
  // The verb agrees with "themes", not with the planet.
  return theme
    ? `${bodyLabel}’s themes of ${theme} ${lens(angle, true)}`
    : `${bodyLabel} ${lens(angle, false)}`;
}

export function crossingReading(
  a: { label: string; body: string; angle: AngleKind },
  b: { label: string; body: string; angle: AngleKind },
): string {
  const ta = PLANET_THEME[a.body]?.split(",")[0] ?? a.label;
  const tb = PLANET_THEME[b.body]?.split(",")[0] ?? b.label;
  return `Along this latitude, ${a.label} on the ${a.angle} meets ${b.label} on the ${b.angle}: astrologers read ${ta} and ${tb} as working together here, felt more as a background tone than a single spot.`;
}

export const HISTORY: { title: string; body: string }[] = [
  {
    title: "Where the idea comes from",
    body: "Astrologer Jim Lewis introduced Astro*Carto*Graphy in 1976, drawing every place on Earth where each planet sat on one of the four chart angles at the moment of birth. Earlier astrologers had relocated charts city by city; Lewis mapped them all at once.",
  },
  {
    title: "Older roots",
    body: "Line crossings echo parans (paranatellonta), a technique from Hellenistic astrology described by Ptolemy and Vettius Valens: two bodies sharing an angle at the same moment, felt along a whole band of latitude.",
  },
  {
    title: "What it is and isn’t",
    body: "The lines are real astronomy — where each body truly rose, set or culminated. Their meanings are interpretive tradition, not measured effects. Many people use them as a prompt for reflection about places, not a verdict.",
  },
];
