import { APP_NAME } from "@/shared/lib";

/** Знак «Менюшки»: зелёная плитка, белая миска с паром и листик. */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" focusable="false">
      <rect width="40" height="40" rx="13" fill="#5a9612" />
      <path d="M8 20h24a12 12 0 0 1-12 12h0A12 12 0 0 1 8 20z" fill="#fff" />
      <rect x="14" y="31" width="12" height="2.6" rx="1.3" fill="#fff" />
      <path d="M15 16c-2-2.4 2-3.6 0-6M20 16c-2-2.4 2-3.6 0-6" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />
      <path d="M25 15c0-4.4 3.2-7 7.6-7.2C32.8 12.6 30 15.4 25 15z" fill="#a4d63b" />
    </svg>
  );
}

/** Логотип со словом: значок и название чёрным. */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="font-display text-ink text-2xl font-bold tracking-tight">{APP_NAME}</span>
    </span>
  );
}
