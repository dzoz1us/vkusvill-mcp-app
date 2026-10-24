import { useState } from "react";
import type { ComponentType } from "react";
import UsersTab from "./UsersTab";
import RecipesTab from "./RecipesTab";
import CategoriesTab from "./CategoriesTab";
import ProductsTab from "./ProductsTab";
import OrdersTab from "./OrdersTab";
import StatusesTab from "./StatusesTab";

const TABS: { key: string; label: string; Component: ComponentType }[] = [
  { key: "users", label: "Пользователи", Component: UsersTab },
  { key: "recipes", label: "Рецепты", Component: RecipesTab },
  { key: "categories", label: "Категории", Component: CategoriesTab },
  { key: "products", label: "Продукты", Component: ProductsTab },
  { key: "orders", label: "Заказы", Component: OrdersTab },
  { key: "statuses", label: "Статусы", Component: StatusesTab },
];

export default function AdminPage() {
  const [tab, setTab] = useState(TABS[0].key);
  const Active = TABS.find((t) => t.key === tab)!.Component;

  return (
    <div className="page max-w-4xl pt-6">
      <h1 className="heading mb-5">Администрирование</h1>
      <div className="tabs mb-6" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            className={`chip flex-shrink-0 ${tab === t.key ? "chip-active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <Active />
    </div>
  );
}
