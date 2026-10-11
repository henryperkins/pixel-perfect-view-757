/** Decorative brand orbit, never a representation of calculated chart data. */
export function OrbitMark({ className = "" }: { className?: string }) {
  return (
    <span className={`orbit-mark ${className}`} aria-hidden="true">
      <svg viewBox="0 0 48 48" fill="none">
        <ellipse cx="24" cy="24" rx="21" ry="12" transform="rotate(-35 24 24)" stroke="currentColor" />
        <circle cx="24" cy="24" r="7" fill="currentColor" />
      </svg>
      <span className="orbit-satellite"><span /></span>
    </span>
  );
}