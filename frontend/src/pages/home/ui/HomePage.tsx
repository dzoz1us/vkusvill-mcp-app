import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { DishArt, FoodIcon, Logo } from "@/shared/ui";
import type { FoodIconName } from "@/shared/ui";
import { useUserStore } from "@/entities/user";

const HEADLINE = ["Меню", "на", "неделю", "и", "корзина", "во", "ВкусВилл"];

/** Три шага: значок показывает само действие */
const STEPS: { icon: FoodIconName; title: string; text: string }[] = [
  { icon: "cooking", title: "Отвечаете", text: "на семь коротких вопросов" },
  { icon: "calendar", title: "Получаете", text: "меню по дням и список покупок" },
  { icon: "shopping-cart", title: "Заказываете", text: "одной ссылкой во ВкусВилл" },
];

const CARDS = [
  { name: "Борщ с говядиной", rotate: -7, x: "-4%", y: "4%", w: "52%", delay: 0.15 },
  { name: "Паста болоньезе", rotate: 5, x: "40%", y: "0%", w: "52%", delay: 0.3 },
  { name: "Запечённый лосось с брокколи", rotate: -2, x: "16%", y: "46%", w: "56%", delay: 0.45 },
];

const FLOATERS: { icon: FoodIconName; className: string; delay: number }[] = [
  { icon: "tomato", className: "left-[2%] top-[42%] h-14 w-14", delay: 0.7 },
  { icon: "lemon", className: "right-[4%] top-[34%] h-12 w-12", delay: 0.85 },
  { icon: "avocado", className: "right-[10%] bottom-[2%] h-14 w-14", delay: 1 },
];

export default function HomePage() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden">
      {/* Один плоский салатовый круг за блюдами */}
      <motion.div
        aria-hidden="true"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-accent-soft absolute -top-24 -right-32 h-[520px] w-[520px] rounded-full md:top-1/2 md:right-[-8%] md:h-[760px] md:w-[760px] md:-translate-y-1/2"
      />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-[calc(1.25rem+env(safe-area-inset-top))]">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link to="/catalog" className="nav-link">
            Рецепты
          </Link>
          <Link to={user ? "/plans" : "/login"} className="btn btn-primary btn-sm">
            {user ? "Мои планы" : "Войти"}
          </Link>
        </nav>
      </header>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 px-5 pt-6 pb-6 md:grid-cols-2 md:gap-12">
        <div className="order-2 md:order-1">
          <h1 className="text-ink font-display text-[34px] leading-[1.12] font-bold tracking-tight sm:text-5xl md:text-[56px]">
            {HEADLINE.map((word, i) => (
              <span key={i} className="mr-[0.28em] inline-block overflow-hidden align-bottom">
                <motion.span
                  className="inline-block"
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07, duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.5 }}
            className="text-muted mt-5 max-w-md text-lg"
          >
            Семь вопросов — и у вас рецепты на каждый день, список покупок и ссылка на корзину.
          </motion.p>
        </div>

        {/* Коллаж из блюд, овощи подпрыгивают */}
        <div className="relative order-1 mx-auto aspect-[1/1.02] w-full max-w-[420px] md:order-2 md:max-w-[520px]">
          {CARDS.map((c) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 60, rotate: c.rotate * 2.2 }}
              animate={{ opacity: 1, y: 0, rotate: c.rotate }}
              transition={{ delay: c.delay, type: "spring", stiffness: 90, damping: 14 }}
              style={{ left: c.x, top: c.y, width: c.w }}
              className="absolute"
            >
              <div className="animate-bob" style={{ animationDelay: `${c.delay * 3}s` }}>
                <DishArt
                  recipeName={c.name}
                  className="aspect-square w-full rounded-[36px] border-[6px] border-white shadow-[0_24px_48px_-20px_rgba(22,26,16,0.45)]"
                />
              </div>
            </motion.div>
          ))}
          {FLOATERS.map((f) => (
            <motion.div
              key={f.icon}
              initial={{ scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: f.delay, type: "spring", stiffness: 260, damping: 14 }}
              className={`absolute ${f.className}`}
            >
              <FoodIcon name={f.icon} className="h-full w-full drop-shadow-md" />
            </motion.div>
          ))}
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-5 pb-12">
        <div className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.12, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="card flex items-center gap-4 !p-4"
            >
              <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center">
                <FoodIcon name={s.icon} className="h-12 w-12" />
              </span>
              <div>
                <p className="text-ink text-lg leading-tight font-bold">{s.title}</p>
                <p className="text-muted text-sm">{s.text}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6"
        >
          <button onClick={() => navigate("/start")} className="btn btn-primary w-full text-[22px]">
            Старт
          </button>
        </motion.div>
      </div>
    </div>
  );
}
