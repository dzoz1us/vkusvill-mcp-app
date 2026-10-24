import type { ReactNode } from "react";

/* Набор плоских «продуктовых» форм для иллюстраций блюд (вид сверху, холст 120×120). */

export const C = {
  ink: "#2b1b14",
  white: "#fffdf8",
  plate: "#ffffff",
  plateRim: "#e8e2d6",
  plateIn: "#f7f4ec",
  tomato: "#e4572e",
  tomatoDark: "#c23a17",
  red: "#d6334a",
  cream: "#f6e7c1",
  gold: "#e9b44c",
  goldDark: "#c98d27",
  brown: "#a8632a",
  brownDark: "#7a4119",
  green: "#78b43b",
  greenDark: "#4e8a27",
  greenLight: "#a6d36a",
  yellow: "#f4c93a",
  orange: "#f08a24",
  purple: "#7b3f9e",
  berry: "#b02a5b",
  blue: "#3a5fa8",
  pink: "#f4a6b8",
  beige: "#efe0c4",
  butter: "#fbe9a0",
};

/** Детерминированный «рандом»: рисунок всегда один и тот же. */
export function scatter(n: number, seed: number, radius: number, cx = 60, cy = 60) {
  let s = seed * 9301 + 49297;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
  const pts: { x: number; y: number; a: number; k: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const d = Math.sqrt(rnd()) * radius;
    pts.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d, a: rnd() * 360, k: rnd() });
  }
  return pts;
}

interface Place {
  x?: number;
  y?: number;
  r?: number;
  s?: number;
}
const at = ({ x = 0, y = 0, r = 0, s = 1 }: Place) =>
  `translate(${x} ${y}) rotate(${r}) scale(${s})`;

/* ---------- Посуда ---------- */

export const Plate = ({ children }: { children?: ReactNode }) => (
  <g>
    <ellipse cx="60" cy="67" rx="50" ry="46" fill="#000" opacity=".09" />
    <circle cx="60" cy="60" r="50" fill={C.plate} />
    <circle cx="60" cy="60" r="50" fill="none" stroke={C.plateRim} strokeWidth="1.6" />
    <circle cx="60" cy="60" r="38" fill={C.plateIn} />
    <circle cx="60" cy="60" r="38" fill="none" stroke="#ece6d9" strokeWidth="1" />
    {children}
  </g>
);

export const Bowl = ({
  rim = "#ffffff",
  inside = "#f1ede4",
  children,
}: {
  rim?: string;
  inside?: string;
  children?: ReactNode;
}) => (
  <g>
    <ellipse cx="60" cy="67" rx="50" ry="46" fill="#000" opacity=".1" />
    <circle cx="60" cy="60" r="50" fill={rim} />
    <circle cx="60" cy="60" r="50" fill="none" stroke="#000" strokeOpacity=".08" strokeWidth="1.5" />
    <circle cx="60" cy="60" r="43" fill="#000" opacity=".07" />
    <circle cx="60" cy="60" r="40" fill={inside} />
    <path d="M26 44a40 40 0 0 1 22-14" stroke="#fff" strokeOpacity=".45" strokeWidth="3" fill="none" strokeLinecap="round" />
    {children}
  </g>
);

export const Glass = ({
  fill,
  top,
  children,
}: {
  fill: string;
  top?: string;
  children?: ReactNode;
}) => (
  <g>
    <ellipse cx="60" cy="108" rx="26" ry="5" fill="#000" opacity=".1" />
    <path d="M38 26h44l-5 78a6 6 0 0 1-6 5H49a6 6 0 0 1-6-5z" fill="#fff" opacity=".7" />
    <path d="M40 40h40l-4.2 62a4 4 0 0 1-4 3.6H48.2a4 4 0 0 1-4-3.6z" fill={fill} />
    <path d="M40 40h40l-.6 8H40.6z" fill={top ?? "#fff"} opacity=".55" />
    <path d="M45 50l3 48" stroke="#fff" strokeOpacity=".5" strokeWidth="3" strokeLinecap="round" />
    <path d="M70 10l-6 38" stroke={C.tomato} strokeWidth="4" strokeLinecap="round" />
    <path d="M69 16l-1.6 10M67.6 28l-1 6" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".9" />
    {children}
  </g>
);

