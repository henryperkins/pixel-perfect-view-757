/** Page-local shortcuts. Plain fragment links keep native scrolling, Back and focus order. */
export function SectionNav({
  label,
  links,
  className = "",
}: {
  label: string;
  links: readonly { href: `#${string}`; text: string }[];
  className?: string;
}) {
  return (
    <nav aria-label={label} className={`section-nav ${className}`}>
      {links.map((link) => (
        <a key={link.href} href={link.href}>
          {link.text}
        </a>
      ))}
    </nav>
  );
}
