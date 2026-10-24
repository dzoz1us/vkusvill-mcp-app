import type { ReactNode } from "react";
import { Check } from "lucide-react";
import type { GroceryItem, MatchStatus } from "@/shared/api";
import { formatPrice, unitLabel } from "@/shared/lib";

const STATUS_CONFIG: Record<MatchStatus, { label: string; cls: string }> = {
  matched: { label: "Найден", cls: "pill-ok" },
  requires_review: { label: "Проверьте", cls: "pill-warn" },
  not_found: { label: "Не найден", cls: "pill-bad" },
};

interface ProductMatchCardProps {
  item: GroceryItem;
  onToggle: (itemId: string, isBought: boolean) => void;
  /** Слот для действий: количество, замена, удаление. */
  actions?: ReactNode;
}

export default function ProductMatchCard({ item, onToggle, actions }: ProductMatchCardProps) {
  const status = STATUS_CONFIG[item.match_status];
  const totalPrice =
    item.total_price ??
    (item.price_per_package !== null && item.package_count !== null
      ? item.price_per_package * item.package_count
      : null);

  return (
    <div className={`px-5 py-4 ${item.is_bought ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-4">
        <button
          role="checkbox"
          aria-checked={item.is_bought}
          aria-label={`Куплено: ${item.product_name}`}
          onClick={() => onToggle(item.id, !item.is_bought)}
          className={`checkbox mt-1 ${item.is_bought ? "checkbox-on" : ""}`}
        >
          {item.is_bought && <Check className="h-4 w-4" strokeWidth={3} />}
        </button>

        <div className="min-w-0 flex-1">
          <p className={`font-bold ${item.is_bought ? "line-through" : ""}`}>
            {item.product_url ? (
              <a href={item.product_url} target="_blank" rel="noopener noreferrer" className="hover:text-accent-ink">
                {item.product_name}
              </a>
            ) : (
              item.product_name
            )}
          </p>
          <div className="text-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            <span>
              нужно {Math.round(item.needed_quantity * 10) / 10} {unitLabel(item.needed_unit)}
            </span>
            {item.match_status !== "matched" && <span className={`pill ${status.cls}`}>{status.label}</span>}
            {item.is_manual && <span className="pill pill-ok">Своя позиция</span>}
          </div>
        </div>

        <div className="flex-shrink-0 text-right">
          <p className="font-bold">{totalPrice === null ? "—" : formatPrice(Math.round(totalPrice))}</p>
          {item.price_per_package !== null && (
            <p className="text-muted text-xs">{formatPrice(item.price_per_package)}{item.sold_by_weight ? "/кг" : "/уп."}</p>
          )}
        </div>
      </div>
      {actions && <div className="mt-3 ml-10 flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