/* ---------- Ягоды, фрукты, овощи ---------- */

export const Berry = ({ x, y, c = C.berry, s = 1 }: Place & { c?: string }) => (
  <g transform={at({ x, y, s })}>
    <circle r="4.4" fill={c} />
    <circle cx="-1.4" cy="-1.6" r="1.3" fill="#fff" opacity=".55" />
  </g>
);

export const Strawberry = (p: Place) => (
  <g transform={at(p)}>
    <path d="M0 6C-7 1-7-5-3-6c2-.6 3 .4 3 .4s1-1 3-.4c4 1 4 7-3 12z" fill={C.red} />
    <path d="M-3-6.5l3-2 3 2z" fill={C.green} />
    <circle cx="-1.5" cy="-1" r=".7" fill={C.butter} />
    <circle cx="1.5" cy="0" r=".7" fill={C.butter} />
    <circle cx="0" cy="3" r=".7" fill={C.butter} />
  </g>
);

export const Leaf = ({ c = C.green, ...p }: Place & { c?: string }) => (
  <g transform={at(p)}>
    <path d="M0-8C6-4 6 4 0 8-6 4-6-4 0-8z" fill={c} />
    <path d="M0-6v12" stroke="#fff" strokeOpacity=".4" strokeWidth=".9" />
  </g>
);

export const Dill = (p: Place) => (
  <g transform={at(p)} stroke={C.greenDark} strokeWidth="1.1" strokeLinecap="round" fill="none">
    <path d="M0 6V-6M0 2l-4-3M0 2l4-3M0-1l-4-3M0-1l4-3M0-4l-3-2M0-4l3-2" />
  </g>
);

export const Tomato = ({ cherry, ...p }: Place & { cherry?: boolean }) => (
  <g transform={at(p)}>
    <circle r={cherry ? 4.6 : 6.4} fill={C.tomato} />
    <circle cx="-1.6" cy="-2" r={cherry ? 1.2 : 1.8} fill="#fff" opacity=".5" />
    <path d="M-2-5.4l2 1 2-1" stroke={C.greenDark} strokeWidth="1.6" fill="none" strokeLinecap="round" />
  </g>
);

export const TomatoWedge = (p: Place) => (
  <g transform={at(p)}>
    <path d="M-7 3a8 8 0 0 1 14 0z" fill={C.tomato} />
    <path d="M-5 2.4a6 6 0 0 1 10 0z" fill="#f7a08a" />
    <path d="M-1.5 2.2l.6-3M1.5 2.2l-.6-3" stroke={C.butter} strokeWidth=".8" />
  </g>
);

export const CucSlice = (p: Place) => (
  <g transform={at(p)}>
    <circle r="5.6" fill={C.greenDark} />
    <circle r="4.4" fill="#d6ecb0" />
    <circle r="2" fill="#eaf6cd" />
    {[0, 72, 144, 216, 288].map((a) => (
      <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 2.8} cy={Math.sin((a * Math.PI) / 180) * 2.8} r=".6" fill={C.greenDark} opacity=".6" />
    ))}
  </g>
);

export const CarrotRound = (p: Place) => (
  <g transform={at(p)}>
    <circle r="4.2" fill={C.orange} />
    <circle r="2.4" fill="#f9b25c" />
    <circle r=".8" fill={C.orange} />
  </g>
);

export const Pea = ({ x, y }: Place) => (
  <g transform={at({ x, y })}>
    <circle r="2.3" fill={C.green} />
    <circle cx="-.7" cy="-.8" r=".7" fill="#fff" opacity=".5" />
  </g>
);

export const Corn = ({ x, y }: Place) => <circle cx={x} cy={y} r="1.9" fill={C.yellow} />;

export const Onion = (p: Place) => (
  <g transform={at(p)} fill="none" stroke="#c9a6d4" strokeWidth="1.3">
    <circle r="5" />
    <circle r="2.6" />
  </g>
);

export const Olive = (p: Place) => (
  <g transform={at(p)}>
    <ellipse rx="3.4" ry="2.8" fill="#3b3a2e" />
    <circle r="1" fill="#a64b3a" />
  </g>
);

