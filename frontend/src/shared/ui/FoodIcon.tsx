export type FoodIconName =
  | "avocado"
  | "bread"
  | "busts-in-silhouette"
  | "calendar"
  | "carrot"
  | "confused-face"
  | "cooking"
  | "croissant"
  | "cup-with-straw"
  | "cut-of-meat"
  | "dashing-away"
  | "fire"
  | "green-heart"
  | "green-salad"
  | "high-voltage"
  | "hot-beverage"
  | "hot-pepper"
  | "leafy-green"
  | "lemon"
  | "magnifying-glass-tilted-left"
  | "money-bag"
  | "open-book"
  | "pancakes"
  | "popcorn"
  | "pot-of-food"
  | "poultry-leg"
  | "shallow-pan-of-food"
  | "shopping-cart"
  | "spaghetti"
  | "sparkles"
  | "stopwatch"
  | "strawberry"
  | "tomato"
  | "broccoli"
  | "eggplant"
  | "ear-of-corn"
  | "garlic"
  | "cucumber"
  | "onion"
  | "mushroom"
  | "banana"
  | "red-apple"
  | "blueberries"
  | "cheese-wedge"
  | "egg"
  | "fish"
  | "tropical-fish";

// Иконки Fluent Emoji (MIT) лежат в shared/assets/icons
const files = import.meta.glob("../assets/icons/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const ICONS: Record<string, string> = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [
    path.split("/").pop()!.replace(".svg", ""),
    url,
  ]),
);

interface FoodIconProps {
  name: FoodIconName;
  className?: string;
}

export default function FoodIcon({ name, className = "h-6 w-6" }: FoodIconProps) {
  return (
    <img
      src={ICONS[name]}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={className}
    />
  );
}
