import type { GroceryList } from "@/shared/api";
import { formatPrice } from "@/shared/lib";
import { ProductMatchCard } from "@/entities/grocery-item";
import { useToggleGroceryItem } from "@/features/toggle-grocery-item";

export default function GroceryListView({ list }: { list: GroceryList }) {
  const toggle = useToggleGroceryItem();

  const boughtItems = list.items.filter((i) => i.is_bought);
  const boughtCost = boughtItems.reduce(
    (sum, item) =>
      sum +
      (item.total_price ??
        (item.price_per_package !== null && item.package_count !== null
          ? item.price_per_package * item.package_count
          : 0)),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="data-frame">
        <div className="data-row">
          <span className="data-label">Итого</span>
          <span className="data-value">{formatPrice(list.total_cost)}</span>
        </div>
        <div className="data-row">
          <span className="data-label">Куплено</span>
          <span className="data-value text-accent-ink">
            {formatPrice(boughtCost)} · {boughtItems.length}/{list.items.length}
          </span>
        </div>
        <div className="data-row">
          <span className="data-label">Найдено</span>
          <span className="data-value">{list.matched_count}</span>
        </div>
        {list.review_count > 0 && (
          <div className="data-row">
            <span className="data-label">Проверить</span>
            <span className="data-value text-[#b07400]">{list.review_count}</span>
          </div>
        )}
        {list.not_found_count > 0 && (
          <div className="data-row">
            <span className="data-label">Не найдено</span>
            <span className="data-value text-danger">
              {list.not_found_count}
            </span>
          </div>
        )}
      </div>

      <div className="data-frame">
        {list.items.map((item) => (
          <ProductMatchCard key={item.id} item={item} onToggle={toggle} />
        ))}
      </div>
    </div>
  );
}