export const Lemon = (p: Place) => (
  <g transform={at(p)}>
    <circle r="7" fill={C.yellow} />
    <circle r="5.6" fill="#fbe27a" />
    {[0, 60, 120, 180, 240, 300].map((a) => (
      <path key={a} d="M0 0L0-5.4" stroke={C.yellow} strokeWidth="1.1" transform={`rotate(${a})`} />
    ))}
  </g>
);

export const Mushroom = (p: Place) => (
  <g transform={at(p)}>
    <path d="M-7 1a7 7 0 0 1 14 0z" fill="#b98a5b" />
    <path d="M-2.2 1h4.4v5.6a2.2 2.2 0 0 1-4.4 0z" fill="#efe1c8" />
    <path d="M-4.5-2a5 5 0 0 1 3-2" stroke="#fff" strokeOpacity=".4" strokeWidth="1" fill="none" strokeLinecap="round" />
  </g>
);

export const Broccoli = (p: Place) => (
  <g transform={at(p)}>
    <path d="M-1.6 2h3.2l1 7h-5.2z" fill={C.greenLight} />
    <circle cx="-4.4" cy="-.4" r="4" fill={C.greenDark} />
    <circle cx="4.4" cy="-.4" r="4" fill={C.greenDark} />
    <circle cx="0" cy="-3.6" r="4.6" fill={C.green} />
    <circle cx="-1.6" cy="-5" r="1.2" fill="#b7de80" opacity=".8" />
  </g>
);

export const Cauliflower = (p: Place) => (
  <g transform={at(p)}>
    <path d="M-1.6 2h3.2l1 6h-5.2z" fill={C.greenLight} />
    <circle cx="-4" cy="-.4" r="4" fill="#f1e8d0" />
    <circle cx="4" cy="-.4" r="4" fill="#f1e8d0" />
    <circle cx="0" cy="-3.4" r="4.6" fill="#faf3df" />
  </g>
);

export const Pepper = (p: Place & { c?: string }) => (
  <g transform={at(p)}>
    <path d="M-5-3C-5-7 5-7 5-3c0 6-2 8-5 9-3-1-5-3-5-9z" fill={p.c ?? C.red} />
    <path d="M-1-6l1-3 1 3z" fill={C.greenDark} />
    <path d="M-3-2c0-2 1-3 2-3.4" stroke="#fff" strokeOpacity=".45" strokeWidth="1.1" fill="none" strokeLinecap="round" />
  </g>
);

export const Zucchini = (p: Place) => (
  <g transform={at(p)}>
    <circle r="5.6" fill={C.greenDark} />
    <circle r="4.4" fill="#cfe7a0" />
    <circle r="1.4" fill="#e6f3c6" />
  </g>
);

export const Eggplant = (p: Place) => (
  <g transform={at(p)}>
    <ellipse rx="6.6" ry="5.2" fill="#4a2a63" />
    <ellipse rx="4.8" ry="3.6" fill="#e9dcc2" />
  </g>
);

export const Potato = (p: Place) => (
  <g transform={at(p)}>
    <path d="M-6 1a7 7 0 0 1 12 0c0 3-3 4-6 4s-6-1-6-4z" fill={C.gold} />
    <path d="M-4 0a4.6 4.6 0 0 1 8 0" stroke={C.goldDark} strokeWidth="1" fill="none" strokeLinecap="round" opacity=".7" />
  </g>
);

export const PotatoCube = (p: Place) => (
  <g transform={at(p)}>
    <rect x="-4.6" y="-4.6" width="9.2" height="9.2" rx="2.4" fill={C.gold} />
    <rect x="-3.4" y="-3.4" width="6.8" height="6.8" rx="1.8" fill="#f3cf7a" />
  </g>
);

export const Apple = (p: Place) => (
  <g transform={at(p)}>
    <path d="M0-4C-8-8-12 2-6 8c3 3 5 1 6 1s3 2 6-1c6-6 2-16-6-12z" fill={C.red} />
    <path d="M-3-1c0-2 1-3 2-3.4" stroke="#fff" strokeOpacity=".5" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    <path d="M0-4l1-4" stroke={C.brownDark} strokeWidth="1.4" strokeLinecap="round" />
  </g>
);

