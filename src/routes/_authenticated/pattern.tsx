import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  ChevronDown,
  Layers,
  Moon,
  Orbit,
  RotateCcw,
  Sparkles,
  Sun,
  Sunrise,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Shell } from "@/components/pattern/Shell";
import { EphemerisNotice } from "@/components/pattern/EphemerisNotice";
import { PatternChapter } from "@/components/pattern/PatternChapter";
import { PatternChartDetails } from "@/components/pattern/PatternChartDetails";
import {
  CHAPTER_FAMILIES,
  bodyName,
  strengthLabel,
  type PatternData,
  type PatternFeature,
} from "@/components/pattern/pattern-view";
import { fetchPattern } from "@/lib/pattern.functions";

export const Route = createFileRoute("/_authenticated/pattern")({
  head: () => ({
    meta: [
      { title: "Your pattern — Pattern" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "description",
        content:
          "Explore the chapters in your birth chart, with the calculated facts behind every reading.",
      },
      { property: "og:title", content: "Your pattern — Pattern" },
      {
        property: "og:description",
        content: "Follow your natal chapters, placements, and connections at your own pace.",
      },
    ],
  }),
  component: PatternPage,
});

function PatternPage() {
  const load = useServerFn(fetchPattern);
  const query = useQuery({ queryKey: ["pattern"], queryFn: () => load({}) });

  return (
    <Shell>
      <div className="pattern-page animate-rise">
        <header className="pattern-page-heading">
          <h1>Your pattern</h1>
          <p>Explore the threads in your birth chart, one chapter at a time.</p>
        </header>
        {query.isPending ? (
          <div className="pattern-page-loading" aria-busy="true" aria-label="Loading your chart">
            <p role="status">Finding your chapters…</p>
            <div className="pattern-loading-rows" aria-hidden="true">
              {[1, 2, 3].map((row) => (
                <span key={row} />
              ))}
            </div>
          </div>
        ) : query.error ? (
          <div className="pattern-page-empty">
            <h2>Your chart couldn’t load</h2>
            <p role="status">{query.error.message}</p>
            <Button
              variant="outline"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              <RotateCcw aria-hidden="true" />
              {query.isFetching ? "Trying again…" : "Try again"}
            </Button>
          </div>
        ) : !query.data || query.data.needsOnboarding ? (
          <div className="pattern-page-empty">
            <span className="pattern-empty-mark">
              <Orbit aria-hidden="true" />
            </span>
            <h2>Your pattern starts with a moment</h2>
            <p>Add your birth details to explore your chapters and the chart behind them.</p>
            <Button asChild>
              <Link to="/onboarding">
                Enter birth details <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        ) : (
          <PatternView data={query.data} />
        )}
      </div>
    </Shell>
  );
}

function chapterIcon(feature: PatternFeature) {
  switch (feature.family) {
    case "luminary":
      return feature.feature_key.startsWith("moon_") ? Moon : Sun;
    case "angle":
      return Sunrise;
    case "configuration":
      return Layers;
    case "aspect":
      return Orbit;
    case "distribution":
      return Sparkles;
    default:
      return BookOpen;
  }
}

