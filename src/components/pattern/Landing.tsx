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
            Pattern uses your birth date, time and place to calculate your chart and the cycles
            active today. Read one daily theme, with the calculations and sources behind it.
            Conditions, not predictions.
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
          <b>Unknown birth time is fine.</b> Unreliable house and angle descriptions are left out.
        </li>
        <li>
          <b>Optional context stays optional.</b> It can shape a suggestion, never change the chart.
        </li>
        <li>
          <b>Birth details, notes and readings</b> are stored encrypted.
        </li>
      </ul>
    </div>
  );
}
