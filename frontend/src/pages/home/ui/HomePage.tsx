import { Link, useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "motion/react";
import type { Variants } from "motion/react";
import borscht from "@/shared/assets/dishes/borscht.webp";
import pasta from "@/shared/assets/dishes/pasta.webp";
import salmon from "@/shared/assets/dishes/salmon.webp";
import { APP_NAME } from "@/shared/lib";
import { Icon, Produce } from "@/shared/ui";
import type { IconName, ProduceName } from "@/shared/ui";
import { useUserStore } from "@/entities/user";

const HEADLINE = ["Меню", "на", "неделю", "и", "корзина", "во", "ВкусВилл"];

/** Три шага: значок показывает само действие */
const STEPS: { icon: IconName; title: string; text: string }[] = [
  { icon: "list-checks", title: "Отвечаете", text: "на семь коротких вопросов" },
  { icon: "calendar-check", title: "Получаете", text: "меню по дням и список покупок" },
  { icon: "shopping-cart", title: "Заказываете", text: "одной ссылкой во ВкусВилл" },
];

const PHOTOS = [
  { src: borscht, alt: "Борщ", style: { left: "2%", top: "4%", width: "54%" }, rotate: -5, from: "-30%" },
  { src: pasta, alt: "Паста болоньезе", style: { right: "0%", top: "14%", width: "48%" }, rotate: 4, from: "30%" },
  { src: salmon, alt: "Лосось с овощами", style: { left: "22%", bottom: "0%", width: "52%" }, rotate: -2, from: "0%" },
];

/** Четыре овоща «падают» сверху и слегка качаются в уголках композиции */
const DROPS: { name: ProduceName; className: string; rotate: number; delay: number }[] = [
  { name: "tomato", className: "left-[-2%] bottom-[22%] w-[15%]", rotate: -12, delay: 0.9 },
  { name: "lemon", className: "right-[-1%] top-[-3%] w-[15%]", rotate: 14, delay: 1.05 },
  { name: "avocado", className: "left-[8%] top-[-5%] w-[14%]", rotate: 10, delay: 1.2 },
  { name: "strawberry", className: "right-[4%] bottom-[8%] w-[14%]", rotate: 8, delay: 1.35 },
];

const word: Variants = {
  hidden: { y: "105%" },
  show: (i: number) => ({ y: 0, transition: { delay: 0.12 + i * 0.07, duration: 0.65, ease: [0.16, 1, 0.3, 1] } }),
};

export default function HomePage() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);

  // Фото плавно смещаются при прокрутке
  const { scrollY } = useScroll();
  const lift = useTransform(scrollY, [0, 500], [0, -40]);
  const sink = useTransform(scrollY, [0, 500], [0, 30]);

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden">
      {/* Два мягких круга дышат за композицией */}
      <motion.div
        aria-hidden="true"
        className="bg-accent-soft absolute -top-24 -right-32 h-[460px] w-[460px] rounded-full md:top-1/4 md:right-[-8%] md:h-[640px] md:w-[640px]"
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="bg-mustard-soft absolute top-[38%] -left-24 h-[260px] w-[260px] rounded-full opacity-70"
        animate={{ scale: [1, 1.12, 1], x: [0, 14, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

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

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.5 }}
            className="mt-8"
          >
            <button onClick={() => navigate("/start")} className="btn btn-primary w-full text-[22px] sm:w-auto sm:min-w-[260px]">
              Старт
            </button>
          </motion.div>
        </div>

        {/* Три блюда раскрываются кругом, овощи падают сверху */}
        <div className="relative order-1 mx-auto aspect-square w-full max-w-[400px] md:order-2 md:max-w-[520px]">
          {PHOTOS.map((p, i) => (
            <motion.div key={p.alt} className="absolute" style={{ ...p.style, y: i === 1 ? sink : lift }}>
              <motion.img
                src={p.src}
                alt={p.alt}
                width={720}
                height={720}
                initial={{ clipPath: "circle(0% at 50% 50%)", x: p.from, rotate: p.rotate * 3, scale: 0.9 }}
                animate={{ clipPath: "circle(75% at 50% 50%)", x: 0, rotate: p.rotate, scale: 1 }}
                transition={{ delay: 0.25 + i * 0.18, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="aspect-square w-full rounded-[36px] object-cover shadow-[0_24px_48px_-22px_rgba(22,26,16,0.5)]"
              />
            </motion.div>
          ))}

          {DROPS.map((d, i) => (
            <motion.div
              key={d.name}
              className={`absolute ${d.className}`}
              initial={{ y: -260, opacity: 0, rotate: d.rotate - 60 }}
              animate={{ y: 0, opacity: 1, rotate: d.rotate }}
              transition={{ delay: d.delay, type: "spring", stiffness: 140, damping: 9, mass: 0.9 }}
            >
              <div className="animate-sway" style={{ animationDuration: `${5 + i * 0.7}s`, animationDelay: `${-i}s` }}>
                <Produce name={d.name} className="w-full drop-shadow-[0_10px_14px_rgba(22,26,16,0.18)]" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Три шага: значок, подпись и вторая кнопка «Старт» под ними */}
      <div className="relative mx-auto w-full max-w-6xl px-5 pb-12">
        <div className="relative grid gap-3 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 26 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.12, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="card flex items-center gap-4 !p-4"
            >
              <span className="tile flex-shrink-0">
                <Icon name={s.icon} className="text-accent-strong h-8 w-8" />
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
