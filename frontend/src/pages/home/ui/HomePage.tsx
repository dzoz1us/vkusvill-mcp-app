import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { APP_NAME } from "@/shared/lib";
import { DishArt, Produce } from "@/shared/ui";
import type { ProduceName } from "@/shared/ui";
import { useUserStore } from "@/entities/user";

const HEADLINE = ["Меню", "на", "неделю", "и", "корзина", "во", "ВкусВилл"];

const STEPS: { produce: ProduceName; title: string; text: string }[] = [
  { produce: "carrot", title: "Отвечаете", text: "на семь коротких вопросов" },
  { produce: "tomato", title: "Получаете", text: "меню по дням и список покупок" },
  { produce: "apple", title: "Заказываете", text: "одной ссылкой во ВкусВилл" },
];

/* Овощи и фрукты вокруг блюд: позиция, размер, поворот, темп покачивания */
const PRODUCE: { name: ProduceName; className: string; rotate: number; sway: number; delay: number }[] = [
  { name: "tomato", className: "left-[-2%] top-[6%] w-[17%]", rotate: -14, sway: 5.2, delay: 0.5 },
  { name: "broccoli", className: "left-[12%] top-[-4%] w-[17%]", rotate: 8, sway: 6.4, delay: 0.62 },
  { name: "lemon", className: "right-[2%] top-[-2%] w-[16%]", rotate: 16, sway: 5.8, delay: 0.74 },
  { name: "carrot", className: "right-[-3%] top-[32%] w-[16%]", rotate: -10, sway: 4.8, delay: 0.86 },
  { name: "avocado", className: "left-[-4%] top-[50%] w-[16%]", rotate: 12, sway: 6.8, delay: 0.98 },
  { name: "strawberry", className: "right-[6%] bottom-[16%] w-[14%]", rotate: 8, sway: 5.4, delay: 1.1 },
  { name: "pepper", className: "left-[8%] bottom-[2%] w-[15%]", rotate: -8, sway: 6.1, delay: 1.22 },
  { name: "eggplant", className: "right-[22%] bottom-[-4%] w-[14%]", rotate: 18, sway: 5.0, delay: 1.34 },
  { name: "apple", className: "left-[34%] bottom-[-6%] w-[13%]", rotate: -6, sway: 6.6, delay: 1.46 },
  { name: "mushroom", className: "right-[36%] top-[-6%] w-[13%]", rotate: 6, sway: 5.6, delay: 1.58 },
];

const CARDS = [
  { name: "Борщ с говядиной", rotate: -7, x: "6%", y: "10%", w: "50%", delay: 0.2 },
  { name: "Паста болоньезе", rotate: 6, x: "44%", y: "6%", w: "48%", delay: 0.34 },
  { name: "Запечённый лосось с брокколи", rotate: -2, x: "22%", y: "46%", w: "54%", delay: 0.48 },
];

export default function HomePage() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);

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
          <Link to="/catalog" className="nav-link">
            Рецепты
          </Link>
          {user ? (
            <Link to="/plans" className="btn btn-primary btn-sm">
              Мои планы
            </Link>
          ) : (
            <Link to="/login" className="btn btn-outline btn-sm">
              Войти
            </Link>
          )}
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
        <div className="relative order-1 mx-auto aspect-square w-full max-w-[400px] md:order-2 md:max-w-[520px]">
          {CARDS.map((c) => (
            <motion.div
              key={c.name}
              initial={{ opacity: 0, y: 70, rotate: c.rotate * 2.4, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, rotate: c.rotate, scale: 1 }}
              transition={{ delay: c.delay, type: "spring", stiffness: 80, damping: 13 }}
              style={{ left: c.x, top: c.y, width: c.w }}
              className="absolute"
            >
              <DishArt
                recipeName={c.name}
                className="aspect-square w-full rounded-[36px] border-[6px] border-white shadow-[0_24px_48px_-20px_rgba(22,26,16,0.45)]"
              />
            </motion.div>
          ))}

          {PRODUCE.map((p) => (
            <motion.div
              key={p.name}
              initial={{ scale: 0, rotate: p.rotate - 50, opacity: 0 }}
              animate={{ scale: 1, rotate: p.rotate, opacity: 1 }}
              whileHover={{ scale: 1.18, rotate: p.rotate + 12 }}
              transition={{ delay: p.delay, type: "spring", stiffness: 240, damping: 12 }}
              className={`absolute ${p.className}`}
            >
              <div className="animate-sway" style={{ animationDuration: `${p.sway}s`, animationDelay: `${-p.delay * 2}s` }}>
                <Produce name={p.name} className="w-full drop-shadow-[0_10px_14px_rgba(22,26,16,0.18)]" />
              </div>
            </motion.div>
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
            className="card flex items-center gap-4 !p-4"
          >
            <Produce name={s.produce} className="h-14 w-14 flex-shrink-0" />
            <div>
              <p className="text-accent-ink text-lg leading-tight font-bold">{s.title}</p>
              <p className="text-muted text-sm">{s.text}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
