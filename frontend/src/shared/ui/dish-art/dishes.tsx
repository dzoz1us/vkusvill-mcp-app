import type { ReactNode } from "react";
import {
  Apple,
  AppleSlice,
  Bacon,
  Banana,
  Berry,
  Bowl,
  Broccoli,
  C,
  CarrotRound,
  Cauliflower,
  CheeseCube,
  ChickenPiece,
  Corn,
  Crouton,
  CucSlice,
  Cutlet,
  Dill,
  Drumstick,
  EggYolk,
  Eggplant,
  FishFillet,
  Glass,
  Grains,
  GrillMarks,
  Leaf,
  Lemon,
  Meatball,
  Mushroom,
  Olive,
  Onion,
  Pasta,
  Pea,
  Pepper,
  Plate,
  Potato,
  PotatoCube,
  Salmon,
  scatter,
  Steak,
  Steam,
  Strawberry,
  Tomato,
  TomatoWedge,
  Zucchini,
} from "./primitives";

export interface DishDrawing {
  bg: string;
  art: ReactNode;
}

const CREAM = "#fff4d6";
const LEAF = "#eef7dc";
const TOMATO = "#fdebe5";
const BERRY = "#fbe7ee";
const SKY = "#e5f2fb";
const SAND = "#f6efe2";

/** Рассыпанные ингредиенты внутри круга. */
const Bits = ({
  n,
  seed,
  radius,
  cx = 60,
  cy = 60,
  render,
}: {
  n: number;
  seed: number;
  radius: number;
  cx?: number;
  cy?: number;
  render: (p: { x: number; y: number; a: number; k: number }, i: number) => ReactNode;
}) => <g>{scatter(n, seed, radius, cx, cy).map((p, i) => <g key={i}>{render(p, i)}</g>)}</g>;

/** Завиток сметаны / сливок. */
const Swirl = ({ x = 60, y = 60, s = 1, c = "#fffdf8" }: { x?: number; y?: number; s?: number; c?: string }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r="9" fill={c} />
    <path d="M-5 0a5 5 0 0 1 10 0 3 3 0 0 1-6 0" fill="none" stroke="#e9e1cf" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="-3" cy="-4" r="1.6" fill="#fff" opacity=".8" />
  </g>
);

