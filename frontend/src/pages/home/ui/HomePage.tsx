import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { animate, motion } from "motion/react";
import { Check, ClipboardCheck, Salad, ShoppingBasket } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FoodIcon, Logo } from "@/shared/ui";
import type { FoodIconName } from "@/shared/ui";
import { formatPrice } from "@/shared/lib";
import { useUserStore } from "@/entities/user";

const HEADLINE = ["Меню", "на", "неделю", "и", "корзина", "во", "ВкусВилл"];

/** Три шага: значок по смыслу шага */
const STEPS: { icon: LucideIcon; title: string; text: string; tile: string }[] = [
  { icon: ClipboardCheck, title: "Отвечаете", text: "на семь коротких вопросов", tile: "bg-sky-soft text-sky" },
  { icon: Salad, title: "Получаете", text: "меню по дням и список покупок", tile: "bg-accent-soft text-accent-strong" },
  { icon: ShoppingBasket, title: "Заказываете", text: "одной ссылкой во ВкусВилл", tile: "bg-tomato-soft text-tomato" },
];

const MEALS: { icon: FoodIconName; label: string; dish: string }[] = [
  { icon: "croissant", label: "Завтрак", dish: "Круассан с сыром" },
  { icon: "pot-of-food", label: "Обед", dish: "Борщ с говядиной" },
  { icon: "shallow-pan-of-food", label: "Ужин", dish: "Курица с овощами" },
];

const BUDGET = 1500;
const COST = 1340;
const PRODUCTS = 23;

/** Живой пример: блюда по очереди попадают в меню, бюджет заполняется, корзина считает продукты. */
function MenuPreview() {
  const [step, setStep] = useState(0); // сколько блюд уже в меню (0..3), потом пауза и заново
  const [cost, setCost] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setStep((s) => (s >= 4 ? 0 : s + 1)), 1200);
    return () => clearInterval(t);
  }, []);

  const shown = Math.min(step, 3);
  const target = step === 0 ? 0 : step >= 3 ? COST : Math.round((COST / 3) * step);

  useEffect(() => {
    const controls = animate(cost, target, { duration: 0.9, ease: "easeOut", onUpdate: (v) => setCost(Math.round(v)) });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: -1.5 }}
      transition={{ delay: 0.3, type: "spring", stiffness: 90, damping: 14 }}
      className="mx-auto w-full max-w-[420px]"
    >
      <div className="animate-bob">
        <div className="card !rounded-[36px] border-2 !p-5 shadow-[0_24px_48px_-26px_rgba(22,26,16,0.45)]">
          <p className="text-ink text-xl font-extrabold">Понедельник</p>

          <ul className="mt-3 space-y-2.5">
            {MEALS.map((m, i) => {
              const on = i < shown;
              return (
                <li key={m.label} className="flex items-center gap-3">
                  <FoodIcon name={m.icon} className="h-9 w-9 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-muted text-xs font-semibold">{m.label}</p>
                    <motion.p
                      animate={{ opacity: on ? 1 : 0.25, x: on ? 0 : -6 }}
                      transition={{ duration: 0.4 }}
                      className="text-ink truncate font-bold"
                    >
                      {m.dish}
                    </motion.p>
                  </div>
                  <motion.span
                    animate={{ scale: on ? 1 : 0.6, opacity: on ? 1 : 0 }}
                    transition={{ type: "spring", stiffness: 420, damping: 18 }}
                    className="bg-accent-strong flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-white"
                  >
                    <Check className="h-4 w-4" strokeWidth={3.5} />
                  </motion.span>
                </li>
              );
            })}
          </ul>

          <div className="mt-5">
            <div className="text-ink flex items-baseline justify-between font-bold">
              <span>{formatPrice(cost)}</span>
              <span className="text-muted text-sm font-semibold">из {formatPrice(BUDGET)}</span>
            </div>
            <div className="border-line mt-2 h-3 overflow-hidden rounded-full border bg-white" aria-hidden="true">
              <motion.div className="bg-accent-strong h-full rounded-full" animate={{ width: `${(cost / BUDGET) * 100}%` }} transition={{ duration: 0.4 }} />
            </div>
          </div>

          <motion.p
            animate={{ opacity: shown >= 3 ? 1 : 0.3 }}
            transition={{ duration: 0.4 }}
            className="text-ink mt-4 flex items-center gap-2 font-bold"
          >
            <ShoppingBasket className="text-tomato h-5 w-5" strokeWidth={2} />
            Корзина: {shown >= 3 ? PRODUCTS : 0} продукта
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const user = useUserStore((s) => s.user);

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden">
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
          <Link to="/catalog" className="nav-link hidden sm:inline-flex">
            Рецепты
          </Link>
          <Link to={user ? "/plans" : "/login"} className="btn btn-primary btn-sm">
            {user ? "Мои планы" : "Войти"}
          </Link>
        </nav>
      </header>

      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-8 px-5 pt-8 pb-6 md:grid-cols-2 md:gap-12">
        <div>
          <h1 className="text-ink font-display text-[27px] leading-[1.15] font-bold tracking-tight sm:text-[40px] md:text-[44px]">
            {HEADLINE.map((word, i) => (
              <span key={i} className="mr-[0.28em] inline-block overflow-hidden align-bottom">
                <motion.span
                  className="inline-block"
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.1 + i * 0.07, duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
                >
                  {word === "ВкусВилл" ? <span className="text-accent-strong">{word}</span> : word}
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
            Семь вопросов — и у вас рецепты на каждый день, список покупок и корзина продуктов.
          </motion.p>
        </div>

        <MenuPreview />
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
              <span className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[20px] ${s.tile}`}>
                <s.icon className="h-7 w-7" strokeWidth={2} />
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
          <button onClick={() => navigate("/start")} className="btn btn-primary w-full sm:w-auto sm:min-w-[260px]">
            Старт
          </button>
        </motion.div>
      </div>
    </div>
  );
}
