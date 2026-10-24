import Produce from "../produce/Produce";
import type { ProduceName } from "../produce/Produce";

/** Продукты, которых нет в наборе овощей: молоко, яйца, мёд, крупа, мясо, рыба, сыр, картофель. */
type Kind = "milk" | "egg" | "honey" | "grain" | "potato" | "meat" | "fish" | "cheese" | "bag";

/** Соответствие по словам из названия товара: первое совпадение побеждает. */
const RULES: [RegExp, { produce?: ProduceName; kind?: Kind }][] = [
  [/молок|кефир|сливк|ряженк/, { kind: "milk" }],
  [/яйц/, { kind: "egg" }],
  [/мёд|мед /, { kind: "honey" }],
  [/овся|хлоп|крупа|рис|гречк|перлов|пшен|мука/, { kind: "grain" }],
  [/картоф/, { kind: "potato" }],
  [/лосос|форел|рыб|треска|семг|тунец/, { kind: "fish" }],
  [/говяд|свин|куриц|курин|фарш|мясо|индей|бедро|филе/, { kind: "meat" }],
  [/сыр|творог|пармез|моцарел/, { kind: "cheese" }],
  [/морков/, { produce: "carrot" }],
  [/помидор|томат/, { produce: "tomato" }],
  [/огур/, { produce: "cucumber" }],
  [/брокк/, { produce: "broccoli" }],
  [/перец/, { produce: "pepper" }],
  [/яблок/, { produce: "apple" }],
  [/груш/, { produce: "pear" }],
  [/лимон/, { produce: "lemon" }],
  [/лайм|апельсин/, { produce: "orange" }],
  [/баклаж/, { produce: "eggplant" }],
  [/гриб/, { produce: "mushroom" }],
  [/авокад/, { produce: "avocado" }],
  [/свекл/, { produce: "beet" }],
  [/клубник|земляник/, { produce: "strawberry" }],
  [/вишн|черешн/, { produce: "cherry" }],
  [/виноград|черник|голубик|ежевик/, { produce: "grapes" }],
  [/горош|фасол/, { produce: "peas" }],
  [/кукуруз/, { produce: "corn" }],
];

const kindOf = (name: string): { produce?: ProduceName; kind: Kind } => {
  const n = name.toLowerCase();
  for (const [re, v] of RULES) if (re.test(n)) return { produce: v.produce, kind: v.kind ?? "bag" };
  return { kind: "bag" };
};

/** Иконка продукта для корзины: овощи и фрукты берём из набора, остальное рисуем здесь. */
export default function ProductArt({ name, className = "h-12 w-12" }: { name: string; className?: string }) {
  const { produce, kind } = kindOf(name);
  if (produce) return <Produce name={produce} className={className} />;

  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      {kind === "milk" && (
        <>
          <path d="M18 14h28l4 12v30a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V26z" fill="#fff" stroke="#4a9fd8" strokeWidth="2.500" strokeLinejoin="round" />
          <path d="M14 26h36" stroke="#4a9fd8" strokeWidth="2.500" />
          <path d="M18 14l6-6h16l6 6" fill="#4a9fd8" />
          <path d="M22 38h20v8H22z" fill="#4a9fd8" opacity="0.25" />
        </>
      )}
      {kind === "egg" && (
        <>
          <ellipse cx="22" cy="34" rx="11" ry="14" fill="#fff8e7" stroke="#e9b44c" strokeWidth="2" />
          <ellipse cx="42" cy="30" rx="11" ry="14" fill="#fff" stroke="#e9b44c" strokeWidth="2" />
        </>
      )}
      {kind === "honey" && (
        <>
          <path d="M18 24h28v28a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4z" fill="#f2b134" />
          <rect x="20" y="16" width="24" height="9" rx="2" fill="#7a4119" />
          <rect x="24" y="32" width="16" height="10" rx="3" fill="#fff" opacity="0.6" />
        </>
      )}
      {kind === "grain" && (
        <>
          <path d="M16 20h32l2 34H14z" fill="#f6e7c1" stroke="#c98d27" strokeWidth="2" strokeLinejoin="round" />
          <path d="M16 20l4-6h24l4 6" fill="#c98d27" />
          <circle cx="32" cy="38" r="7" fill="#e9b44c" />
        </>
      )}
      {kind === "potato" && (
        <>
          <ellipse cx="26" cy="36" rx="14" ry="10" fill="#c98d27" transform="rotate(-15 26 36)" />
          <ellipse cx="42" cy="30" rx="10" ry="8" fill="#a8632a" transform="rotate(20 42 30)" />
          <circle cx="22" cy="34" r="1.300" fill="#7a4119" />
          <circle cx="30" cy="38" r="1.300" fill="#7a4119" />
        </>
      )}
      {kind === "meat" && (
        <>
          <path d="M12 36c0-10 10-18 22-18 8 0 14 6 14 14 0 12-10 20-22 20-8 0-14-6-14-16z" fill="#d6334a" />
          <path d="M22 34c4-2 8 0 10 4" fill="none" stroke="#fffdf8" strokeWidth="2.500" strokeLinecap="round" opacity="0.8" />
          <path d="M36 14c4 2 6 6 6 10" fill="none" stroke="#f6e7c1" strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {kind === "fish" && (
        <>
          <path d="M10 32c8-12 22-14 32-4l10-6-2 10 2 10-10-6c-10 10-24 8-32-4z" fill="#f08a24" />
          <circle cx="22" cy="30" r="2" fill="#2b1b14" />
          <path d="M26 26c2 6 2 12 0 18" fill="none" stroke="#fff" strokeWidth="2" opacity="0.6" />
        </>
      )}
      {kind === "cheese" && (
        <>
          <path d="M10 26l34-10 10 26-34 10z" fill="#f2c94c" stroke="#c98d27" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="22" cy="30" r="2.500" fill="#e9b44c" />
          <circle cx="34" cy="28" r="2" fill="#e9b44c" />
          <circle cx="30" cy="38" r="2.500" fill="#e9b44c" />
        </>
      )}
      {kind === "bag" && (
        <>
          <path d="M14 22h36l-3 34H17z" fill="#f6e7c1" stroke="#c98d27" strokeWidth="2" strokeLinejoin="round" />
          <path d="M24 22v-4a8 8 0 0 1 16 0v4" fill="none" stroke="#c98d27" strokeWidth="2.500" />
          <circle cx="32" cy="38" r="5" fill="#78b43b" />
        </>
      )}
    </svg>
  );
}
