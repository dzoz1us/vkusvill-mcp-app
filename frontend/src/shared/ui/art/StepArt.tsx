export type StepArtName = "question" | "salad" | "basket";

/** Иллюстрации шагов главной: вопросы, тарелка с салатом, корзина с продуктами. */
export default function StepArt({ name, className = "h-14 w-14" }: { name: StepArtName; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      {name === "question" && (
        <>
          <rect width="64" height="64" rx="20" fill="#dcefff" />
          <rect x="17" y="12" width="30" height="40" rx="6" fill="#fff" stroke="#4a9fd8" strokeWidth="2.5" />
          <path d="M23 24h18M23 31h18M23 38h10" stroke="#4a9fd8" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="47" cy="45" r="9" fill="#5a9612" />
          <path d="M42.500 45l3 3 5.500-6" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {name === "salad" && (
        <>
          <rect width="64" height="64" rx="20" fill="#e6f6cf" />
          <ellipse cx="32" cy="38" rx="22" ry="13" fill="#fff" stroke="#5a9612" strokeWidth="2" />
          <ellipse cx="32" cy="38" rx="15" ry="8" fill="#f4faea" />
          <path d="M18 36c0-7 6-11 12-10-1 6-5 10-12 10zM46 36c0-7-6-11-12-10 1 6 5 10 12 10z" fill="#3aa23a" />
          <path d="M26 33c2-6 8-7 12-5-2 5-7 7-12 5z" fill="#78b43b" />
          <circle cx="30" cy="40" r="4" fill="#e4572e" />
          <circle cx="37" cy="41" r="4" fill="#e4572e" />
          <circle cx="32" cy="36" r="2.800" fill="#c8e56b" stroke="#5a9612" strokeWidth="1" />
          <path d="M22 44h8M34 44h8" stroke="#5a9612" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
        </>
      )}
      {name === "basket" && (
        <>
          <rect width="64" height="64" rx="20" fill="#ffe7df" />
          <path d="M22 26v-4a10 10 0 0 1 20 0v4" fill="none" stroke="#e4572e" strokeWidth="3" strokeLinecap="round" />
          <rect x="14" y="26" width="36" height="28" rx="6" fill="#e4572e" />
          <path d="M14 26h36v4H14z" fill="#c23a17" opacity="0.35" />
          <circle cx="29" cy="39" r="5" fill="#78b43b" />
          <path d="M29 34v-2" stroke="#4e8a27" strokeWidth="2" strokeLinecap="round" />
          <path d="M37 37c3-3 7-1 7 3s-4 5-7 3z" fill="#f2b134" />
        </>
      )}
    </svg>
  );
}
