import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { DishArt, FoodIcon } from "@/shared/ui";
import type { FoodIconName } from "@/shared/ui";

const HEADLINE = ["Меню", "на", "неделю", "и", "корзина", "во", "ВкусВилл"];

const DISHES = [
  "Борщ с говядиной",
  "Сырники со сметаной",
  "Паста болоньезе",
  "Запечённый лосось с брокколи",
  "Плов с курицей",
  "Овсянка с ягодами и мёдом",
  "Ризотто с грибами",
  "Греческий салат с курицей",
  "Куриный суп с лапшой",
  "Омлет с овощами",
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

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden">
      {/* Один плоский салатовый круг за фото */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="bg-accent-soft absolute -top-24 -right-32 h-[520px] w-[520px] rounded-full md:top-1/2 md:right-[-8%] md:h-[760px] md:w-[760px] md:-translate-y-1/2"
      />

      <header className="relative mx-auto flex w-full max-w-6xl items-center px-5 pt-[calc(1.25rem+env(safe-area-inset-top))]">
        <span className="font-display text-accent-ink text-2xl font-bold tracking-tight">Всласть</span>
      </header>

      <div className="relative mx-auto grid w-full max-w-6xl flex-1 items-center gap-8 px-5 pt-6 pb-8 md:grid-cols-2 md:gap-12">
        <div className="order-2 md:order-1">
          <h1 className="font-display text-[34px] leading-[1.12] font-bold tracking-tight sm:text-5xl md:text-[56px]">
            {HEADLINE.map((word, i) => (
              <span key={i} className="mr-[0.28em] inline-block overflow-hidden align-bottom">
                <motion.span
                  className={`inline-block ${word === "ВкусВилл" ? "text-accent-ink" : ""}`}
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

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.95, duration: 0.5 }}
            className="mt-8"
          >
            <button
              onClick={() => navigate("/start")}
              className="btn btn-primary w-full text-[22px] sm:w-auto sm:min-w-[260px]"
            >
              Старт
            </button>
          </motion.div>
        </div>

        {/* Коллаж из фото */}
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

      {/* Бегущая строка с блюдами из базы */}
      <div className="border-line relative overflow-hidden border-y bg-white py-3.5" aria-hidden="true">
        <div className="animate-marquee flex w-max gap-8 whitespace-nowrap">
          {[...DISHES, ...DISHES].map((d, i) => (
            <span key={i} className="flex items-center gap-8 text-lg font-bold">
              {d}
              <span className="bg-accent h-2.5 w-2.5 rounded-full" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
