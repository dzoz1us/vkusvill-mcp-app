import { APP_NAME } from "@/shared/lib";

/** Знак «Менюшки»: зелёная плитка, белая миска с паром и листик. */
export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" focusable="false">
      <g transform="rotate(38 20 20)">
        <path d="M22.500 5C17 5 15.500 12 12 18.500 8.500 25 11.500 36 22.500 36s14-11 10.500-17.500C29.500 12 28 5 22.500 5z" fill="#1f7a2c" />
        <path d="M20 3C14.500 3 13 10 9.500 16.500 6 23 9 34 20 34s14-11 10.500-17.500C27 10 25.500 3 20 3z" fill="#3aa23a" />
        <path d="M20 7.500c-3.600 0-4.800 6-7.800 11.500-2 3.800.8 10.500 7.800 10.500s9.800-6.700 7.800-10.500C24.800 13.500 23.600 7.500 20 7.500z" fill="#a8d95c" />
        <circle cx="20" cy="23" r="5" fill="#8a4a1c" />
      </g>
    </svg>
  );
}

/** Логотип со словом: значок и название чёрным. */
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 sm:gap-2.5 ${className}`}>
      <LogoMark className="h-7 w-7 sm:h-9 sm:w-9" />
      <span className="font-display text-ink text-xl font-bold tracking-tight sm:text-2xl">{APP_NAME}</span>
    </span>
  );
}
