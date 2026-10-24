import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FoodIcon, PageHeader, PageSkeleton, StateCard } from "@/shared/ui";
import { useGroceryStore } from "@/entities/grocery-item";
import { GroceryListView } from "@/widgets/grocery-list";
import { CreateCartButton } from "@/features/create-cart";

export default function GroceryListPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { groceryList, groceryState, loadGroceryList } = useGroceryStore();

  useEffect(() => {
    if (id) void loadGroceryList(id);
  }, [id]);

  if (groceryState === "error") {
    return (
      <StateCard
        icon={<FoodIcon name="confused-face" className="h-12 w-12" />}
        title="Список не загрузился"
        action={
          <button
            onClick={() => id && loadGroceryList(id)}
            className="btn btn-primary w-full"
          >
            Повторить
          </button>
        }
      />
    );
  }

  if (groceryState === "loading" || !groceryList) {
    return <PageSkeleton rows={4} />;
  }

  return (
    <div className="page">
      <PageHeader title="Покупки" onBack={() => navigate(-1)} />
      <main className="space-y-6">
        <GroceryListView list={groceryList} />
        {id && <CreateCartButton planId={id} />}
      </main>
    </div>
  );
}
