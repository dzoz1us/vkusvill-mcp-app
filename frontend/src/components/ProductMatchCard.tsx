import type { GroceryItem, MatchStatus } from "../types";
import { Check, AlertTriangle, XCircle, Package } from "lucide-react";
import { formatPrice } from "../utils/helpers";

const STATUS_CONFIG: Record<
  MatchStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  matched: {
    label: "Найден",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    icon: <Check className="w-3.5 h-3.5" />,
  },
  requires_review: {
    label: "Проверьте",
    color: "text-amber-600",
    bg: "bg-amber-50",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  not_found: {
    label: "Не найден",
    color: "text-red-600",
    bg: "bg-red-50",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

interface ProductMatchCardProps {
  item: GroceryItem;
  onToggle: (itemId: string, isBought: boolean) => void;
}

export default function ProductMatchCard({
  item,
  onToggle,
}: ProductMatchCardProps) {
  const statusConfig = STATUS_CONFIG[item.match_status];
  const totalPrice =
    item.total_price ??
    (item.price_per_package !== null && item.package_count !== null
      ? item.price_per_package * item.package_count
      : null);
  const hasPackageDetails =
    item.package_count !== null && item.package_quantity !== null;

  return (
    <div
      className={`p-4 flex items-center gap-4 transition ${
        item.is_bought ? "bg-gray-50 opacity-60" : ""
      } ${item.match_status === "not_found" ? "border-l-4 border-l-red-300" : ""}`}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(item.id, !item.is_bought)}
        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition flex-shrink-0 ${
          item.is_bought
            ? "bg-emerald-500 border-emerald-500"
            : "border-gray-300 hover:border-emerald-400"
        }`}
      >
        {item.is_bought && <Check className="w-4 h-4 text-white" />}
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className={`font-medium truncate ${item.is_bought ? "line-through text-gray-400" : "text-gray-900"}`}
          >
            {item.product_name}
          </p>
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}
          >
            {statusConfig.icon}
            {statusConfig.label}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Package className="w-3 h-3" />
            {item.needed_quantity} {item.needed_unit}
          </span>
          {hasPackageDetails && (
            <span>
              {item.package_count} × {item.package_quantity}{" "}
              {item.package_unit ?? item.needed_unit}
            </span>
          )}
        </div>
      </div>

      {/* Price */}
      <div className="text-right flex-shrink-0">
        <p
          className={`font-semibold ${item.is_bought ? "text-gray-400" : "text-gray-900"}`}
        >
          {totalPrice === null ? "Цена не найдена" : formatPrice(totalPrice)}
        </p>
        {item.price_per_package !== null && (
          <p className="text-xs text-gray-400">
            {formatPrice(item.price_per_package)}/уп.
          </p>
        )}
      </div>
    </div>
  );
}
