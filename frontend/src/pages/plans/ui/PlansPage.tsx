import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bookmark, Plus } from "lucide-react";
import { api } from "@/shared/api";
import type { PlanSummary } from "@/shared/api";
import { DAY_SHORT, formatDate, formatPrice } from "@/shared/lib";
import { FoodIcon } from "@/shared/ui";

export default function PlansPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<PlanSummary[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.listPlans().then(setPlans).catch(() => {
      setFailed(true);
      setPlans([]);
    });
  }, []);

  return (
    <div className="page">
      <div className="page-head justify-between gap-3">
        <h1 className="heading">Мои планы</h1>
        <button className="icon-btn !border-accent-strong !bg-accent-strong !text-white" onClick={() => navigate("/start")} aria-label="Новый план" title="Новый план">
          <Plus />
        </button>
      </div>

      {plans === null && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-28" />
          ))}
        </div>
      )}

      {plans?.length === 0 && (
        <div className="py-12 text-center">
          <FoodIcon name="green-salad" className="mx-auto mb-3 h-16 w-16" />
          <p className="text-lg font-bold">{failed ? "Планы не загрузились" : "Планов пока нет"}</p>
          {!failed && <p className="text-muted">Ответьте на несколько вопросов, и мы соберём меню</p>}
        </div>
      )}

      <div className="grid gap-3">
        {plans?.map((p) => (
          <Link key={p.id} to={`/plan/${p.id}`} className="card hover:border-accent block transition-colors">
            <div className="flex items-start justify-between gap-3">
              <p className="text-lg font-bold">{p.title || `План №${p.id}`}</p>
              {p.saved && <Bookmark className="text-accent-strong h-5 w-5 flex-shrink-0 fill-current" aria-label="Сохранён" />}
            </div>
            <p className="text-muted mt-1 text-sm">
              {formatDate(p.created_at)} · {p.people_count} чел. · {p.meals_count} блюд
            </p>
            <p className="text-muted mt-0.5 text-sm">{p.days.map((d) => DAY_SHORT[d]).join(", ")}</p>
            <p className="mt-2 font-bold">
              {formatPrice(Math.round(p.cart_estimated_cost))}
              <span className="text-muted font-medium"> из {formatPrice(p.budget)}</span>
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
