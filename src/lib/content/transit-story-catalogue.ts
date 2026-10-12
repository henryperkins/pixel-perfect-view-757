import type { TransitChapter } from "../astro/transit-episodes";
export interface TransitChapterCopy {
  key: string;
  chapter: TransitChapter;
  mechanism: string;
}
export const TRANSIT_CHAPTERS: TransitChapterCopy[] = [
  {
    key: "chapter-single-1",
    chapter: "single",
    mechanism:
      "If a demand feels familiar, a concrete choice such as the scope of a commitment can offer a way to describe it.",
  },
  {
    key: "chapter-opening-1",
    chapter: "opening",
    mechanism:
      "If a new demand catches your attention, your response can remain open to consideration. A small decision can leave room to learn.",
  },
  {
    key: "chapter-return-1",
    chapter: "return",
    mechanism:
      "If an earlier way of handling this no longer fits, this return offers a chance to try a smaller adjustment to a method or boundary.",
  },
  {
    key: "chapter-closing-1",
    chapter: "closing",
    mechanism:
      "If a response seems workable, repeating it in an ordinary commitment is one possibility. Its usefulness can remain open to review.",
  },
  {
    key: "chapter-between-1",
    chapter: "between",
    mechanism:
      "If a decision remains unsettled, keeping it provisional can leave room to reconsider what information would help.",
  },
];
