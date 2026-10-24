import { Link, useNavigate } from "react-router-dom";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import type { MotionValue } from "motion/react";
import borscht from "@/shared/assets/dishes/borscht.webp";
import pasta from "@/shared/assets/dishes/pasta.webp";
import salmon from "@/shared/assets/dishes/salmon.webp";
import { APP_NAME } from "@/shared/lib";
import { Produce } from "@/shared/ui";
import type { ProduceName } from "@/shared/ui";
import { useUserStore } from "@/entities/user";

const HEADLINE = ["Меню", "на", "неделю", "и", "корзина", "во", "ВкусВилл"];

const STEPS: { produce: ProduceName; title: string; text: string }[] = [
  { produce: "carrot", title: "Отвечаете", text: "на семь коротких вопросов" },
  { produce: "tomato", title: "Получаете", text: "меню по дням и список покупок" },
  { produce: "apple", title: "Заказываете", text: "одной ссылкой во ВкусВилл" },
];

/* Овощи и фрукты вокруг блюд: позиция, размер, поворот, темп покачивания */
/* Овощи и фрукты ходят по кругу вокруг блюд */
const ORBIT: ProduceName[] = ["tomato", "lemon", "carrot", "avocado", "strawberry", "broccoli"];
const ORBIT_SECONDS = 48;

const CARDS = [
  { src: borscht, alt: "Борщ", rotate: -6, x: "6%", y: "8%", w: "50%", delay: 0.2 },
  { src: pasta, alt: "Паста болоньезе", rotate: 5, x: "46%", y: "4%", w: "46%", delay: 0.34 },
  { src: salmon, alt: "Лосось с овощами", rotate: -2, x: "24%", y: "46%", w: "52%", delay: 0.48 },
];

type Card = (typeof CARDS)[number];

function ParallaxCard({ card: c, depth, px, py }: { card: Card; depth: number; px: MotionValue<number>; py: MotionValue<number> }) {
  const x = useTransform(px, (v) => v * depth);
  const y = useTransform(py, (v) => v * depth);
  return (
    <motion.div
      initial={{ opacity: 0, y: 70, rotate: c.rotate * 2.4, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, rotate: c.rotate, scale: 1 }}
      whileHover={{ scale: 1.04, rotate: c.rotate * 0.4 }}
      transition={{ delay: c.delay, type: "spring", stiffness: 80, damping: 13 }}
      style={{ left: c.x, top: c.y, width: c.w }}
      className="absolute"
    >
      <motion.div style={{ x, y }}>
        <div className="animate-bob" style={{ animationDelay: `${-c.delay * 5}s`, animationDuration: `${5 + c.delay * 3}s` }}>
          <img
            src={c.src}
            alt={c.alt}
            width={720}
            height={720}
            className="aspect-square w-full rounded-[36px] border-[6px] border-white object-cover shadow-[0_24px_48px_-20px_rgba(22,26,16,0.45)]"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);

  // Параллакс: блюда мягко следуют за курсором, каждое на своей глубине
  const px = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 });
  const py = useSpring(useMotionValue(0), { stiffness: 60, damping: 18 });
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const resetMove = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden">
      {/* Живое пятно за блюдами */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="absolute -top-28 -right-36 h-[540px] w-[540px] md:top-1/2 md:right-[-10%] md:h-[780px] md:w-[780px] md:-translate-y-1/2"
      >
        <div className="animate-blob bg-accent-soft h-full w-full" />
      </motion.div>

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-[calc(1.25rem+env(safe-area-inset-top))]">
        <span className="font-display text-accent-ink text-2xl font-bold tracking-tight">{APP_NAME}</span>
        <nav className="flex items-center gap-2">
          <Link to="/catalog" className="btn btn-outline btn-sm">
            Рецепты
          </Link>
          <Link to={user ? "/plans" : "/login"} className="btn btn-outline btn-sm">
            {user ? "Мои планы" : "Войти"}
          </Link>
        </nav>
      </header>

      <div className="relative mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-5 pt-6 pb-8 md:grid-cols-2 md:gap-12">
        <div className="order-2 md:order-1">
          <h1 className="text-ink font-display text-[34px] leading-[1.12] font-bold tracking-tight sm:text-5xl md:text-[56px]">
            {HEADLINE.map((word, i) => (
              <motion.span
                key={i}
                className="mr-[0.28em] inline-block"
                initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.15 + i * 0.08, duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
              >
                {word}
              </motion.span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.5 }}
            className="text-muted mt-5 max-w-md text-lg"
          >
            Семь вопросов — и у вас рецепты на каждый день, список покупок и ссылка на корзину.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1, type: "spring", stiffness: 220, damping: 16 }}
            className="mt-8"
          >
            <button onClick={() => navigate("/start")} className="btn btn-primary animate-pulse-ring w-full text-[22px] sm:w-auto sm:min-w-[260px]">
              Старт
            </button>
          </motion.div>
        </div>

        {/* Блюда в окружении овощей и фруктов */}
        <div
          onPointerMove={onMove}
          onPointerLeave={resetMove}
          className="relative order-1 mx-auto aspect-square w-full max-w-[400px] [container-type:inline-size] md:order-2 md:max-w-[520px]"
        >
          {/* Орбита: ходит по кругу, а сами овощи остаются «вертикальными» */}
          <div className="animate-orbit absolute inset-0" style={{ animationDuration: `${ORBIT_SECONDS}s` }} aria-hidden="true">
            {ORBIT.map((name, i) => {
              const angle = (i / ORBIT.length) * 360;
              return (
                <div key={name} className="absolute top-1/2 left-1/2 h-0 w-0" style={{ transform: `rotate(${angle}deg) translateY(-47cqw)` }}>
                  <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.7 + i * 0.12, type: "spring", stiffness: 200, damping: 12 }}>
                  <div
                    className="animate-orbit-reverse -mt-[7cqw] -ml-[7cqw] h-[14cqw] w-[14cqw]"
                    style={{ animationDuration: `${ORBIT_SECONDS}s`, animationDelay: `${-(angle / 360) * ORBIT_SECONDS}s` }}
                  >
                    <div className="animate-sway" style={{ animationDuration: `${4.6 + i * 0.5}s` }}>
                      <Produce name={name} className="w-full drop-shadow-[0_10px_14px_rgba(22,26,16,0.18)]" />
                    </div>
                  </div>
                </motion.div>
                </div>
              );
            })}
          </div>

          {CARDS.map((c, i) => (
            <ParallaxCard key={c.alt} card={c} depth={14 + i * 8} px={px} py={py} />
          ))}
        </div>
      </div>

      {/* Три шага */}
      <div className="relative mx-auto grid w-full max-w-6xl gap-3 px-5 pb-10 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.5 }}
            whileHover={{ y: -3 }}
            className="card hover:border-accent flex items-center gap-4 !p-4 transition-colors"
          >
            <Produce name={s.produce} className="h-14 w-14 flex-shrink-0" />
            <div>
              <p className="text-ink text-lg leading-tight font-bold">{s.title}</p>
              <p className="text-muted text-sm">{s.text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
