import type { ReactNode, KeyboardEvent } from "react";
import { motion } from "motion/react";
import type { ApplianceType } from "@/shared/api";

interface KitchenSceneProps {
  selected: ApplianceType[];
  onToggle: (value: ApplianceType) => void;
}

const GLOW =
  "drop-shadow(0 0 3px #a4d63b) drop-shadow(0 0 9px rgba(164,214,59,0.9))";

interface Item {
  value: ApplianceType;
  label: string;
  /** Центр подписи */
  label_x: number;
  label_y: number;
  art: ReactNode;
  /** Область нажатия */
  hit: { x: number; y: number; w: number; h: number };
}

const ITEMS: Item[] = [
  {
    value: "microwave",
    label: "Микроволновка",
    label_x: 68,
    label_y: 158,
    hit: { x: 14, y: 164, w: 112, h: 68 },
    art: (
      <g>
        <rect x="20" y="170" width="100" height="58" rx="9" fill="#262b30" />
        <rect x="28" y="177" width="60" height="42" rx="6" fill="#10151a" />
        <path d="M32 181 L58 181 L40 215 L32 215 Z" fill="#fff" opacity="0.08" />
        <rect x="94" y="177" width="20" height="9" rx="2" fill="#0b0f12" />
        <rect x="97" y="180" width="10" height="3" rx="1" fill="#ff8a3d" />
        <circle cx="104" cy="196" r="5" fill="#5d6a75" />
        <circle cx="104" cy="210" r="5" fill="#5d6a75" />
        <rect x="26" y="228" width="8" height="3" rx="1.5" fill="#101418" />
        <rect x="106" y="228" width="8" height="3" rx="1.5" fill="#101418" />
      </g>
    ),
  },
  {
    value: "multicooker",
    label: "Мультиварка",
    label_x: 150,
    label_y: 128,
    hit: { x: 126, y: 168, w: 52, h: 64 },
    art: (
      <g>
        <path d="M130 198 Q130 172 152 172 Q174 172 174 198 Z" fill="#e4572e" />
        <rect x="146" y="167" width="12" height="6" rx="3" fill="#b83e1b" />
        <rect x="130" y="198" width="44" height="30" rx="8" fill="#f4f1ea" />
        <rect x="140" y="206" width="24" height="9" rx="3" fill="#2a2f34" />
        <rect x="143" y="209" width="9" height="3" rx="1.5" fill="#a4d63b" />
        <circle cx="158" cy="220" r="2.4" fill="#b6bcc2" />
        <circle cx="166" cy="220" r="2.4" fill="#b6bcc2" />
      </g>
    ),
  },
  {
    value: "stove",
    label: "Плита",
    label_x: 224,
    label_y: 186,
    hit: { x: 182, y: 192, w: 84, h: 40 },
    art: (
      <g>
        <rect x="186" y="204" width="76" height="24" rx="6" fill="#1d2328" />
        <rect x="186" y="204" width="76" height="6" rx="3" fill="#2c353c" />
        <ellipse cx="206" cy="219" rx="12" ry="4.5" fill="none" stroke="#8fa2ae" strokeWidth="2" />
        <ellipse cx="206" cy="219" rx="5" ry="2" fill="#8fa2ae" />
        <ellipse cx="242" cy="219" rx="12" ry="4.5" fill="none" stroke="#8fa2ae" strokeWidth="2" />
        <ellipse cx="242" cy="219" rx="5" ry="2" fill="#8fa2ae" />
      </g>
    ),
  },
  {
    value: "oven",
    label: "Духовка",
    label_x: 195,
    label_y: 338,
    hit: { x: 134, y: 244, w: 122, h: 100 },
    art: (
      <g>
        <rect x="138" y="246" width="114" height="94" rx="11" fill="#b4c0c8" />
        <rect x="138" y="246" width="114" height="22" rx="11" fill="#a1aeb7" />
        <circle cx="158" cy="257" r="5" fill="#33393f" />
        <circle cx="178" cy="257" r="5" fill="#33393f" />
        <rect x="190" y="252" width="26" height="11" rx="3" fill="#161b1f" />
        <rect x="194" y="256" width="12" height="3" rx="1.5" fill="#ff7a3d" />
        <circle cx="228" cy="257" r="5" fill="#33393f" />
        <rect x="148" y="274" width="94" height="54" rx="9" fill="#1b2025" />
        <rect x="154" y="280" width="82" height="42" rx="6" fill="url(#ovenGlow)" />
        <path d="M158 296 H232 M158 308 H232" stroke="#5a2c10" strokeWidth="2" opacity="0.7" />
        <rect x="150" y="270" width="90" height="4" rx="2" fill="#dbe3e8" />
      </g>
    ),
  },
  {
    value: "air_fryer",
    label: "Аэрогриль",
    label_x: 314,
    label_y: 146,
    hit: { x: 280, y: 152, w: 70, h: 80 },
    art: (
      <g>
        <rect x="286" y="158" width="60" height="70" rx="18" fill="#2a2e33" />
        <rect x="294" y="164" width="44" height="16" rx="6" fill="#171a1e" />
        <rect x="298" y="168" width="20" height="4" rx="2" fill="#ff8a3d" />
        <circle cx="328" cy="172" r="3" fill="#6b7680" />
        <rect x="292" y="188" width="48" height="34" rx="10" fill="#33383e" />
        <rect x="306" y="198" width="20" height="5" rx="2.5" fill="#12151a" />
      </g>
    ),
  },
  {
    value: "blender",
    label: "Блендер",
    label_x: 290,
    label_y: 26,
    hit: { x: 264, y: 34, w: 54, h: 66 },
    art: (
      <g>
        <path d="M274 46 H306 L302 82 H278 Z" fill="#d8f0f6" stroke="#9fd0dd" strokeWidth="1.5" />
        <path d="M279 62 H301 L299 80 H281 Z" fill="#e4572e" opacity="0.85" />
        <rect x="271" y="40" width="38" height="8" rx="4" fill="#262b30" />
        <rect x="278" y="82" width="24" height="14" rx="4" fill="#262b30" />
        <circle cx="290" cy="89" r="3" fill="#a4d63b" />
      </g>
    ),
  },
];

