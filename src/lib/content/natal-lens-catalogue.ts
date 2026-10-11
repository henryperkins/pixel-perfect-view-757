import { SIGNS } from "../astro/ephemeris";
import {
  NATAL_BODY_ROLE,
  NATAL_PERSONAL_BODIES,
  type NatalLensRule,
  type NatalPersonalBody,
} from "./natal-lens-types";

/** Individually authored possibilities, in the existing SIGNS order. See the editorial review artifact. */
const COPY: Record<NatalPersonalBody, readonly string[]> = {
  sun: [
    "Starting something yourself can offer a sense of direction. If a task has stalled, the distinction may be between choosing a first step and trying to control its entire outcome.",
    "A direction can feel worthwhile when it has something tangible to sustain. An ordinary project may distinguish preserving what works from keeping it simply because it is familiar.",
    "Following more than one line of curiosity can help a direction take shape. If several possible projects compete for the same free afternoon, sampling a few and choosing one to pursue may be different stages.",
    "A sense of continuity can offer a reference for choosing a direction. A familiar project may distinguish what still feels meaningful from what is kept only to preserve its history.",
    "Making a contribution visible can offer a way to recognize its purpose. A shared draft may distinguish putting your own stamp on the work from needing every part to carry it.",
    "A useful contribution can offer a clearer direction than a grand description. If a task needs refining, improving one workable detail may differ from making perfection the condition for participating.",
    "Considering more than one perspective can help a direction feel chosen. An undecided plan may distinguish making room for another view from leaving your own position undefined.",
    "A direction can gather meaning through sustained attention to what matters underneath. If a project has several layers, pursuing a significant question may differ from keeping every uncertainty private.",
    "A larger purpose can make an ordinary commitment worth pursuing. If a plan feels narrow, the distinction may be between its underlying aim and the particular route used to reach it.",
    "A direction can become clearer through commitments that are manageable over time. An unfinished project may distinguish building something durable from treating every obligation as a measure of worth.",
    "An independent perspective can offer a way to choose a direction. If a familiar method feels limiting, questioning the arrangement may differ from needing every choice to be unconventional.",
    "A direction can emerge by noticing connections before fixing their shape. A loosely outlined project may distinguish leaving room for discovery from leaving its purpose entirely unspoken.",
  ],
  moon: [
    "A quick, direct response can offer a way to meet pressure. If an unfinished reply feels urgent, naming the immediate point may differ from resolving the whole exchange at once.",
    "A familiar pace or setting can offer something steady when pressure is present. An altered routine may distinguish the comfort of continuity from keeping an arrangement that no longer fits.",
    "Putting a response into words can offer room to understand it. If several explanations come to mind, naming the relevant detail may differ from continuing the conversation to avoid a pause.",
    "A familiar connection can offer a reference when a response is hard to name. An ordinary message may distinguish wanting continuity from assuming that closeness requires an immediate reply.",
    "Having a response acknowledged can matter alongside expressing it. If a contribution has not been noticed, the distinction may be between making its meaning visible and making it larger to gain attention.",
    "Sorting a response into manageable details can offer a way to meet pressure. An unfinished list may distinguish a small useful adjustment from trying to make every detail orderly before resting.",
    "Considering how a response fits the exchange can offer space before answering. An unfinished reply may distinguish making room for another perspective from editing your own preference out of it.",
    "Keeping a response private for a while can offer room to understand its depth. If a message feels significant, the distinction may be between choosing what to share and needing complete certainty before sharing anything.",
    "Wanting room to move can be part of a response to pressure. If an ordinary obligation feels narrow, the useful distinction may be between the commitment itself and how much choice it leaves in carrying it out.",
    "A self-contained response to pressure can start with sorting what is manageable before sharing it. An unfinished reply can offer a place to notice the difference between useful preparation and waiting to have everything settled.",
    "Taking a little distance can offer room to consider a response. If an exchange feels crowded, the distinction may be between gaining perspective and making the response so abstract that its immediate point disappears.",
    "Allowing a response to take shape gradually can offer room for mixed impressions. An unfinished reply may distinguish acknowledging what is unclear from taking on every feeling suggested by the exchange.",
  ],
  mercury: [
    "A direct first sentence can offer a way into an explanation. If a message is unfinished, stating the point may differ from expecting the first phrasing to carry every nuance.",
    "An explanation can become clearer through concrete examples and an unhurried pace. A revised note may distinguish giving an idea a firm shape from retaining a phrase only because it is familiar.",
    "Trying several phrasings can offer a way to discover the point of an explanation. If a note has many branches, exploring alternatives may differ from adding another version after the meaning is already clear.",
    "An explanation can take shape around the context that makes it meaningful. A familiar example may distinguish preserving the point of a memory from assuming its context is already shared.",
    "A vivid example can offer an explanation a recognizable voice. If a draft needs emphasis, making the point memorable may differ from making its presentation more prominent than its meaning.",
    "Careful distinctions can offer an explanation a workable shape. A revised sentence may distinguish removing an ambiguity from adding qualifications that obscure an otherwise clear point.",
    "An explanation can benefit from testing how it sounds from another position. If a reply is being revised, considering the exchange may differ from balancing every sentence until your own point disappears.",
    "Following a question beneath its first answer can offer depth to an explanation. An unfinished note may distinguish investigating the relevant uncertainty from treating every missing detail as a hidden meaning.",
    "An explanation can become clearer when its larger point is named. If a draft covers many details, connecting them to a purpose may differ from skipping the example that makes the purpose understandable.",
    "Giving an explanation a sequence can offer a way to make it usable. An outline may distinguish the structure needed to follow the point from deciding that every sentence must be settled before sharing it.",
    "An unfamiliar comparison can offer a fresh way to explain a familiar problem. If a method is being questioned, changing the frame may differ from losing the practical question that prompted it.",
    "Images and associations can offer a way into an explanation. A loosely phrased note may distinguish leaving room for nuance from leaving the reader without a point they can follow.",
  ],
  venus: [
    "A preference can become clearer through a direct choice. If an invitation is appealing, recognizing the initial interest may differ from committing to every part of the plan immediately.",
    "A preference can have a tangible reference in familiar comforts. An ordinary object may distinguish what still gives pleasure from what is kept only because it has been there a long time.",
    "Variety and conversation can offer a way to recognize a preference. If several options appeal, enjoying the comparison may differ from needing to keep every option open.",
    "Familiarity can offer a meaningful reference for a preference. A recurring plan may distinguish a choice that still feels welcoming from one maintained only to preserve continuity.",
    "A preference can become clear through what feels worth expressing openly. If a choice has a personal flourish, enjoying that expression may differ from needing it to be noticed to count.",
    "Small, thoughtful details can offer a way to recognize a preference. An ordinary arrangement may distinguish appreciating care in its form from requiring every detail to be corrected before enjoying it.",
    "A preference can become clearer by considering the balance of an exchange. An invitation may distinguish enjoying a shared choice from agreeing before your own taste has been named.",
    "Depth and sustained attention can offer a meaningful reference for a preference. If a gift for someone close matters strongly, choosing something with real meaning may differ from needing it to stand for the whole relationship.",
    "A preference can become clear through the room a choice leaves for discovery. An ordinary plan may distinguish enjoying a commitment from wanting its route to stay entirely open.",
    "A preference can have a reference in what remains dependable over time. A familiar arrangement may distinguish valuing its steadiness from keeping it solely because it requires no new decision.",
    "A preference can become clearer when a choice leaves room for independence. A shared plan may distinguish valuing an unusual arrangement from needing distance simply to preserve a sense of choice.",
    "A preference can emerge through atmosphere or a loosely defined impression. An ordinary invitation may distinguish being drawn to its feeling from agreeing to details that have not yet become clear.",
  ],
  mars: [
    "Beginning directly can offer a way to focus effort. If a task is waiting, choosing an immediate step may differ from treating every delay as a reason to push harder.",
    "Effort can find a workable rhythm through a steady, tangible task. An unfinished project may distinguish useful persistence from continuing the same method after the task has changed.",
    "Effort can gather momentum by trying a few routes into a problem. If a task has several pieces, testing an option may differ from changing direction whenever a piece becomes difficult.",
    "Effort can become clearer when it supports something that feels worth protecting. An ordinary responsibility may distinguish a chosen contribution from taking on the entire arrangement to keep it familiar.",
    "Effort can gather focus when a task has room for a personal contribution. A shared project may distinguish owning a useful piece from needing every result to reflect your approach.",
    "Effort can find a clear place in a task that needs one precise improvement. A revision may distinguish correcting the relevant detail from making every remaining flaw a reason to continue.",
    "Effort can become more directed by considering how an action fits an exchange. An undecided next step may distinguish coordinating with another position from waiting for complete agreement before acting.",
    "Effort can gather depth through staying with a significant problem. If a task resists a quick answer, sustained attention may differ from making every obstacle a contest that has to be won.",
    "Effort can gather momentum when an ordinary task connects to a larger aim. A promising project may distinguish widening its reach from adding more scope than the next step can carry.",
    "Effort can take a workable shape through a sequence of manageable commitments. An unfinished task may distinguish building capacity gradually from measuring progress only by how much responsibility is carried.",
    "Effort can find direction by changing an arrangement that limits the task. If a familiar method is awkward, testing an alternative may differ from rejecting useful structure because it is conventional.",
    "Effort can take shape by responding to an opening rather than forcing a fixed sequence. A loosely outlined task may distinguish useful flexibility from leaving the next practical step undefined.",
  ],
};

