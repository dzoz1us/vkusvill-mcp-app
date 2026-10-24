import type { ReactNode } from "react";

/**
 * Плоские иллюстрации овощей и фруктов (холст 100×100): цельный цвет, тёмный бок и блик.
 * Рисованы вручную, чтобы цвета совпадали с палитрой сайта.
 */

export type ProduceName =
  | "tomato"
  | "carrot"
  | "broccoli"
  | "apple"
  | "lemon"
  | "avocado"
  | "eggplant"
  | "pepper"
  | "pear"
  | "strawberry"
  | "mushroom"
  | "corn"
  | "orange"
  | "cucumber"
  | "beet"
  | "cherry"
  | "peas"
  | "grapes";

const LEAF = "#5a9612";
const LEAF_DARK = "#3f7a0c";
const LEAF_LIGHT = "#a4d63b";

const Shine = ({ d }: { d: string }) => <path d={d} fill="#fff" opacity="0.35" />;

const ART: Record<ProduceName, ReactNode> = {
  tomato: (
    <>
      <circle cx="50" cy="56" r="33" fill="#e4572e" />
      <path d="M50 23A33 33 0 0 1 50 89A20 33 0 0 0 50 23Z" fill="#c23a17" opacity="0.4" />
      <path d="M50 28l-12-9 8 1 4-8 4 8 8-1-12 9z" fill={LEAF} />
      <path d="M50 28l-5 4 5 2 5-2z" fill={LEAF_DARK} />
      <Shine d="M30 48a20 20 0 0 1 12-16c-6 6-9 14-9 22z" />
    </>
  ),
  carrot: (
    <>
      <path d="M62 30C50 22 38 30 28 52 20 70 20 82 24 84c2 2 14-2 30-18 14-14 18-28 8-36z" fill="#f08a24" transform="rotate(20 50 50)" />
      <path d="M36 52l8 3M42 42l9 3M33 64l8 3" stroke="#c9680f" strokeWidth="2.5" strokeLinecap="round" transform="rotate(20 50 50)" />
      <path d="M66 28c0-10 4-16 10-18-1 8-3 14-7 20zM70 34c6-6 12-8 18-6-5 6-11 9-18 9zM60 24c-4-7-10-9-16-8 3 6 8 10 14 11z" fill={LEAF} />
      <Shine d="M48 38c4-4 9-5 12-2-5 0-9 3-12 8z" />
    </>
  ),
  broccoli: (
    <>
      <path d="M44 62h12l4 26H40z" fill={LEAF_LIGHT} />
      <circle cx="30" cy="48" r="17" fill={LEAF} />
      <circle cx="50" cy="36" r="20" fill={LEAF} />
      <circle cx="70" cy="48" r="17" fill={LEAF} />
      <circle cx="50" cy="54" r="18" fill={LEAF} />
      <circle cx="40" cy="30" r="6" fill={LEAF_DARK} opacity="0.35" />
      <circle cx="64" cy="52" r="5" fill={LEAF_DARK} opacity="0.35" />
      <circle cx="28" cy="52" r="4" fill={LEAF_DARK} opacity="0.35" />
      <Shine d="M38 26a12 12 0 0 1 10-6c-6 3-8 8-10 6z" />
    </>
  ),
  apple: (
    <>
      <path d="M50 30c-10-8-30-4-32 18-2 22 12 40 24 40 4 0 6-2 8-2s4 2 8 2c12 0 26-18 24-40-2-22-22-26-32-18z" fill="#d6334a" />
      <path d="M50 30c10-8 30-4 32 18 2 22-12 40-24 40-4 0-6-2-8-2 14-8 18-38 0-56z" fill="#a8223a" opacity="0.4" />
      <path d="M50 30c0-8 2-14 8-18" stroke="#5b3a1c" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M56 22c6-8 16-8 22-4-4 8-14 10-22 4z" fill={LEAF} />
      <Shine d="M28 46c0-8 4-12 10-14-5 5-6 12-4 20z" />
    </>
  ),
  lemon: (
    <>
      <path d="M12 52c0-10 8-10 12-14 8-10 24-14 40-6 8 4 12 6 16 12 4 6 4 12 0 14-4 4-8 4-12 12-8 12-26 14-40 6-8-4-12-6-14-16-2-6-2-6-2-8z" fill="#f7d339" transform="rotate(-15 50 50)" />
            <path d="M74 30c6-4 12-4 16 0-4 6-10 6-16 0z" fill={LEAF} />
      <Shine d="M32 42c4-6 10-8 16-8-8 3-12 8-14 14z" />
    </>
  ),
  avocado: (
    <>
      <path d="M50 8C36 8 30 30 22 48c-8 20 6 42 28 42s36-22 28-42C70 30 64 8 50 8z" fill="#3f7a0c" />
      <path d="M50 16c-10 0-14 20-20 34-6 16 4 32 20 32s26-16 20-32c-6-14-10-34-20-34z" fill="#c8e56b" />
      <circle cx="50" cy="62" r="13" fill="#9a5b28" />
      <circle cx="46" cy="58" r="4" fill="#fff" opacity="0.35" />
    </>
  ),
  eggplant: (
    <>
      <path d="M58 26c10 0 18 8 14 24-4 18-18 40-34 40-12 0-16-12-10-22 8-14 8-22 14-30 4-8 10-12 16-12z" fill="#6b2c91" />
      <path d="M72 50c-4 18-18 40-34 40 14 0 30-20 34-40z" fill="#4a1b69" opacity="0.5" />
      <path d="M52 28c-4-4-4-10 0-14 4 2 8 2 12 0 4 4 4 10 0 14-4 2-8 2-12 0z" fill={LEAF} />
      <path d="M58 14c0-4 2-6 4-8" stroke={LEAF_DARK} strokeWidth="4" strokeLinecap="round" />
      <Shine d="M44 40c2-6 6-10 10-10-4 4-6 10-6 18z" />
    </>
  ),
  pepper: (
    <>
      <path d="M30 34c-12 6-14 24-10 40 4 12 12 16 18 12 4-2 8-2 12 0 6 4 14 0 18-12 4-16 2-34-10-40-6-4-12-2-14 0-2-2-8-4-14 0z" fill="#f2b134" />
      <path d="M50 34c-6 14-6 38 0 52 4-2 8-2 12 0 6 4 14 0 18-12 3-12 3-26-4-34-8-10-18-10-26-6z" fill="#e0901a" opacity="0.35" />
      <path d="M46 34c0-8 2-12 8-14l4 4c-4 2-6 6-6 10z" fill={LEAF} />
      <Shine d="M30 48c0-6 2-10 6-12-3 5-4 12-2 20z" />
    </>
  ),
  pear: (
    <>
      <path d="M50 20c-12 0-14 14-18 26-6 10-12 18-8 30 4 10 16 14 26 14s22-4 26-14c4-12-2-20-8-30-4-12-6-26-18-26z" fill="#b8d33a" />
      <path d="M50 20c12 0 14 14 18 26 6 10 12 18 8 30-4 10-16 14-26 14 20-10 12-46 0-70z" fill="#8fae1c" opacity="0.4" />
      <path d="M50 20c0-6 2-10 6-14" stroke="#5b3a1c" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M54 14c6-6 14-6 18-2-4 6-12 8-18 2z" fill={LEAF} />
      <Shine d="M36 58c0-8 4-14 8-18-3 8-4 16-2 24z" />
    </>
  ),
  strawberry: (
    <>
      <path d="M50 90C28 78 16 58 22 42c4-12 18-14 28-8 10-6 24-4 28 8 6 16-6 36-28 48z" fill="#e0314f" />
      <path d="M50 90c22-12 34-32 28-48-2-6-8-10-14-10 8 18 0 44-14 58z" fill="#b02a5b" opacity="0.45" />
      <g fill="#fbe9a0">
        <ellipse cx="38" cy="52" rx="2" ry="3" />
        <ellipse cx="52" cy="48" rx="2" ry="3" />
        <ellipse cx="64" cy="56" rx="2" ry="3" />
        <ellipse cx="44" cy="66" rx="2" ry="3" />
        <ellipse cx="58" cy="70" rx="2" ry="3" />
        <ellipse cx="50" cy="80" rx="2" ry="3" />
      </g>
      <path d="M50 36l-16-6 10-2-6-8 12 6 6-10 4 10 12-6-6 8 10 2-16 6z" fill={LEAF} />
    </>
  ),
  mushroom: (
    <>
      <path d="M38 58h24l4 28c0 4-4 6-8 6H42c-4 0-8-2-8-6z" fill="#f1e3c6" />
      <path d="M10 58C10 30 28 14 50 14s40 16 40 44z" fill="#d6552e" />
      <path d="M50 14c22 0 40 16 40 44H62C74 40 66 22 50 14z" fill="#b13a1a" opacity="0.4" />
      <circle cx="32" cy="38" r="6" fill="#fffdf8" />
      <circle cx="56" cy="30" r="5" fill="#fffdf8" />
      <circle cx="72" cy="46" r="5" fill="#fffdf8" />
      <circle cx="46" cy="48" r="4" fill="#fffdf8" />
    </>
  ),
  corn: (
    <>
      <path d="M50 8c14 8 22 24 22 44 0 20-8 32-22 40-14-8-22-20-22-40 0-20 8-36 22-44z" fill="#f7d339" />
      <g stroke="#d9a915" strokeWidth="2" opacity="0.7">
        <path d="M50 14v74M36 26v56M64 26v56M28 46h44M30 62h40M34 78h32M36 32h28" />
      </g>
      <path d="M50 94C34 88 22 74 22 54c8 8 14 14 28 18zM50 94c16-6 28-20 28-40-8 8-14 14-28 18z" fill={LEAF} />
      <path d="M50 94c-6-8-6-18 0-22 6 4 6 14 0 22z" fill={LEAF_LIGHT} />
    </>
  ),
  orange: (
    <>
      <circle cx="50" cy="54" r="34" fill="#f08a24" />
      <path d="M50 20A34 34 0 0 1 50 88A20 34 0 0 0 50 20Z" fill="#c9680f" opacity="0.4" />
      <path d="M50 22c-2-6 0-10 4-14 6 2 10 6 10 12-4 4-10 4-14 2z" fill={LEAF} />
      <Shine d="M28 50a24 24 0 0 1 14-20c-8 8-12 16-12 26z" />
    </>
  ),
  cucumber: (
    <>
      <rect x="12" y="34" width="76" height="32" rx="16" fill="#4e9a2a" transform="rotate(-25 50 50)" />
      <rect x="20" y="54" width="60" height="12" rx="6" fill="#2e6b14" opacity="0.4" transform="rotate(-25 50 50)" />
      <g fill="#a6d36a" transform="rotate(-25 50 50)">
        <circle cx="30" cy="46" r="2" />
        <circle cx="46" cy="42" r="2" />
        <circle cx="62" cy="48" r="2" />
        <circle cx="76" cy="44" r="2" />
        <circle cx="38" cy="54" r="2" />
        <circle cx="54" cy="56" r="2" />
      </g>
      <path d="M20 66c4-4 8-4 10 0" stroke={LEAF_DARK} strokeWidth="3" strokeLinecap="round" fill="none" />
    </>
  ),
  beet: (
    <>
      <path d="M50 30c-20 0-34 14-34 32 0 16 14 26 28 26 2 4 4 8 6 8s4-4 6-8c14 0 28-10 28-26 0-18-14-32-34-32z" fill="#a4204a" />
      <path d="M50 30c20 0 34 14 34 32 0 16-14 26-28 26 14-8 20-34-6-58z" fill="#7a1236" opacity="0.5" />
      <path d="M50 30c-6-8-6-16-2-24 6 4 8 14 2 24zM50 30c8-6 16-6 22-2-4 8-14 8-22 2zM50 30c-8-6-16-6-22-2 4 8 14 8 22 2z" fill={LEAF} />
      <Shine d="M28 56c0-8 4-14 10-18-4 7-5 14-4 22z" />
    </>
  ),
  cherry: (
    <>
      <path d="M32 62c4-20 10-36 20-50M70 66C66 46 60 28 52 12" stroke={LEAF_DARK} strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M52 12c10-6 22-4 28 2-8 6-20 6-28-2z" fill={LEAF} />
      <circle cx="30" cy="72" r="18" fill="#c4163f" />
      <circle cx="70" cy="74" r="18" fill="#c4163f" />
      <path d="M30 54a18 18 0 0 1 0 36c10-6 14-22 0-36zM70 56a18 18 0 0 1 0 36c10-6 14-22 0-36z" fill="#8c0e2d" opacity="0.45" />
      <circle cx="24" cy="66" r="4" fill="#fff" opacity="0.4" />
      <circle cx="64" cy="68" r="4" fill="#fff" opacity="0.4" />
    </>
  ),
  peas: (
    <>
      <path d="M10 40c0-12 12-18 28-18h24c16 0 28 6 28 18 0 20-14 40-40 40S10 60 10 40z" fill={LEAF} transform="rotate(-8 50 50)" />
      <path d="M12 48c4 22 18 30 38 30s34-12 38-34c-6 16-20 24-38 24S18 62 12 48z" fill={LEAF_DARK} opacity="0.4" transform="rotate(-8 50 50)" />
      <circle cx="30" cy="46" r="10" fill={LEAF_LIGHT} />
      <circle cx="50" cy="48" r="10" fill={LEAF_LIGHT} />
      <circle cx="70" cy="44" r="10" fill={LEAF_LIGHT} />
      <circle cx="27" cy="43" r="3" fill="#fff" opacity="0.5" />
      <circle cx="47" cy="45" r="3" fill="#fff" opacity="0.5" />
      <circle cx="67" cy="41" r="3" fill="#fff" opacity="0.5" />
    </>
  ),
  grapes: (
    <>
      <path d="M50 22c0-6 2-10 6-14" stroke="#5b3a1c" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d="M54 12c6-6 16-6 22 0-6 6-16 6-22 0z" fill={LEAF} />
      <g fill="#7b3f9e">
        <circle cx="34" cy="38" r="11" />
        <circle cx="56" cy="38" r="11" />
        <circle cx="68" cy="52" r="11" />
        <circle cx="44" cy="52" r="11" />
        <circle cx="26" cy="54" r="11" />
        <circle cx="56" cy="66" r="11" />
        <circle cx="36" cy="68" r="11" />
        <circle cx="48" cy="82" r="11" />
      </g>
      <g fill="#fff" opacity="0.35">
        <circle cx="30" cy="34" r="3" />
        <circle cx="52" cy="34" r="3" />
        <circle cx="64" cy="48" r="3" />
        <circle cx="40" cy="48" r="3" />
      </g>
    </>
  ),
};

export default function Produce({ name, className = "" }: { name: ProduceName; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="50" cy="94" rx="26" ry="4" fill="#161a10" opacity="0.08" />
      {ART[name]}
    </svg>
  );
}
