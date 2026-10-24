import { Check } from "lucide-react";
import type { GroceryItem, MatchStatus } from "@/shared/api";
import { formatPrice } from "@/shared/lib";

const STATUS_CONFIG: Record<MatchStatus, { label: string; cls: string }> = {
  matched: { label: "Найден", cls: "pill-ok" },
  requires_review: { label: "Проверьте", cls: "pill-warn" },
  not_found: { label: "Не найден", cls: "pill-bad" },
};

interface ProductMatchCardProps {
  item: GroceryItem;
  onToggle: (itemId: string, isBought: boolean) => void;
}

export default function ProductMatchCard({
  item,
  onToggle,
}: ProductMatchCardProps) {
  const status = STATUS_CONFIG[item.match_status];
  const totalPrice =
    item.total_price ??
    (item.price_per_package !== null && item.package_count !== null
      ? item.price_per_package * item.package_count
      : null);
  const hasPackageDetails =
    item.package_count !== null && item.package_quantity !== null;

  return (
    <label
      className={`flex cursor-pointer items-center gap-4 px-5 py-4 ${
        item.is_bought ? "opacity-60" : ""
      }`}
    >
      <input
        type="checkbox"
        className="peer sr-only"
        checked={item.is_bought}
        onChange={() => onToggle(item.id, !item.is_bought)}
      />
      <span
        className={`checkbox peer-focus-visible:outline-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 ${
          item.is_bought ? "checkbox-on" : ""
        }`}
        aria-hidden="true"
      >
        {item.is_bought && <Check className="h-4 w-4" strokeWidth={3} />}
      </span>

      <div className="min-w-0 flex-1">
        <p className={`font-bold ${item.is_bought ? "line-through" : ""}`}>
          {item.product_name}
        </p>
        <div className="text-muted mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span>
            {item.needed_quantity} {item.needed_unit}
          </span>
          {hasPackageDetails && (
            <span>
              {item.package_count} × {item.package_quantity}{" "}
              {item.package_unit ?? item.needed_unit}
            </span>
          )}
          {item.match_status !== "matched" && (
            <span className={`pill ${status.cls}`}>{status.label}</span>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 text-right">
        <p className="font-bold">
          {totalPrice === null ? "—" : formatPrice(totalPrice)}
        </p>
        {item.price_per_package !== null && (
          <p className="text-muted text-xs">
            {formatPrice(item.price_per_package)}/уп.
          </p>
        )}
      </div>
    </label>
  );
}