export const AppleSlice = (p: Place) => (
  <g transform={at(p)}>
    <path d="M-5 3a6 6 0 0 1 10 0z" fill="#fff6d6" stroke={C.red} strokeWidth="1.2" />
  </g>
);

export const Banana = (p: Place) => (
  <g transform={at(p)}>
    <circle r="4.4" fill="#f9e27a" />
    <circle r="3" fill="#fff3b8" />
  </g>
);

/* ---------- Мясо, рыба, яйца, сыр ---------- */

export const Drumstick = (p: Place) => (
  <g transform={at(p)}>
    <rect x="9" y="-1.8" width="11" height="3.6" rx="1.8" fill="#f2e6d0" />
    <circle cx="20.5" cy="-1.6" r="2.2" fill="#f2e6d0" />
    <circle cx="20.5" cy="1.6" r="2.2" fill="#f2e6d0" />
    <path d="M-10 0C-10-9 4-11 10-4c2 3 2 5 0 8-6 7-20 5-20-4z" fill={C.brown} />
    <path d="M-6-4c3-3 8-3 11 0" stroke="#e0a561" strokeWidth="2" strokeLinecap="round" fill="none" />
  </g>
);

export const ChickenPiece = (p: Place) => (
  <g transform={at(p)}>
    <path d="M-13 0C-13-9 0-12 9-6c6 4 5 11-2 13-8 2-20 0-20-7z" fill="#e0a45b" />
    <path d="M-8-3c3-3 9-3 13 0" stroke="#f4cb8d" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    <circle cx="2" cy="3" r="1" fill={C.brown} opacity=".6" />
    <circle cx="-4" cy="4" r="1" fill={C.brown} opacity=".6" />
  </g>
);

export const GrillMarks = ({ w = 22 }: { w?: number }) => (
  <g stroke={C.brownDark} strokeWidth="1.8" strokeLinecap="round" opacity=".55">
    {[-6, 0, 6].map((d) => (
      <path key={d} d={`M${d - 3} ${-w / 5}l6 ${w / 3}`} />
    ))}
  </g>
);

export const Cutlet = (p: Place) => (
  <g transform={at(p)}>
    <ellipse rx="10" ry="7.4" fill={C.brownDark} />
    <ellipse rx="9" ry="6.4" fill="#b87333" />
    <path d="M-5-3c3-2.4 7-2.4 10 0" stroke="#dba15f" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    <circle cx="3" cy="2" r=".8" fill={C.brownDark} opacity=".6" />
    <circle cx="-3" cy="2.6" r=".8" fill={C.brownDark} opacity=".6" />
  </g>
);

export const Meatball = (p: Place) => (
  <g transform={at(p)}>
    <circle r="6" fill="#8a4a24" />
    <circle cx="-1.6" cy="-2" r="2" fill="#b5703c" opacity=".8" />
  </g>
);

export const Salmon = (p: Place) => (
  <g transform={at(p)}>
    <path d="M-17-5C-9-11 9-11 17-5c2 4 0 10-4 11C5 9-9 9-15 7c-4-1-5-8-2-12z" fill="#f08a63" />
    <path d="M-12-3C-4-6 8-6 14-2M-13 2C-5-1 7-1 13 3" stroke="#fbd3bf" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M-14-6c8-4 20-4 28 0" stroke="#fff" strokeOpacity=".35" strokeWidth="1.6" strokeLinecap="round" fill="none" />
  </g>
);

export const FishFillet = (p: Place) => (
  <g transform={at(p)}>
    <path d="M-17-4C-8-11 8-11 17-4c2 5-1 9-5 10-9 2-20 0-26-3-3-1-3-3-3-3z" fill="#f0d9ae" />
    <path d="M-10-3c8-3 16-3 22 0" stroke="#fff" strokeOpacity=".7" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <path d="M-12 2c8-2 16-2 22 1" stroke={C.gold} strokeWidth="1.4" strokeLinecap="round" fill="none" opacity=".7" />
  </g>
);