export const NATAL_LENS_CATALOGUE: NatalLensRule[] = NATAL_PERSONAL_BODIES.flatMap((body) =>
  SIGNS.map((sign, index) => ({
    key: `nl-${body}-${String(index + 1).padStart(2, "0")}`,
    role: NATAL_BODY_ROLE[body],
    anchorNatalPoints: body === "moon" ? [...NATAL_PERSONAL_BODIES] : [body],
    selectors: [{ kind: "sign", body, sign }],
    mechanism: COPY[body][index]!,
  })),
);
NATAL_LENS_CATALOGUE.push(
  {
    key: "nl-moon-10-aspect-01",
    role: "emotional_reflex",
    anchorNatalPoints: [...NATAL_PERSONAL_BODIES],
    selectors: [
      { kind: "sign", body: "moon", sign: "Capricorn" },
      { kind: "aspect", a: "moon", b: "saturn", aspect: "trine", maxOrb: 3 },
    ],
    mechanism:
      "Dependable structure can offer support when a response needs time to take shape. An ordinary commitment may distinguish accepting useful support from taking on every obligation to keep the arrangement steady.",
  },
  {
    key: "nl-moon-10-house-01",
    role: "emotional_reflex",
    anchorNatalPoints: [...NATAL_PERSONAL_BODIES],
    selectors: [
      { kind: "sign", body: "moon", sign: "Capricorn" },
      { kind: "house", body: "moon", house: 6 },
    ],
    mechanism:
      "A manageable routine can offer a way to meet pressure without settling everything at once. An unfinished list may distinguish one useful task from making the entire routine a condition for taking a pause.",
  },
);
