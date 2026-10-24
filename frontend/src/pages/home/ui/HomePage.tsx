import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import type { Variants } from "motion/react";
import { APP_NAME } from "@/shared/lib";
import { FoodIcon } from "@/shared/ui";
import type { FoodIconName } from "@/shared/ui";
import { useUserStore } from "@/entities/user";

const HEADLINE = ["Меню", "на", "неделю", "и", "корзина", "во", "ВкусВилл"];

/** Неделя: каждый день получает своё блюдо, по очереди подсвечивается */
const WEEK: { day: string; icon: FoodIconName }[] = [
  { day: "Пн", icon: "pancakes" },
  { day: "Вт", icon: "spaghetti" },
  { day: "Ср", icon: "broccoli" },
  { day: "Чт", icon: "tomato" },
  { day: "Пт", icon: "fish" },
  { day: "Сб", icon: "croissant" },
  { day: "Вс", icon: "strawberry" },
];

/** Три шага: значок показывает само действие */
const STEPS: { icon: FoodIconName; title: string; text: string }[] = [
  { icon: "cooking", title: "Отвечаете", text: "на семь коротких вопросов" },
  { icon: "calendar", title: "Получаете", text: "меню по дням и список покупок" },
  { icon: "shopping-cart", title: "Заказываете", text: "одной ссылкой во ВкусВилл" },
];

const word: Variants = {
  hidden: { y: "105%" },
  show: (i: number) => ({ y: 0, transition: { delay: 0.12 + i * 0.07, duration: 0.65, ease: [0.16, 1, 0.3, 1] } }),
};

/** Неделя по кругу: блюда по очереди «выходят» и подсвечивают свой день */
function WeekStrip() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((i) => (i + 1) % WEEK.length), 1100);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="grid grid-cols-7 gap-1.5 sm:gap-2" role="img" aria-label="Меню на неделю: каждый день свое блюдо">
      {WEEK.map((d, i) => {
        const on = i === active;
        return (
          <motion.div
            key={d.day}
            initial={{ opacity: 0, y: 26, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: on ? 1.06 : 1 }}
            transition={{ delay: 0.5 + i * 0.09, type: "spring", stiffness: 200, damping: 14 }}
            className={`flex flex-col items-center gap-1 rounded-[22px] border-2 bg-white py-2.5 transition-colors duration-300 ${
              on ? "border-accent-strong" : "border-line"
            }`}
          >
            <span className="text-ink text-xs font-bold">{d.day}</span>
            <motion.span
              animate={on ? { y: [0, -6, 0], rotate: [0, -8, 6, 0] } : { y: 0, rotate: 0 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
              className="flex h-9 w-9 items-center justify-center sm:h-11 sm:w-11"
            >
              <FoodIcon name={d.icon} className="h-full w-full" />
            </motion.span>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden">
      {/* Мягкое зелёное пятно за композицией */}
      <motion.div
        aria-hidden="true"
        className="bg-accent-soft absolute -top-24 -right-32 h-[460px] w-[460px] rounded-full md:top-1/4 md:right-[-8%] md:h-[640px] md:w-[640px]"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-[calc(1.25rem+env(safe-area-inset-top))]">
        <span className="font-display text-ink text-2xl font-bold tracking-tight">{APP_NAME}</span>
        <nav className="flex items-center gap-2">
          <Link to="/catalog" className="nav-link">
            Рецепты
          </Link>
          <Link to={user ? "/plans" : "/login"} className="btn btn-primary btn-sm">
            {user ? "Мои планы" : "Войти"}
          </Link>
        </nav>
      </header>

      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center gap-8 px-5 pt-8 pb-10 md:max-w-2xl">
        <div>
          <h1 className="text-ink font-display text-[34px] leading-[1.12] font-bold tracking-tight sm:text-5xl md:text-[56px]">
            {HEADLINE.map((w, i) => (
              <span key={i} className="mr-[0.28em] inline-block overflow-hidden align-bottom">
                <motion.span className="inline-block" variants={word} custom={i} initial="hidden" animate="show">
                  {w}
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="text-muted mt-5 max-w-md text-lg"
          >
            Семь вопросов — и у вас рецепты на каждый день, список покупок и ссылка на корзину.
          </motion.p>
        </div>

        <WeekStrip />

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
        >
          <button onClick={() => navigate("/start")} className="btn btn-primary w-full text-[22px]">
            Старт
          </button>
        </motion.div>
      </div>
    </div>
  );
}