export const Steak = (p: Place) => (
  <g transform={at(p)}>
    <path d="M-16-3C-12-12 8-13 15-6c4 4 2 11-4 12-10 2-22 2-26-3-1-1-1-2-1-2z" fill="#8a3f26" />
    <path d="M-12-3C-6-8 6-8 12-3" stroke="#b86a47" strokeWidth="2" strokeLinecap="round" fill="none" />
    <g stroke="#4c2113" strokeWidth="1.7" strokeLinecap="round" opacity=".7">
      <path d="M-8-5l7 10M-1-6l7 10M6-5l5 8" />
    </g>
  </g>
);

export const EggYolk = (p: Place) => (
  <g transform={at(p)}>
    <ellipse rx="8" ry="6.6" fill="#fff" />
    <circle cx="-.6" cy="0" r="3.6" fill={C.yellow} />
    <circle cx="-1.8" cy="-1.2" r="1" fill="#fff" opacity=".6" />
  </g>
);

export const CheeseCube = (p: Place) => (
  <g transform={at(p)}>
    <rect x="-4.4" y="-4.4" width="8.8" height="8.8" rx="1.2" fill="#fffaf0" stroke="#e8dec6" strokeWidth=".8" />
    <circle cx="-1" cy="-1" r=".7" fill="#e8dec6" />
  </g>
);

export const Bacon = (p: Place) => (
  <g transform={at(p)}>
    <rect x="-5" y="-2.4" width="10" height="4.8" rx="1.6" fill="#d9715b" />
    <path d="M-3.4-.4h6.8" stroke="#f5c3b4" strokeWidth="1.2" strokeLinecap="round" />
  </g>
);

export const Crouton = (p: Place) => (
  <g transform={at(p)}>
    <rect x="-4.4" y="-4.4" width="8.8" height="8.8" rx="2" fill="#e5b663" />
    <rect x="-3" y="-3" width="6" height="6" rx="1.4" fill="#f4d58f" />
  </g>
);

/* ---------- Крупы, паста ---------- */

export const Grains = ({
  n = 40,
  seed = 3,
  radius = 26,
  color = "#fffdf6",
  cx = 60,
  cy = 60,
  w = 2.8,
}: {
  n?: number;
  seed?: number;
  radius?: number;
  color?: string;
  cx?: number;
  cy?: number;
  w?: number;
}) => (
  <g>
    {scatter(n, seed, radius, cx, cy).map((p, i) => (
      <ellipse key={i} cx={p.x} cy={p.y} rx={w} ry={w * 0.55} transform={`rotate(${p.a} ${p.x} ${p.y})`} fill={color} />
    ))}
  </g>
);

export const Pasta = ({
  color = "#f2d173",
  cx = 60,
  cy = 60,
  scale = 1,
}: {
  color?: string;
  cx?: number;
  cy?: number;
  scale?: number;
}) => (
  <g transform={`translate(${cx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`} fill="none" strokeLinecap="round">
    {[27, 22, 17, 12, 7].map((r, i) => (
      <ellipse
        key={r}
        cx={cx + (i % 2 ? 1.6 : -1.6)}
        cy={cy}
        rx={r}
        ry={r * 0.9}
        strokeWidth="4.4"
        stroke={color}
        strokeDasharray={i % 2 ? "30 4" : "46 6"}
        transform={`rotate(${i * 41} ${cx} ${cy})`}
      />
    ))}
    {[27, 17, 7].map((r, i) => (
      <ellipse
        key={r}
        cx={cx}
        cy={cy - 1}
        rx={r - 1}
        ry={(r - 1) * 0.9}
        strokeWidth="1.2"
        stroke="#fff"
        strokeOpacity=".4"
        strokeDasharray="12 22"
        transform={`rotate(${i * 70} ${cx} ${cy})`}
      />
    ))}
    <circle cx={cx} cy={cy} r="4" fill={color} stroke="none" />
  </g>
);

export const Steam = ({ x = 60, y = 14 }: { x?: number; y?: number }) => (
  <g stroke="#fff" strokeOpacity=".75" strokeWidth="2.4" strokeLinecap="round" fill="none">
    <path d={`M${x - 10} ${y + 8}c-3-4 3-6 0-10`} />
    <path d={`M${x} ${y + 10}c-3-4 3-6 0-10`} />
    <path d={`M${x + 10} ${y + 8}c-3-4 3-6 0-10`} />
  </g>
);
