/**
 * Značka: rozvětvený tvar, který v malém funguje jako ikona a nese
 * stejnou myšlenku jako pozadí — jedna linka se dělí na menší.
 */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="logo-branch" x1="0" y1="32" x2="32" y2="0">
          <stop offset="0%" stopColor="var(--color-emerald-glow)" />
          <stop offset="60%" stopColor="var(--color-lime-soft)" />
          <stop offset="100%" stopColor="var(--color-violet-soft)" />
        </linearGradient>
      </defs>
      <g
        stroke="url(#logo-branch)"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 30V17" />
        <path d="M16 17 8.5 10.5" />
        <path d="M16 17 23.5 10.5" />
        <path d="M8.5 10.5 5 5.5" />
        <path d="M8.5 10.5 12 5.5" />
        <path d="M23.5 10.5 20 5.5" />
        <path d="M23.5 10.5 27 5.5" />
      </g>
      <g fill="var(--color-lime-soft)">
        <circle cx="5" cy="4.6" r="1.7" />
        <circle cx="12" cy="4.6" r="1.7" />
        <circle cx="20" cy="4.6" r="1.7" />
      </g>
      <circle cx="27" cy="4.6" r="1.7" fill="var(--color-violet-soft)" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`display text-lg tracking-tight ${className}`}>
      Almost<span className="text-gradient">There</span>
    </span>
  );
}
