import type { GroceryList } from "@/shared/api";
import { formatPrice } from "@/shared/lib";
import { ProductMatchCard } from "@/entities/grocery-item";
import { useToggleGroceryItem } from "@/features/toggle-grocery-item";
import {
  AddGroceryItemButton,
  CheckAvailabilityButton,
  GroceryItemActions,
} from "@/features/edit-grocery-item";

export default function GroceryListView({ planId, list }: { planId: string; list: GroceryList }) {
  const toggle = useToggleGroceryItem();

  const boughtItems = list.items.filter((i) => i.is_bought);
  const boughtCost = boughtItems.reduce((sum, item) => sum + (item.total_price ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="data-frame">
        <div className="data-row">
          <span className="data-label">Итого</span>
          <span className="data-value">{formatPrice(Math.round(list.total_cost))}</span>
        </div>
        <div className="data-row">
          <span className="data-label">Куплено</span>
          <span className="data-value text-accent-ink">
            {formatPrice(Math.round(boughtCost))} · {boughtItems.length}/{list.items.length}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <CheckAvailabilityButton planId={planId} />
        <AddGroceryItemButton planId={planId} />
      </div>

      {list.items.length === 0 ? (
        <p className="text-muted py-8 text-center">Список пуст</p>
      ) : (
        <div className="data-frame">
          {list.items.map((item) => (
            <ProductMatchCard
              key={item.id}
              item={item}
              onToggle={toggle}
              actions={<GroceryItemActions planId={planId} item={item} />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
