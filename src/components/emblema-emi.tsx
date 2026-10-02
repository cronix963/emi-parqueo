export function EmblemaEMI({ className = "h-12 w-12" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Escudo de la Escuela Militar de Ingeniería"
    >
      <defs>
        <linearGradient id="escudoAzul" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#174ba0" />
          <stop offset="100%" stopColor="#0b2a5b" />
        </linearGradient>
        <linearGradient id="escudoOro" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffd766" />
          <stop offset="100%" stopColor="#cc9706" />
        </linearGradient>
      </defs>
      <path
        d="M50 3 92 17v34c0 24-17 39-42 46C25 90 8 75 8 51V17L50 3Z"
        fill="url(#escudoAzul)"
        stroke="url(#escudoOro)"
        strokeWidth="4"
      />
      <path
        d="M50 14v74"
        stroke="#ffc72c"
        strokeWidth="2.5"
        opacity="0.55"
      />
      <path
        d="M30 66V38l20-11 20 11v28"
        fill="none"
        stroke="#ffc72c"
        strokeWidth="4.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path d="M39 66V50h22v16" fill="#ffc72c" opacity="0.22" />
      <path d="M39 66V50h22v16" fill="none" stroke="#ffd766" strokeWidth="2.5" />
      <circle cx="50" cy="59" r="2.6" fill="#ffc72c" />
      <path d="M26 34h48" stroke="#ffd766" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
