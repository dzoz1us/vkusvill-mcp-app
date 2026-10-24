import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Icon } from "@/shared/ui";
import type { IconName } from "@/shared/ui";

export interface TabItem {
  label: string;
  to: string;
  icon: IconName;
  also?: string[];
  badge?: boolean;
}

const DRAG_PX = 6; // на сколько сдвинуть палец, чтобы нажатие стало перетаскиванием
const MOVE_MS = 480; // дольше всего пилюля переезжает к новому пункту

/** Где пилюля стояла в последний раз: страницы собирают панель заново, а пилюля должна ехать от старого места. */
let lastPillLeft: number | null = null;

const cx = (...p: (string | false | undefined)[]) => p.filter(Boolean).join(" ");

/** Положение и ширина каждого пункта относительно внутреннего края панели. */
function cellsOf(host: HTMLElement) {
  const box = host.getBoundingClientRect();
  const scale = box.width / host.offsetWidth || 1;
  const origin = box.left + host.clientLeft * scale;
  return Array.from(host.querySelectorAll<HTMLElement>("a.tab"), (tab) => {
    const r = tab.getBoundingClientRect();
    return { left: (r.left - origin) / scale, width: r.width / scale };
  });
}

/**
 * Нижняя панель «жидкое стекло». Полупрозрачная пилюля выбранного раздела переезжает к новому пункту,
 * на ходу растягиваясь, как капля. Под пальцем она увеличивается и идёт за ним; раздел открывается при отпускании.
 */
export default function TabBar({ tabs }: { tabs: TabItem[] }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const bar = useRef<HTMLElement>(null);
  const pill = useRef<HTMLSpanElement>(null);
  const gesture = useRef<{ x: number; moved: boolean } | null>(null);
  const swallowClick = useRef(false);
  const placed = useRef(false);
  const [width, setWidth] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [pending, setPending] = useState<{ index: number; at: string } | null>(null);

  const current = tabs.findIndex((t) =>
    [t.to, ...(t.also ?? [])].some((to) => pathname === to || pathname.startsWith(`${to}/`)),
  );
  const target = pending && pending.at === pathname ? pending.index : current;
  const shown = dragIndex ?? target;

  const posAt = (clientX: number) => {
    const el = bar.current;
    if (!el) return Math.max(target, 0);
    const cells = cellsOf(el);
    if (cells.length < 2) return 0;
    const box = el.getBoundingClientRect();
    const scale = box.width / el.offsetWidth || 1;
    const x = (clientX - box.left) / scale - el.clientLeft;
    const step = cells[1].left - cells[0].left;
    return Math.min(Math.max((x - cells[0].left - cells[0].width / 2) / step, 0), cells.length - 1);
  };
  const leftOf = (cells: { left: number }[], pos: number) =>
    cells[0].left + pos * (cells.length > 1 ? cells[1].left - cells[0].left : 0);

  // пилюля плавно едет к краю dest; в середине пути растянута и не выходит за панель
  const glide = (dest: number, w: number) => {
    const el = pill.current;
    if (!el) return;
    const live = placed.current ? parseFloat(getComputedStyle(el).left) : (lastPillLeft ?? Number.NaN);
    el.getAnimations().forEach((a) => a.cancel());
    el.style.width = `${w}px`;
    el.style.left = `${dest}px`;
    placed.current = true;
    lastPillLeft = dest;
    if (Number.isNaN(live) || Math.abs(live - dest) < 1 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const dist = Math.abs(dest - live);
    const anim = el.animate(
      [
        { left: `${live}px`, width: `${w}px` },
        { left: `${Math.min(live, dest)}px`, width: `${w + dist * 0.9}px`, offset: 0.5 },
        { left: `${dest}px`, width: `${w}px` },
      ],
      { duration: Math.round(Math.min(MOVE_MS, 260 + dist * 1.1)), easing: "cubic-bezier(.32,.72,0,1)" },
    );
    lastPillLeft = live;
    const sample = () => {
      if (!el.isConnected) return;
      const now = parseFloat(getComputedStyle(el).left);
      if (!Number.isNaN(now)) lastPillLeft = now;
      if (anim.playState === "running") requestAnimationFrame(sample);
      else lastPillLeft = dest;
    };
    requestAnimationFrame(sample);
  };

  // пилюля идёт за пальцем без анимации
  const follow = (pos: number) => {
    const el = pill.current;
    const host = bar.current;
    if (!el || !host) return;
    const cells = cellsOf(host);
    if (!cells.length) return;
    el.getAnimations().forEach((a) => a.cancel());
    const left = leftOf(cells, pos);
    el.style.width = `${cells[0].width}px`;
    el.style.left = `${left}px`;
    lastPillLeft = left;
  };

  const finish = () => {
    gesture.current = null;
    setDragIndex(null);
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    gesture.current = { x: e.clientX, moved: false };
    bar.current?.setPointerCapture(e.pointerId);
    const index = Math.round(posAt(e.clientX));
    setDragIndex(index);
    const host = bar.current;
    if (host && index !== target) {
      const cells = cellsOf(host);
      if (cells.length) glide(leftOf(cells, index), cells[0].width);
    }
  };
  const onPointerMove = (e: PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    if (!g.moved && Math.abs(e.clientX - g.x) > DRAG_PX) g.moved = true;
    if (!g.moved) return;
    const pos = posAt(e.clientX);
    follow(pos);
    const index = Math.round(pos);
    setDragIndex((prev) => (prev === index ? prev : index));
  };
  const onPointerUp = (e: PointerEvent) => {
    if (!gesture.current) return;
    const index = Math.round(posAt(e.clientX));
    const to = tabs[index];
    finish();
    swallowClick.current = true;
    window.setTimeout(() => {
      swallowClick.current = false;
    }, 0);
    if (to && index !== target) {
      setPending({ index, at: pathname });
      void navigate(to.to);
      return;
    }
    const host = bar.current;
    if (host) {
      const cells = cellsOf(host);
      if (cells.length && target >= 0) glide(leftOf(cells, target), cells[0].width);
    }
  };

  useEffect(() => {
    const el = bar.current;
    if (!el) return undefined;
    const onContext = (e: Event) => e.preventDefault();
    const onClick = (e: Event) => {
      if (swallowClick.current) e.preventDefault();
    };
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", finish);
    el.addEventListener("contextmenu", onContext);
    el.addEventListener("click", onClick, true);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", finish);
      el.removeEventListener("contextmenu", onContext);
      el.removeEventListener("click", onClick, true);
    };
  });

  useEffect(() => {
    const el = bar.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // в покое пилюля стоит на выбранном пункте
  useLayoutEffect(() => {
    const host = bar.current;
    if (!host || target < 0 || gesture.current) return;
    const cells = cellsOf(host);
    if (cells.length) glide(leftOf(cells, target), cells[0].width);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, width, tabs.length]);

  return (
    <nav
      ref={bar}
      className={cx("tabbar", dragIndex !== null && "press")}
      aria-label="Разделы"
      style={{ "--n": tabs.length } as CSSProperties}
    >
      {target >= 0 && <span ref={pill} className="tabpill" aria-hidden="true" />}
      {tabs.map((t, i) => (
        <NavLink key={t.to} to={t.to} draggable={false} className={cx("tab", i === shown && "cur")}>
          <Icon name={t.icon} className="h-7 w-7" />
          <span className="sr-only">
            {t.label}
            {t.badge ? ", есть новые" : ""}
          </span>
          {t.badge ? <span className="dot" aria-hidden="true" /> : null}
        </NavLink>
      ))}
    </nav>
  );
}
