export type IconName =
  | "arrow-left"
  | "arrow-right"
  | "barbell"
  | "book-open-text"
  | "bowl-food"
  | "calendar-check"
  | "check"
  | "clock"
  | "coins"
  | "fire"
  | "fork-knife"
  | "hamburger"
  | "heart"
  | "leaf"
  | "lightning"
  | "magnifying-glass"
  | "minus"
  | "moon-stars"
  | "plus"
  | "shopping-cart"
  | "smiley-sad"
  | "sparkle"
  | "storefront"
  | "sun"
  | "sun-horizon"
  | "timer"
  | "user"
  | "users-three"
  | "wallet";

// Phosphor Icons (duotone, MIT) лежат в shared/assets/ui; цвет задаётся через text-*
const files = import.meta.glob("../assets/ui/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const URLS: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [
    path.split("/").pop()!.replace(".svg", ""),
    url,
  ]),
);

interface IconProps {
  name: IconName;
  className?: string;
}

export default function Icon({ name, className = "h-6 w-6" }: IconProps) {
  const url = `url("${URLS[name]}")`;
  return (
    <span
      aria-hidden="true"
      className={`inline-block flex-shrink-0 bg-current ${className}`}
      style={{
        WebkitMaskImage: url,
        maskImage: url,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}