const Dollop = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`}>
    <ellipse rx="5.4" ry="4.4" fill="#fffdf8" />
    <ellipse cx="-1.4" cy="-1.4" rx="2" ry="1.2" fill="#fff" />
    <ellipse rx="5.4" ry="4.4" fill="none" stroke="#eadfca" strokeWidth=".8" />
  </g>
);

const Pot = ({ children, inside = "#e9d9b0" }: { children?: ReactNode; inside?: string }) => (
  <g>
    <ellipse cx="60" cy="67" rx="52" ry="46" fill="#000" opacity=".1" />
    <rect x="3" y="52" width="14" height="16" rx="5" fill="#2f5d62" />
    <rect x="103" y="52" width="14" height="16" rx="5" fill="#2f5d62" />
    <circle cx="60" cy="60" r="46" fill="#3f7b82" />
    <circle cx="60" cy="60" r="41" fill="#2f5d62" />
    <circle cx="60" cy="60" r="37" fill={inside} />
    {children}
  </g>
);

const Pan = ({ children }: { children?: ReactNode }) => (
  <g>
    <ellipse cx="55" cy="68" rx="46" ry="42" fill="#000" opacity=".12" />
    <rect x="92" y="54" width="26" height="9" rx="4.5" fill="#4a3a2d" />
    <circle cx="55" cy="60" r="46" fill="#3a3f44" />
    <circle cx="55" cy="60" r="41" fill="#2a2e32" />
    <circle cx="55" cy="60" r="36" fill="#d9a94d" opacity=".25" />
    {children}
  </g>
);

const Mound = ({ cx = 60, cy = 60, r = 20, c = "#fffdf6", seed = 4, grain = "#f3ecd8", n = 60 }) => (
  <g>
    <ellipse cx={cx + 1.5} cy={cy + 2.5} rx={r} ry={r * 0.9} fill="#000" opacity=".08" />
    <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.9} fill={c} />
    <Grains n={n} seed={seed} radius={r - 4} cx={cx} cy={cy} color={grain} w={2.6} />
  </g>
);

export const DISHES: Record<string, DishDrawing> = {
  "oatmeal-berries": {
    bg: BERRY,
    art: (
      <Bowl rim="#c9deef" inside="#ecd8ae">
        <Grains n={70} seed={2} radius={31} color="#f7e9c9" w={2.8} />
        <Bits n={8} seed={5} radius={19} render={(p, i) => <Berry x={p.x} y={p.y} c={["#b02a5b", "#3a5fa8", "#7b3f9e", "#d6334a"][i % 4]} />} />
        <Strawberry x={46} y={50} r={-20} s={1.1} />
        <Strawberry x={72} y={68} r={30} s={1.1} />
        <Leaf x={64} y={46} r={40} c={C.green} />
        <path d="M32 74c8-6 14 2 22-3s14-6 22-1" stroke="#e7a928" strokeWidth="3" fill="none" strokeLinecap="round" />
      </Bowl>
    ),
  },
  "oatmeal-plain": {
    bg: CREAM,
    art: (
      <Bowl rim="#f3d6bd" inside="#ecd8ae">
        <Grains n={90} seed={9} radius={32} color="#f7e9c9" w={2.8} />
        <rect x="51" y="50" width="16" height="12" rx="3" fill={C.butter} />
        <rect x="53" y="52" width="6" height="3" rx="1.5" fill="#fff" opacity=".7" />
        <Steam x={62} y={12} />
      </Bowl>
    ),
  },
  "oat-pie": {
    bg: BERRY,
    art: (
      <Plate>
        <rect x="30" y="38" width="60" height="40" rx="9" fill="#c98d27" />
        <rect x="32" y="38" width="56" height="32" rx="8" fill="#e8b655" />
        <Bits n={9} seed={7} radius={22} cx={60} cy={54} render={(p, i) => <Berry x={p.x} y={p.y} c={i % 2 ? "#b02a5b" : "#3a5fa8"} />} />
        <Bits n={14} seed={4} radius={26} cx={60} cy={54} render={(p) => <circle cx={p.x} cy={p.y} r="1" fill="#fff" opacity=".8" />} />
        <Strawberry x={92} y={34} r={20} />
        <Leaf x={86} y={28} r={50} />
      </Plate>
    ),
  },
  syrniki: {
    bg: CREAM,
    art: (
      <Plate>
        {[
          [42, 46],
          [76, 48],
          [44, 76],
          [76, 76],
        ].map(([x, y], i) => (
          <g key={i}>
            <ellipse cx={x + 1.5} cy={y + 3} rx="14" ry="12.5" fill="#000" opacity=".1" />
            <ellipse cx={x} cy={y} rx="14" ry="12.5" fill="#b9791f" />
            <ellipse cx={x} cy={y - 1} rx="12.6" ry="11" fill="#e3a947" />
            <ellipse cx={x} cy={y - 1} rx="9" ry="7.6" fill="#efc068" />
            <path d={`M${x - 9} ${y - 5}a10 9 0 0 1 9-5`} stroke="#f8dc9a" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <circle cx={x - 4} cy={y + 3} r=".9" fill="#b9791f" opacity=".7" />
            <circle cx={x + 5} cy={y + 2} r=".9" fill="#b9791f" opacity=".7" />
            <g transform={`translate(${x + 3} ${y - 3}) scale(.8)`}>
              <Dollop x={0} y={0} />
            </g>
          </g>
        ))}
        <g transform="translate(60 60)">
          <circle r="5" fill="#c4213a" />
          <circle cx="-1.4" cy="-1.4" r="1.4" fill="#fff" opacity=".5" />
        </g>
        <Leaf x={60} y={52} r={30} s={0.9} />
      </Plate>
    ),
  },
  omelette: {
    bg: CREAM,
    art: (
      <Plate>
        <path d="M22 66c0-22 18-32 38-32s38 10 38 32c0 6-6 10-14 10H36c-8 0-14-4-14-10z" fill="#d9a62a" />
        <path d="M24 64c0-20 17-28 36-28s36 8 36 28c0 4-5 7-12 7H36c-7 0-12-3-12-7z" fill="#f6cf4a" />
        <path d="M34 46c6-5 14-7 22-7" stroke="#fff3b0" strokeWidth="3" fill="none" strokeLinecap="round" />
        <Bits n={12} seed={3} radius={24} cx={60} cy={58} render={(p) => <circle cx={p.x} cy={p.y} r="1.5" fill={C.greenDark} />} />
        <TomatoWedge x={36} y={88} r={-10} />
        <TomatoWedge x={50} y={92} r={10} />
        <CucSlice x={84} y={86} />
        <Dill x={96} y={50} r={40} />
      </Plate>
    ),
  },
  "cottage-casserole": {
    bg: BERRY,
    art: (
      <Plate>
        <rect x="30" y="42" width="52" height="38" rx="8" fill="#d79a3c" />
        <rect x="30" y="42" width="52" height="14" rx="8" fill="#eab755" />
        <rect x="30" y="56" width="52" height="24" rx="6" fill="#fbecb8" />
        <Bits n={9} seed={11} radius={20} cx={56} cy={68} render={(p) => <circle cx={p.x} cy={p.y} r="1.2" fill="#e9c97a" />} />
        <Dollop x={88} y={50} />
        <Strawberry x={92} y={72} r={-20} s={1.2} />
        <Strawberry x={74} y={34} r={15} />
        <Leaf x={86} y={40} r={30} />
      </Plate>
    ),
  },
  buckwheat: {
    bg: SAND,
    art: (
      <Bowl rim="#e7c9a8" inside="#8b5a2b">
        <Grains n={110} seed={6} radius={33} color="#b57a3a" w={3} />
        <Grains n={40} seed={8} radius={32} color="#6e4420" w={2.6} />
        <rect x="52" y="48" width="16" height="12" rx="3" fill={C.butter} />
        <Steam x={62} y={12} />
      </Bowl>
    ),
  },
  "buckwheat-mushroom": {
    bg: SAND,
    art: (
      <Plate>
        <Mound cx={60} cy={62} r={27} c="#8b5a2b" grain="#b57a3a" n={110} />
        <Grains n={30} seed={2} radius={22} cx={60} cy={62} color="#6e4420" w={2.6} />
        {[
          [46, 52, -20],
          [62, 46, 10],
          [74, 58, 30],
          [56, 66, -10],
          [68, 72, 20],
        ].map(([x, y, r], i) => (
          <Mushroom key={i} x={x} y={y} r={r} />
        ))}
        <Onion x={42} y={70} s={0.7} />
        <Dill x={86} y={36} r={50} />
      </Plate>
    ),
  },
  "banana-smoothie": {
    bg: CREAM,
    art: (
      <Glass fill="#f6dd7c" top="#fff3c2">
        <Banana x={30} y={54} />
        <Banana x={92} y={70} />
        <path d="M82 30h10v8H82z" fill="none" />
      </Glass>
    ),
  },
  "berry-smoothie": {
    bg: BERRY,
    art: (
      <Glass fill="#c9457a" top="#f4a6c8">
        <Berry x={32} y={72} c="#b02a5b" s={1.4} />
        <Berry x={92} y={60} c="#3a5fa8" s={1.4} />
        <Strawberry x={92} y={86} r={20} s={1.3} />
      </Glass>
    ),
  },
  "green-smoothie": {
    bg: LEAF,
    art: (
      <Glass fill="#8fcc4f" top="#cfeaa0">
        <Leaf x={32} y={64} r={-30} s={1.5} />
        <circle cx="92" cy="70" r="7" fill="#78b43b" />
        <circle cx="92" cy="70" r="4.6" fill="#d8efa8" />
        <circle cx="92" cy="70" r="1.4" fill="#2b1b14" />
      </Glass>
    ),
  },
  "smoothie-bowl": {
    bg: BERRY,
    art: (
      <Bowl rim="#f6d6e0" inside="#d98cb3">
        <Bits n={60} seed={4} radius={34} render={(p) => <circle cx={p.x} cy={p.y} r=".8" fill="#fff" opacity=".35" />} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Banana key={i} x={42 + i * 7} y={50 + Math.sin(i) * 3} />
        ))}
        <Bits n={9} seed={12} radius={16} cx={64} cy={72} render={(p) => <Berry x={p.x} y={p.y} c="#3a5fa8" />} />
        <Strawberry x={42} y={72} r={-20} s={1.1} />
        <Strawberry x={56} y={80} r={20} s={1.1} />
        <Bits n={12} seed={6} radius={22} render={(p) => <ellipse cx={p.x} cy={p.y} rx="1.6" ry=".8" transform={`rotate(${p.a} ${p.x} ${p.y})`} fill="#5b3a1a" />} />
        <Leaf x={78} y={44} r={60} />
      </Bowl>
    ),
  },
  "eggs-tomatoes": {
    bg: TOMATO,
    art: (
      <Plate>
        {[
          [50, 52, 12],
          [68, 50, 11],
          [58, 66, 13],
          [76, 66, 10],
          [42, 68, 9],
        ].map(([x, y, r], i) => (
          <g key={i}>
            <ellipse cx={x} cy={y + 1.5} rx={r + 2} ry={r} fill="#d9a62a" />
            <ellipse cx={x} cy={y} rx={r + 2} ry={r} fill="#f8d65c" />
            <ellipse cx={x - 3} cy={y - 3} rx={r / 2} ry={r / 3} fill="#fff3b0" />
          </g>
        ))}
        <TomatoWedge x={36} y={46} r={-30} />
        <TomatoWedge x={84} y={44} r={30} />
        <TomatoWedge x={80} y={82} r={150} />
        <TomatoWedge x={40} y={84} r={-150} />
        <Dill x={60} y={86} r={90} />
      </Plate>
    ),
  },
  "baked-apples": {
    bg: CREAM,
    art: (
      <Plate>
        {[
          [43, 58, -6],
          [78, 64, 8],
        ].map(([x, y, r], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
            <ellipse cx="2" cy="17" rx="17" ry="4" fill="#000" opacity=".12" />
            <path d="M0-12C-10-20-24-8-18 8c4 12 12 10 18 8 6 2 14 4 18-8 6-16-8-28-18-20z" fill="#9c4421" />
            <path d="M0-10C-8-17-19-7-14 7c3 10 10 8 14 6 4 2 11 4 14-6 5-14-6-24-14-17z" fill="#c76a37" />
            <path d="M-9-4c-2 5 0 10 4 12" stroke="#f0a878" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            <path d="M-7 4q4 2 8 0t8 0" stroke="#8a3a1a" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity=".6" />
            <ellipse cx="0" cy="-9" rx="7" ry="3" fill="#7a3216" />
            <path d="M-5-9q5 4 10 0" stroke="#e7a928" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <path d="M0-13l1-8" stroke="#5e3a17" strokeWidth="2" strokeLinecap="round" />
            <Leaf x={6} y={-20} r={50} s={0.9} />
            <circle cx="-3" cy="-9" r="1.3" fill="#3b1c0c" />
            <circle cx="3" cy="-8" r="1.3" fill="#3b1c0c" />
          </g>
        ))}
        <path d="M28 90c8-6 14 3 22-2s14-6 22 0 14 0 20-4" stroke="#e7a928" strokeWidth="3.2" fill="none" strokeLinecap="round" />
        <rect x="88" y="28" width="20" height="4.4" rx="2.2" fill={C.brown} transform="rotate(30 98 30)" />
        <rect x="90" y="40" width="18" height="4" rx="2" fill="#8a5a2b" transform="rotate(-20 99 42)" />
      </Plate>
    ),
  },
  "rice-apple-porridge": {
    bg: CREAM,
    art: (
      <Bowl rim="#cfe3b3" inside="#fbf3dc">
        <Grains n={80} seed={5} radius={31} color="#ffffff" w={2.4} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <AppleSlice key={i} x={60 + Math.cos((i / 6) * Math.PI * 2) * 17} y={60 + Math.sin((i / 6) * Math.PI * 2) * 17} r={(i / 6) * 360 + 90} />
        ))}
        <Bits n={18} seed={13} radius={22} render={(p) => <circle cx={p.x} cy={p.y} r="1" fill={C.brown} opacity=".7" />} />
        <Steam x={62} y={12} />
      </Bowl>
    ),
  },
  "cheese-tomato-toast": {
    bg: TOMATO,
    art: (
      <Plate>
        <rect x="26" y="30" width="68" height="62" rx="16" fill="#c98d27" />
        <rect x="31" y="35" width="58" height="52" rx="12" fill="#f3d58f" />
        <path d="M31 50c8 6 10-4 18 2s10-4 18 2 12-2 22 2v14c-8 2-12-4-20 0s-12 6-20 0-12 2-18-2z" fill="#f4c93a" />
        {[
          [46, 52],
          [74, 54],
          [60, 72],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="9" fill="#d9452a" />
            <circle cx={x} cy={y} r="6.4" fill="#ef6a4a" />
            {[0, 60, 120].map((a) => (
              <path key={a} d={`M${x} ${y}l0-5`} stroke="#f9b9a6" strokeWidth="1" transform={`rotate(${a} ${x} ${y})`} />
            ))}
          </g>
        ))}
        <Leaf x={86} y={86} r={40} />
      </Plate>
    ),
  },
  "chicken-rice-veg": {
    bg: LEAF,
    art: (
      <Plate>
        <Mound cx={46} cy={64} r={19} />
        <ChickenPiece x={76} y={52} r={-20} s={0.9} />
        <Bits n={9} seed={3} radius={14} cx={46} cy={64} render={(p, i) => (i % 2 ? <Pea x={p.x} y={p.y} /> : <Corn x={p.x} y={p.y} />)} />
        <CarrotRound x={72} y={78} />
        <CarrotRound x={82} y={72} />
        <Pepper x={60} y={84} c={C.red} s={0.8} />
        <Pea x={90} y={64} />
        <Leaf x={36} y={46} r={-30} />
      </Plate>
    ),
  },
  bolognese: {
    bg: TOMATO,
    art: (
      <Plate>
        <Pasta />
        <circle cx="60" cy="60" r="11" fill="#9e2f17" />
        <circle cx="60" cy="60" r="9" fill="#bd3d20" />
        <Bits n={8} seed={5} radius={8} render={(p) => <circle cx={p.x} cy={p.y} r="1.8" fill="#6e2a14" />} />
        <Bits n={9} seed={9} radius={16} render={(p) => <rect x={p.x} y={p.y} width="3.4" height="1.4" rx=".7" fill="#fff8e1" transform={`rotate(${p.a} ${p.x} ${p.y})`} />} />
        <Leaf x={60} y={54} r={20} s={0.9} />
      </Plate>
    ),
  },
  carbonara: {
    bg: CREAM,
    art: (
      <Plate>
        <Pasta color="#f4dc8e" />
        <Bits n={9} seed={4} radius={22} render={(p) => <Bacon x={p.x} y={p.y} r={p.a} s={0.8} />} />
        <EggYolk x={60} y={60} s={0.9} />
        <Bits n={16} seed={8} radius={24} render={(p) => <circle cx={p.x} cy={p.y} r=".8" fill="#2b1b14" />} />
        <Leaf x={78} y={44} r={50} s={0.8} />
      </Plate>
    ),
  },
  plov: {
    bg: CREAM,
    art: (
      <Plate>
        <Mound cx={60} cy={62} r={28} c="#e9b44c" grain="#f6cf6a" n={130} />
        <Bits n={9} seed={2} radius={20} cx={60} cy={62} render={(p) => <rect x={p.x} y={p.y} width="9" height="2.6" rx="1.3" fill={C.orange} transform={`rotate(${p.a} ${p.x} ${p.y})`} />} />
        <Bits n={5} seed={14} radius={16} cx={60} cy={60} render={(p) => <Cutlet x={p.x} y={p.y} r={p.a} s={0.5} />} />
        <Bits n={8} seed={21} radius={22} cx={60} cy={62} render={(p) => <circle cx={p.x} cy={p.y} r="1.4" fill={C.red} />} />
        <g transform="translate(88 40)">
          <circle r="7" fill="#fffdf8" />
          <path d="M0-7v-3M-4-5l-2-2M4-5l2-2" stroke="#c9b98a" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M-3 5q3-8 0-12M3 5q-3-8 0-12" stroke="#e8dec6" strokeWidth="1" fill="none" />
        </g>
      </Plate>
    ),
  },
  "greek-salad": {
    bg: LEAF,
    art: (
      <Bowl rim="#bcd7ea" inside="#f4f7ec">
        {[
          [38, 50, -20],
          [56, 40, 10],
          [78, 48, 40],
          [80, 72, 120],
          [50, 78, 200],
          [36, 66, -60],
        ].map(([x, y, r], i) => (
          <TomatoWedge key={i} x={x} y={y} r={r} s={1.2} />
        ))}
        <CucSlice x={64} y={36} />
        <CucSlice x={42} y={86} />
        <CucSlice x={90} y={60} />
        <Onion x={48} y={50} />
        <Onion x={70} y={82} />
        <Olive x={86} y={44} />
        <Olive x={36} y={78} />
        <Olive x={64} y={90} />
        <rect x="50" y="52" width="20" height="14" rx="3" fill="#fffdf8" stroke="#e8dec6" />
        <Bits n={8} seed={5} radius={8} render={(p) => <circle cx={p.x} cy={p.y} r=".9" fill={C.greenDark} />} />
        <Bits n={3} seed={2} radius={10} cx={72} cy={62} render={(p) => <rect x={p.x} y={p.y} width="11" height="4" rx="2" fill="#e5b663" transform={`rotate(${p.a} ${p.x} ${p.y})`} />} />
      </Bowl>
    ),
  },
  borscht: {
    bg: TOMATO,
    art: (
      <Bowl rim="#ffffff" inside="#a9152a">
        <circle cx="60" cy="60" r="40" fill="#c4213a" opacity=".6" />
        <Bits n={9} seed={7} radius={26} render={(p) => <rect x={p.x} y={p.y} width="4" height="4" rx="1" fill="#7a0f21" transform={`rotate(${p.a} ${p.x} ${p.y})`} />} />
        <Bits n={6} seed={3} radius={26} render={(p) => <CarrotRound x={p.x} y={p.y} s={0.6} />} />
        <Bits n={5} seed={19} radius={24} render={(p) => <rect x={p.x} y={p.y} width="4.4" height="4.4" rx="1" fill="#f2d98a" />} />
        <Swirl x={60} y={60} s={1.3} />
        <Dill x={78} y={42} r={40} />
        <Dill x={44} y={76} r={-130} />
      </Bowl>
    ),
  },
  shchi: {
    bg: LEAF,
    art: (
      <Bowl rim="#e2d6b8" inside="#d8d07a">
        <Bits n={22} seed={4} radius={32} render={(p) => <path d="M0 0q4-5 8 0" transform={`translate(${p.x} ${p.y}) rotate(${p.a})`} stroke="#a6d36a" strokeWidth="2.6" fill="none" strokeLinecap="round" />} />
        <Bits n={6} seed={11} radius={28} render={(p) => <CarrotRound x={p.x} y={p.y} s={0.6} />} />
        <Bits n={6} seed={17} radius={28} render={(p) => <PotatoCube x={p.x} y={p.y} r={p.a} s={0.6} />} />
        <Dollop x={60} y={60} />
        <Dill x={74} y={50} r={40} />
      </Bowl>
    ),
  },
  "chicken-noodle-soup": {
    bg: CREAM,
    art: (
      <Bowl rim="#f0c9a0" inside="#f0cf6a">
        <Bits n={18} seed={3} radius={30} render={(p) => <path d="M0 0q3-5 6 0t6 0" transform={`translate(${p.x} ${p.y}) rotate(${p.a})`} stroke="#fff3cf" strokeWidth="2.4" fill="none" strokeLinecap="round" />} />
        <Bits n={7} seed={8} radius={28} render={(p) => <CarrotRound x={p.x} y={p.y} s={0.7} />} />
        <Bits n={5} seed={15} radius={22} render={(p) => <ellipse cx={p.x} cy={p.y} rx="4" ry="2.4" transform={`rotate(${p.a} ${p.x} ${p.y})`} fill="#e6c79a" />} />
        <Bits n={9} seed={21} radius={30} render={(p) => <circle cx={p.x} cy={p.y} r="1" fill={C.greenDark} />} />
        <Steam x={62} y={12} />
      </Bowl>
    ),
  },
  "mushroom-soup": {
    bg: SAND,
    art: (
      <Bowl rim="#d8c3a2" inside="#e8d4a8">
        <Bits n={8} seed={5} radius={26} render={(p) => <Mushroom x={p.x} y={p.y} r={p.a} s={0.9} />} />
        <Bits n={7} seed={13} radius={26} render={(p) => <PotatoCube x={p.x} y={p.y} r={p.a} s={0.6} />} />
        <Bits n={14} seed={2} radius={30} render={(p) => <circle cx={p.x} cy={p.y} r="1" fill={C.greenDark} />} />
        <Steam x={62} y={12} />
      </Bowl>
    ),
  },
  "broccoli-soup": {
    bg: LEAF,
    art: (
      <Bowl rim="#ffffff" inside="#9cc65a">
        <circle cx="60" cy="60" r="38" fill="#b4d874" opacity=".6" />
        <path d="M34 60c8-10 16 8 26-2s18 8 28-2" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" opacity=".9" />
        {[
          [44, 46],
          [72, 44],
          [76, 76],
          [44, 76],
        ].map(([x, y], i) => (
          <Crouton key={i} x={x} y={y} r={i * 20} s={0.9} />
        ))}
        <Broccoli x={60} y={80} s={0.7} />
      </Bowl>
    ),
  },
  "tomato-cream-soup": {
    bg: TOMATO,
    art: (
      <Bowl rim="#f6dcc8" inside="#e8663a">
        <circle cx="60" cy="60" r="38" fill="#f08a5a" opacity=".5" />
        <Swirl x={60} y={60} s={1.5} c="#fff7ea" />
        <Leaf x={54} y={46} r={-30} s={1.2} />
        <Leaf x={68} y={48} r={30} s={1.2} />
        {[
          [40, 72],
          [80, 72],
          [60, 84],
        ].map(([x, y], i) => (
          <Crouton key={i} x={x} y={y} r={i * 30} s={0.8} />
        ))}
      </Bowl>
    ),
  },
  "tomato-basil-soup": {
    bg: TOMATO,
    art: (
      <Bowl rim="#ffffff" inside="#d9452a">
        <circle cx="60" cy="60" r="38" fill="#e8603f" opacity=".5" />
        {[
          [48, 52, -40],
          [66, 48, 20],
          [60, 68, 100],
          [76, 64, 60],
          [44, 70, -110],
        ].map(([x, y, r], i) => (
          <Leaf key={i} x={x} y={y} r={r} s={1.2} c={i % 2 ? C.green : C.greenDark} />
        ))}
        <Bits n={9} seed={7} radius={26} render={(p) => <circle cx={p.x} cy={p.y} r="1.8" fill={C.yellow} opacity=".85" />} />
        <Bits n={12} seed={3} radius={30} render={(p) => <circle cx={p.x} cy={p.y} r=".8" fill="#2b1b14" />} />
        <Steam x={62} y={12} />
      </Bowl>
    ),
  },
  "veg-rice-soup": {
    bg: LEAF,
    art: (
      <Bowl rim="#c9deef" inside="#ecd27a">
        <Grains n={40} seed={4} radius={30} color="#fffdf6" w={2.4} />
        <Bits n={9} seed={8} radius={28} render={(p) => <CarrotRound x={p.x} y={p.y} s={0.65} />} />
        <Bits n={9} seed={12} radius={28} render={(p) => <Pea x={p.x} y={p.y} />} />
        <Bits n={6} seed={16} radius={26} render={(p) => <PotatoCube x={p.x} y={p.y} r={p.a} s={0.55} />} />
        <Dill x={74} y={48} r={40} />
        <Steam x={62} y={12} />
      </Bowl>
    ),
  },
  "mushroom-risotto": {
    bg: SAND,
    art: (
      <Bowl rim="#b8c4cc" inside="#f3e2b0">
        <Grains n={120} seed={7} radius={32} color="#fff3d2" w={2.6} />
        {[
          [44, 46, -20],
          [62, 42, 10],
          [78, 54, 40],
          [74, 74, 90],
          [52, 76, 160],
          [38, 62, -60],
        ].map(([x, y, r], i) => (
          <Mushroom key={i} x={x} y={y} r={r} s={1.05} />
        ))}
        <Bits n={9} seed={4} radius={14} render={(p) => <rect x={p.x} y={p.y} width="4" height="1.4" rx=".7" fill="#fffdf8" transform={`rotate(${p.a} ${p.x} ${p.y})`} />} />
        <Leaf x={60} y={58} r={20} s={0.8} />
      </Bowl>
    ),
  },
  "chicken-buckwheat": {
    bg: SAND,
    art: (
      <Plate>
        <Mound cx={44} cy={64} r={22} c="#8b5a2b" grain="#b57a3a" n={90} />
        <Drumstick x={52} y={50} r={-10} s={0.95} />
        <CucSlice x={52} y={84} />
        <CucSlice x={64} y={90} />
        <Dill x={92} y={82} r={30} />
      </Plate>
    ),
  },
  "salmon-broccoli": {
    bg: TOMATO,
    art: (
      <Plate>
        <Salmon x={58} y={52} r={-8} s={1.05} />
        <Broccoli x={38} y={82} />
        <Broccoli x={58} y={88} s={1.1} />
        <Broccoli x={78} y={82} />
        <Lemon x={90} y={44} s={0.9} />
        <Dill x={32} y={44} r={-40} />
      </Plate>
    ),
  },
  "cutlets-puree": {
    bg: CREAM,
    art: (
      <Plate>
        <ellipse cx="42" cy="66" rx="20" ry="18" fill="#e6d29a" />
        <ellipse cx="42" cy="64" rx="19" ry="17" fill="#fbf0c8" />
        <path d="M30 58q6-3 12 0t12 0M30 66q6-3 12 0t12 0" stroke="#e8d79a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <rect x="36" y="54" width="10" height="7" rx="2" fill={C.butter} />
        <Dill x={50} y={72} r={50} />
        <Cutlet x={80} y={46} r={20} s={1.2} />
        <Cutlet x={84} y={72} r={-10} s={1.2} />
        <CucSlice x={64} y={90} />
      </Plate>
    ),
  },
  "fish-cutlets-rice": {
    bg: SKY,
    art: (
      <Plate>
        <Mound cx={42} cy={62} r={19} />
        <g>
          <ellipse cx="76" cy="46" rx="14" ry="9" fill="#b98a3a" />
          <ellipse cx="76" cy="45" rx="12.6" ry="7.8" fill="#e5b663" />
          <ellipse cx="80" cy="76" rx="14" ry="9" fill="#b98a3a" />
          <ellipse cx="80" cy="75" rx="12.6" ry="7.8" fill="#e5b663" />
        </g>
        <Lemon x={60} y={88} s={0.8} />
        <Dill x={36} y={40} r={-30} />
      </Plate>
    ),
  },
  "stewed-cabbage": {
    bg: LEAF,
    art: (
      <Plate>
        <Bits n={28} seed={6} radius={30} render={(p) => <path d="M0 0q5-6 10 0" transform={`translate(${p.x} ${p.y}) rotate(${p.a})`} stroke="#cfe3a0" strokeWidth="3.2" fill="none" strokeLinecap="round" />} />
        <Bits n={7} seed={9} radius={24} render={(p) => <ChickenPiece x={p.x} y={p.y} r={p.a} s={0.45} />} />
        <Bits n={6} seed={2} radius={26} render={(p) => <CarrotRound x={p.x} y={p.y} s={0.6} />} />
        <Bits n={10} seed={31} radius={30} render={(p) => <circle cx={p.x} cy={p.y} r="1.2" fill={C.tomato} />} />
        <Dill x={90} y={86} r={40} />
      </Plate>
    ),
  },
  "turkey-steak-salad": {
    bg: LEAF,
    art: (
      <Plate>
        <Steak x={46} y={56} r={-10} s={1.1} />
        <GrillMarks />
        {[
          [78, 44, 30],
          [90, 62, 80],
          [80, 80, 140],
          [66, 86, 200],
        ].map(([x, y, r], i) => (
          <Leaf key={i} x={x} y={y} r={r} s={1.6} c={i % 2 ? C.green : C.greenLight} />
        ))}
        <Tomato cherry x={84} y={62} />
        <Tomato cherry x={72} y={74} />
        <CucSlice x={86} y={46} />
      </Plate>
    ),
  },
  "vegetable-stew": {
    bg: TOMATO,
    art: (
      <Bowl rim="#e6a27d" inside="#c8452a">
        <circle cx="60" cy="60" r="38" fill="#d9603a" opacity=".5" />
        {[
          [44, 46],
          [66, 42],
          [78, 62],
          [60, 76],
          [42, 68],
        ].map(([x, y], i) => (
          <Zucchini key={i} x={x} y={y} />
        ))}
        <Eggplant x={56} y={58} r={20} />
        <Eggplant x={76} y={78} r={-40} s={0.9} />
        <Pepper x={36} y={56} c={C.yellow} s={1.2} />
        <Pepper x={70} y={52} c={C.red} s={1.2} />
        <Pepper x={50} y={86} c={C.orange} s={1.1} />
        <Tomato cherry x={88} y={50} />
        <Leaf x={60} y={60} r={30} s={1.2} />
        <Steam x={62} y={12} />
      </Bowl>
    ),
  },
  caesar: {
    bg: LEAF,
    art: (
      <Bowl rim="#e7d3b4" inside="#e7efc6">
        {[
          [42, 50, -30],
          [60, 40, 0],
          [78, 52, 40],
          [80, 74, 100],
          [58, 82, 170],
          [40, 70, -80],
        ].map(([x, y, r], i) => (
          <Leaf key={i} x={x} y={y} r={r} s={2} c={i % 2 ? C.greenLight : "#c1e08a"} />
        ))}
        <Bits n={7} seed={5} radius={20} render={(p) => <Crouton x={p.x} y={p.y} r={p.a} s={0.9} />} />
        <Bits n={9} seed={9} radius={22} render={(p) => <rect x={p.x} y={p.y} width="9" height="3.4" rx="1.7" fill="#e5b663" transform={`rotate(${p.a} ${p.x} ${p.y})`} />} />
        <Bits n={10} seed={11} radius={22} render={(p) => <rect x={p.x} y={p.y} width="5" height="1.6" rx=".8" fill="#fffdf8" transform={`rotate(${p.a} ${p.x} ${p.y})`} />} />
        <Tomato cherry x={60} y={60} />
      </Bowl>
    ),
  },
  "rice-veg": {
    bg: LEAF,
    art: (
      <Plate>
        <Mound cx={60} cy={62} r={30} n={130} />
        <Bits n={12} seed={4} radius={24} cx={60} cy={62} render={(p) => <Pea x={p.x} y={p.y} />} />
        <Bits n={14} seed={7} radius={24} cx={60} cy={62} render={(p) => <Corn x={p.x} y={p.y} />} />
        <Bits n={8} seed={10} radius={24} cx={60} cy={62} render={(p) => <rect x={p.x} y={p.y} width="4.4" height="4.4" rx="1" fill={C.orange} />} />
        <Bits n={5} seed={14} radius={22} cx={60} cy={62} render={(p) => <rect x={p.x} y={p.y} width="4.6" height="4.6" rx="1" fill={C.red} />} />
        <Dill x={86} y={36} r={30} />
      </Plate>
    ),
  },
  "roast-chicken-potato": {
    bg: CREAM,
    art: (
      <Plate>
        <Drumstick x={46} y={50} r={-20} s={1} />
        {[
          [40, 82, 10],
          [58, 88, -20],
          [76, 80, 30],
          [84, 62, 60],
          [70, 70, 0],
        ].map(([x, y, r], i) => (
          <Potato key={i} x={x} y={y} r={r} s={1.2} />
        ))}
        <Dill x={92} y={42} r={40} />
        <Dill x={30} y={66} r={-40} />
      </Plate>
    ),
  },
  "baked-fish-veg": {
    bg: SKY,
    art: (
      <Plate>
        <FishFillet x={56} y={50} r={-6} s={1.1} />
        {[
          [34, 80],
          [52, 88],
          [72, 84],
        ].map(([x, y], i) => (
          <Potato key={i} x={x} y={y} r={i * 30} s={1.2} />
        ))}
        <CarrotRound x={88} y={72} s={1.2} />
        <CarrotRound x={92} y={86} s={1.2} />
        <Broccoli x={86} y={50} s={0.9} />
        <Lemon x={30} y={50} s={0.8} />
      </Plate>
    ),
  },
  "grilled-veg": {
    bg: LEAF,
    art: (
      <Plate>
        {[
          [42, 46, -20],
          [64, 40, 10],
          [80, 56, 60],
        ].map(([x, y, r], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
            <ellipse rx="14" ry="6.6" fill="#7aa83a" />
            <ellipse rx="12" ry="5" fill="#cfe3a0" />
            <g stroke="#4a5b1f" strokeWidth="1.8" strokeLinecap="round" opacity=".7">
              <path d="M-7-3l4 6M-1-3l4 6M5-3l4 6" />
            </g>
          </g>
        ))}
        <rect x="32" y="62" width="28" height="9" rx="4.5" fill={C.red} transform="rotate(-10 46 66)" />
        <rect x="56" y="72" width="28" height="9" rx="4.5" fill={C.yellow} transform="rotate(14 70 76)" />
        <ellipse cx="42" cy="86" rx="11" ry="6" fill="#4a2a63" />
        <ellipse cx="42" cy="86" rx="9" ry="4.4" fill="#cdb7a0" />
        <ellipse cx="90" cy="82" rx="11" ry="6" fill="#4a2a63" />
        <ellipse cx="90" cy="82" rx="9" ry="4.4" fill="#cdb7a0" />
        <Tomato x={86} y={38} s={0.9} />
        <Tomato x={30} y={42} s={0.8} />
      </Plate>
    ),
  },
  "fried-potato-mushroom": {
    bg: SAND,
    art: (
      <Pan>
        <Bits n={16} seed={4} radius={30} cx={55} render={(p) => <PotatoCube x={p.x} y={p.y} r={p.a} s={0.9} />} />
        <Bits n={8} seed={9} radius={26} cx={55} render={(p) => <Mushroom x={p.x} y={p.y} r={p.a} s={1} />} />
        <Bits n={10} seed={2} radius={30} cx={55} render={(p) => <circle cx={p.x} cy={p.y} r="1.1" fill={C.green} />} />
      </Pan>
    ),
  },
  "grilled-chicken-veg": {
    bg: LEAF,
    art: (
      <Plate>
        <g transform="translate(50 52) rotate(-12)">
          <ChickenPiece s={1.3} />
          <g transform="scale(1.1)">
            <GrillMarks />
          </g>
        </g>
        <Zucchini x={84} y={44} s={1.3} />
        <Zucchini x={90} y={64} s={1.3} />
        <Zucchini x={80} y={82} s={1.3} />
        <Tomato cherry x={40} y={84} />
        <Tomato cherry x={54} y={90} />
        <Leaf x={34} y={40} r={-30} />
      </Plate>
    ),
  },
  "meatballs-tomato": {
    bg: TOMATO,
    art: (
      <Bowl rim="#ffffff" inside="#c63c1f">
        <circle cx="60" cy="60" r="38" fill="#e0603a" opacity=".5" />
        {[
          [44, 48],
          [62, 44],
          [78, 54],
          [74, 74],
          [54, 76],
          [40, 66],
        ].map(([x, y], i) => (
          <Meatball key={i} x={x} y={y} s={1.2} />
        ))}
        <Leaf x={60} y={60} r={20} s={1.4} />
        <Bits n={10} seed={6} radius={12} render={(p) => <rect x={p.x} y={p.y} width="4" height="1.4" rx=".7" fill="#fffdf8" transform={`rotate(${p.a} ${p.x} ${p.y})`} />} />
      </Bowl>
    ),
  },
  "baked-chicken-broccoli": {
    bg: LEAF,
    art: (
      <Plate>
        <ChickenPiece x={46} y={54} r={-10} s={1.2} />
        <ChickenPiece x={56} y={74} r={8} s={1.1} />
        <Broccoli x={82} y={46} s={1.2} />
        <Broccoli x={88} y={70} s={1.1} />
        <Broccoli x={76} y={86} s={1.2} />
        <Lemon x={32} y={88} s={0.8} />
      </Plate>
    ),
  },
  "country-potatoes": {
    bg: CREAM,
    art: (
      <Plate>
        {[
          [36, 50, -20],
          [58, 44, 20],
          [78, 54, 60],
          [86, 74, 100],
          [66, 82, 160],
          [44, 80, 200],
          [58, 62, 0],
        ].map(([x, y, r], i) => (
          <Potato key={i} x={x} y={y} r={r} s={1.5} />
        ))}
        <Bits n={18} seed={5} radius={32} render={(p) => <circle cx={p.x} cy={p.y} r=".9" fill="#fffdf8" />} />
        <Dill x={90} y={38} r={40} />
      </Plate>
    ),
  },
  "fish-foil": {
    bg: SKY,
    art: (
      <Plate>
        <path d="M24 70c-2-20 10-34 36-34s38 14 36 34c-2 10-14 16-36 16S26 80 24 70z" fill="#aeb8c2" />
        <path d="M28 68c0-16 12-28 32-28s32 12 32 28c0 8-12 14-32 14S28 76 28 68z" fill="#d7dee5" />
        <path d="M34 48l6 8 6-8 8 8 6-8 8 8 6-8 8 8 6-8" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".8" />
        <FishFillet x={56} y={68} r={-6} s={0.95} />
        <Lemon x={84} y={62} s={0.8} />
        <Pepper x={36} y={70} c={C.red} s={0.8} />
        <Dill x={64} y={50} r={20} />
      </Plate>
    ),
  },
  "chicken-legs": {
    bg: CREAM,
    art: (
      <Plate>
        <Drumstick x={34} y={46} r={20} s={1.1} />
        <Drumstick x={34} y={76} r={-8} s={1.1} />
        <Bits n={16} seed={9} radius={24} cx={50} cy={60} render={(p) => <circle cx={p.x} cy={p.y} r=".9" fill="#fff4d6" />} />
        <Dill x={88} y={34} r={40} />
        <Tomato cherry x={90} y={84} />
      </Plate>
    ),
  },
  "steamed-veg": {
    bg: LEAF,
    art: (
      <Bowl rim="#d9b878" inside="#ecdcb4">
        <circle cx="60" cy="60" r="40" fill="none" stroke="#c9a45c" strokeWidth="1.2" strokeDasharray="3 4" />
        <Broccoli x={44} y={52} s={1.4} />
        <Broccoli x={74} y={50} s={1.3} />
        <Cauliflower x={60} y={72} s={1.4} />
        {[
          [36, 74],
          [84, 74],
          [60, 44],
        ].map(([x, y], i) => (
          <CarrotRound key={i} x={x} y={y} s={1.1} />
        ))}
        <Bits n={6} seed={4} radius={26} render={(p) => <Pea x={p.x} y={p.y} />} />
        <Steam x={62} y={12} />
      </Bowl>
    ),
  },
  "cucumber-tomato-salad": {
    bg: LEAF,
    art: (
      <Bowl rim="#c9deef" inside="#f4f7ec">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <CucSlice key={i} x={60 + Math.cos((i / 7) * Math.PI * 2) * 22} y={60 + Math.sin((i / 7) * Math.PI * 2) * 22} s={1.2} />
        ))}
        {[0, 1, 2, 3, 4].map((i) => (
          <TomatoWedge key={i} x={60 + Math.cos((i / 5) * Math.PI * 2 + 0.5) * 11} y={60 + Math.sin((i / 5) * Math.PI * 2 + 0.5) * 11} r={(i / 5) * 360 + 30} s={1.1} />
        ))}
        <Onion x={60} y={60} s={0.9} />
        <Dill x={90} y={38} r={40} />
        <Dill x={32} y={84} r={-140} />
      </Bowl>
    ),
  },
  "chicken-apple-salad": {
    bg: CREAM,
    art: (
      <Bowl rim="#f0c9a0" inside="#e9f1cf">
        {[
          [42, 50, -30],
          [74, 48, 40],
          [62, 76, 160],
        ].map(([x, y, r], i) => (
          <Leaf key={i} x={x} y={y} r={r} s={2.4} c={C.greenLight} />
        ))}
        <Bits n={9} seed={3} radius={22} render={(p) => (
          <rect x={p.x} y={p.y} width="6" height="6" rx="1.4" fill="#fff6d6" stroke={C.red} strokeWidth="1.4" transform={`rotate(${p.a} ${p.x} ${p.y})`} />
        )} />
        <Bits n={6} seed={8} radius={20} render={(p) => <ChickenPiece x={p.x} y={p.y} r={p.a} s={0.4} />} />
        <Bits n={6} seed={15} radius={22} render={(p) => <rect x={p.x} y={p.y} width="7" height="2.6" rx="1.3" fill={C.greenLight} transform={`rotate(${p.a} ${p.x} ${p.y})`} />} />
        <Dollop x={60} y={60} />
      </Bowl>
    ),
  },
  "stewed-chicken-veg": {
    bg: SAND,
    art: (
      <Pot inside="#e5b66a">
        <ChickenPiece x={46} y={54} r={-20} s={0.8} />
        <ChickenPiece x={74} y={66} r={20} s={0.8} />
        <Bits n={9} seed={4} radius={26} render={(p) => <CarrotRound x={p.x} y={p.y} s={0.9} />} />
        <Bits n={9} seed={9} radius={26} render={(p) => <PotatoCube x={p.x} y={p.y} r={p.a} s={0.7} />} />
        <Bits n={12} seed={13} radius={28} render={(p) => <Pea x={p.x} y={p.y} />} />
        <Steam x={62} y={12} />
      </Pot>
    ),
  },
};
