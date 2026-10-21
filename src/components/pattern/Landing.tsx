import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import celestialScene from "@/assets/celestial-browsing.webp";
import { CelestialScene } from "@/components/pattern/CelestialScene";
import { Button } from "@/components/ui/button";

/** Signed-out homepage. Kept outside the route file so the route stays code-split. */
export function Landing() {
  return (
    <div>
      <CelestialScene src={celestialScene}>
        <div className="landing-copy">
          <h1 className="leading-tight">Astrology that shows its work.</h1>
          <p className="prose-reading mt-6 text-foreground">
            Pattern calculates your chart from birth date, time and place, finds the cycles actually
            active today, and writes one theme at a time. Every paragraph opens to the bodies,
            aspect, orb and exact date it came from. Nothing is predicted; nothing is generated from
            a sun sign.
          </p>
          <Button asChild size="lg" className="landing-cta mt-8">
            <Link to="/auth">
              Start with your chart
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
          <p className="mt-5 text-sm">
            <Link to="/transit-chart-calculator" className="text-primary underline">
              How the transit chart calculator works
            </Link>
          </p>
        </div>
      </CelestialScene>
      <ul className="landing-foundations">
        <li>
          <b>Unknown birth time is first class</b> — angle claims get suppressed, not faked.
        </li>
        <li>
          <b>Context you opt into can rank a theme,</b> never invent a chart fact.
        </li>
        <li>
          <b>Birth details, notes and readings</b> are stored encrypted.
        </li>
      </ul>
    </div>
  );
}