function PatternView({ data }: { data: PatternData }) {
  const features = [...data.features].sort((a, b) => Number(b.strength) - Number(a.strength));
  const [open, setOpen] = useState<string | null>(features[0]?.feature_key ?? null);
  const [family, setFamily] = useState("all");
  const [visited, setVisited] = useState(
    () => new Set(features[0] ? [features[0].feature_key] : []),
  );
  const [chapterTarget, setChapterTarget] = useState<{ key: string } | null>(null);
  const families = [...new Set(features.map((feature) => feature.family))];
  const selectedFamily = family === "all" || families.includes(family) ? family : "all";
  const visible = features.filter(
    (feature) => selectedFamily === "all" || feature.family === selectedFamily,
  );

  const selectChapter = (key: string, reveal = false) => {
    setVisited((previous) => (previous.has(key) ? previous : new Set([...previous, key])));
    setOpen(key);
    setChapterTarget(reveal ? { key } : null);
  };

  const chooseFamily = (value: string) => {
    setFamily(value);
    setChapterTarget(null);
    const choices = features.filter((feature) => value === "all" || feature.family === value);
    if (!choices.some((feature) => feature.feature_key === open) && choices[0]) {
      selectChapter(choices[0].feature_key);
    }
  };

  useEffect(() => {
    if (!chapterTarget) return;
    let active = true;
    const frame = requestAnimationFrame(() => {
      const toggle = document.getElementById(`chapter-toggle-${chapterTarget.key}`);
      if (!toggle) return;
      toggle.focus({ preventScroll: true });
      // Position after the previous retained reading has finished collapsing.
      const panels = toggle.closest("section")?.querySelectorAll(".chapter-panel");
      const transitions = Array.from(panels ?? []).flatMap((panel) =>
        panel.getAnimations().map((animation) => animation.finished),
      );
      void Promise.allSettled(transitions).then(() => {
        if (!active || !toggle.isConnected) return;
        toggle.scrollIntoView({
          block: "start",
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
        });
      });
    });
    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [chapterTarget]);

  return (
    <>
      <EphemerisNotice state={data.ephemeris} className="pattern-precision" />
      {!data.rising ? (
        <p className="pattern-birth-notice">
          Your rising lens needs a more precise birth time. You can explore the chapters your chart
          supports below.{" "}
          <Link to="/birth">
            Update birth details <ArrowRight aria-hidden="true" />
          </Link>
        </p>
      ) : null}

      <section className="pattern-reading" aria-labelledby="pattern-chapters-heading">
        <div className="pattern-section-heading">
          <h2 id="pattern-chapters-heading">Your chapters</h2>
          <p role="status" aria-live="polite">
            {selectedFamily === "all"
              ? `${features.length} ${features.length === 1 ? "chapter" : "chapters"} · strongest first`
              : `${visible.length} of ${features.length} chapters`}
          </p>
        </div>
        {features.length > 0 ? (
          <p className="pattern-detail-copy">
            Start with the strongest threads, or choose a part of your chart.
          </p>
        ) : (
          <p className="pattern-chapters-empty">
            No structural patterns passed the strength threshold for this chart. Your placements and
            connections are still available below.
          </p>
        )}

        {families.length > 1 ? (
          <div className="pattern-options" role="group" aria-label="Chapter type">
            {["all", ...families].map((value) => (
              <Button
                key={value}
                variant="ghost"
                aria-pressed={selectedFamily === value}
                aria-controls="pattern-chapters"
                onClick={() => chooseFamily(value)}
              >
                {value === "all" ? "Every chapter" : (CHAPTER_FAMILIES[value] ?? bodyName(value))}
              </Button>
            ))}
          </div>
        ) : null}

        <div id="pattern-chapters" className="pattern-chapters">
          {features.map((feature, rank) => {
            const isOpen = open === feature.feature_key;
            const position = visible.findIndex((item) => item.feature_key === feature.feature_key);
            const Icon = chapterIcon(feature);
            return (
              <article
                key={feature.feature_key}
                id={`chapter-${feature.feature_key}`}
                hidden={position === -1}
                className={`pattern-chapter ${isOpen ? "is-open" : ""}`}
              >
                <h3>
                  <Button
                    variant="ghost"
                    id={`chapter-toggle-${feature.feature_key}`}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`chapter-content-${feature.feature_key}`}
                    onClick={() => {
                      if (isOpen) {
                        setOpen(null);
                        setChapterTarget(null);
                      } else selectChapter(feature.feature_key);
                    }}
                    className="chapter-toggle pattern-chapter-toggle"
                  >
                    <span className="pattern-chapter-mark">
                      <span>
                        <Icon aria-hidden="true" />
                      </span>
                    </span>
                    <span className="pattern-chapter-label">
                      <span className="pattern-chapter-title">{feature.title}</span>
                      <span className="pattern-chapter-meta">
                        {CHAPTER_FAMILIES[feature.family] ?? bodyName(feature.family)} ·{" "}
                        {strengthLabel(feature, rank, features.length)}
                      </span>
                    </span>
                    <span className="pattern-chapter-index">
                      {(rank + 1).toString().padStart(2, "0")}
                    </span>
                    <span className="pattern-chapter-chevron">
                      <ChevronDown aria-hidden="true" />
                    </span>
                  </Button>
                </h3>
                <div
                  id={`chapter-content-${feature.feature_key}`}
                  className={`chapter-panel ${isOpen ? "is-open" : ""}`}
                  role="region"
                  aria-labelledby={`chapter-toggle-${feature.feature_key}`}
                  inert={!isOpen}
                  aria-hidden={!isOpen}
                >
                  <div>
                    <div className="chapter-content pattern-chapter-content">
                      {visited.has(feature.feature_key) ? (
                        <>
                          <PatternChapter feature={feature} />
                          <nav aria-label="Nearby chapters" className="pattern-chapter-next">
                            {visible.length > 1 ? (
                              <div>
                                <Button
                                  variant="ghost"
                                  disabled={position <= 0}
                                  onClick={() => {
                                    const previous = visible[position - 1];
                                    if (previous) selectChapter(previous.feature_key, true);
                                  }}
                                >
                                  <ArrowLeft aria-hidden="true" /> Previous chapter
                                </Button>
                                <Button
                                  variant="ghost"
                                  disabled={position >= visible.length - 1}
                                  onClick={() => {
                                    const next = visible[position + 1];
                                    if (next) selectChapter(next.feature_key, true);
                                  }}
                                >
                                  Next chapter <ArrowRight aria-hidden="true" />
                                </Button>
                              </div>
                            ) : null}
                            <Link to="/journal" className="pattern-journal-link">
                              Open journal <ArrowRight aria-hidden="true" />
                            </Link>
                          </nav>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <PatternChartDetails data={data} />
    </>
  );
}