export default function KitchenScene({ selected, onToggle }: KitchenSceneProps) {
  const onKey = (e: KeyboardEvent, value: ApplianceType) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onToggle(value);
    }
  };

  return (
    <svg
      viewBox="0 0 360 400"
      className="h-auto w-full overflow-hidden rounded-[32px]"
      role="group"
      aria-label="Кухня: отметьте технику"
    >
      <defs>
        <pattern id="tile" width="26" height="14" patternUnits="userSpaceOnUse">
          <rect width="26" height="14" fill="#f1e6d2" />
          <path d="M0 0.5 H26 M0.5 0 V14" stroke="#e4d5bb" strokeWidth="1" />
        </pattern>
        <linearGradient id="ovenGlow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffb25e" />
          <stop offset="1" stopColor="#c9501a" />
        </linearGradient>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d6ecf9" />
          <stop offset="1" stopColor="#eef7fc" />
        </linearGradient>
      </defs>

      {/* Стена, фартук, окно */}
      <rect width="360" height="400" fill="#f6efe2" />
      <rect y="150" width="360" height="82" fill="url(#tile)" />
      <rect x="22" y="22" width="92" height="84" rx="12" fill="#fff" />
      <rect x="30" y="30" width="76" height="68" rx="8" fill="url(#sky)" />
      <path d="M68 30 V98 M30 64 H106" stroke="#fff" strokeWidth="4" />
      <path d="M44 98 C44 84 52 76 60 70 C54 84 58 90 58 98 Z" fill="#7fae4a" opacity="0.85" />

      {/* Полка с декором */}
      <rect x="188" y="98" width="150" height="8" rx="4" fill="#c9a574" />
      <rect x="198" y="106" width="6" height="14" fill="#b58f5c" />
      <rect x="322" y="106" width="6" height="14" fill="#b58f5c" />
      <rect x="204" y="70" width="22" height="28" rx="5" fill="#e9d9b5" />
      <rect x="206" y="64" width="18" height="8" rx="3" fill="#7a5a34" />
      <rect x="232" y="78" width="20" height="20" rx="4" fill="#cfe3a4" />
      <rect x="234" y="73" width="16" height="7" rx="3" fill="#7a5a34" />

      {/* Столешница, шкафы, пол */}
      <rect y="228" width="360" height="16" fill="#fffaf0" />
      <rect y="244" width="360" height="100" fill="#d9c09a" />
      <rect x="8" y="252" width="122" height="84" rx="8" fill="#cfb386" />
      <rect x="264" y="252" width="88" height="84" rx="8" fill="#cfb386" />
      <rect x="112" y="276" width="10" height="26" rx="5" fill="#a58555" />
      <rect x="272" y="276" width="10" height="26" rx="5" fill="#a58555" />
      <rect y="344" width="360" height="56" fill="#c49a66" />
      <path d="M0 366 H360 M0 386 H360 M90 344 V366 M250 366 V386 M170 386 V400" stroke="#b08755" strokeWidth="2" />

      {ITEMS.map((item) => {
        const on = selected.includes(item.value);
        const w = item.label.length * 7.6 + 22;
        return (
          <motion.g
            key={item.value}
            role="checkbox"
            aria-checked={on}
            aria-label={item.label}
            tabIndex={0}
            className="cursor-pointer outline-none"
            style={{ transformBox: "fill-box", transformOrigin: "center" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToggle(item.value)}
            onKeyDown={(e) => onKey(e, item.value)}
          >
            <g
              style={{
                filter: on ? GLOW : "none",
                opacity: on ? 1 : 0.88,
                transition: "filter 0.2s, opacity 0.2s",
              }}
            >
              {item.art}
            </g>
            <rect
              x={item.hit.x}
              y={item.hit.y}
              width={item.hit.w}
              height={item.hit.h}
              fill="transparent"
            />
            <g style={{ transition: "transform 0.2s" }}>
              <rect
                x={item.label_x - w / 2}
                y={item.label_y - 12}
                width={w}
                height={24}
                rx={12}
                fill={on ? "#5a9612" : "#ffffff"}
                stroke={on ? "#4a7e0e" : "#e7e9df"}
                strokeWidth="1.5"
                style={{ transition: "fill 0.2s, stroke 0.2s" }}
              />
              <text
                x={item.label_x}
                y={item.label_y + 4.5}
                textAnchor="middle"
                fontSize="12.5"
                fontWeight="700"
                fill={on ? "#ffffff" : "#6c7263"}
                style={{ transition: "fill 0.2s" }}
              >
                {item.label}
              </text>
            </g>
          </motion.g>
        );
      })}
    </svg>
  );
}
