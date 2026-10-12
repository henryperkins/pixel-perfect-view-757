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
      "If a demand feels familiar, notice it in a concrete choice you can describe, such as the scope of a commitment.",
  },
  {
    key: "chapter-opening-1",
    chapter: "opening",
    mechanism:
      "If a new demand catches your attention, notice your response before treating it as settled. A small decision can leave room to learn.",
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
      "If a response seems workable, consider how you could repeat it in an ordinary commitment. Its usefulness can remain open to review.",
  },
  {
    key: "chapter-between-1",
    chapter: "between",
    mechanism:
      "If a decision remains unsettled, let it stay provisional while you notice what information would help. A pause can leave room to reconsider.",
  },
];
