export type DayPhaseName = "sunrise" | "day" | "sunset";

/** Рассвет, день и закат: для завтрака, обеда и ужина. Цветные плоские значки. */
export default function DayPhase({ phase, className = "h-6 w-6" }: { phase: DayPhaseName; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      {phase === "sunrise" && (
        <>
          <path d="M6 34h36" stroke="#4a9fd8" strokeWidth="4" strokeLinecap="round" />
          <path d="M12 34a12 12 0 0 1 24 0z" fill="#f2b134" />
          <path d="M24 8v5M10 14l3.500 3.500M38 14l-3.500 3.500M4 22h4M40 22h4" stroke="#f2b134" strokeWidth="3" strokeLinecap="round" />
          <path d="M14 42h20" stroke="#4a9fd8" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        </>
      )}
      {phase === "day" && (
        <>
          <circle cx="24" cy="24" r="10" fill="#f2b134" />
          <path d="M24 4v6M24 38v6M4 24h6M38 24h6M9.500 9.500l4.300 4.300M34.200 34.200l4.300 4.300M9.500 38.500l4.300-4.300M34.200 13.800l4.300-4.300" stroke="#f2b134" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {phase === "sunset" && (
        <>
          <path d="M6 34h36" stroke="#e4572e" strokeWidth="4" strokeLinecap="round" />
          <path d="M12 34a12 12 0 0 1 24 0z" fill="#e4572e" />
          <path d="M24 8v5M10 14l3.500 3.500M38 14l-3.500 3.500M4 22h4M40 22h4" stroke="#e9b44c" strokeWidth="3" strokeLinecap="round" />
          <path d="M14 42h20" stroke="#7b3f9e" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        </>
      )}
    </svg>
  );
}
