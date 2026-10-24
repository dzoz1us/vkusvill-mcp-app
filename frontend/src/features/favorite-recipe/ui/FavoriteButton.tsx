import { useState } from "react";
import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { api } from "@/shared/api";
import { useUserStore } from "@/entities/user";

interface Props {
  recipeId: string;
  active: boolean;
  onChange?: (active: boolean) => void;
  className?: string;
}

/** Сердечко: добавляет рецепт в избранное или убирает. Гостя отправляет на вход. */
export default function FavoriteButton({ recipeId, active, onChange, className = "" }: Props) {
  const user = useUserStore((s) => s.user);
  const navigate = useNavigate();
  const [on, setOn] = useState(active);
  const [busy, setBusy] = useState(false);

  const toggle = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return navigate("/login?next=/catalog");
    if (busy) return;
    setBusy(true);
    const next = !on;
    setOn(next);
    try {
      if (next) await api.addFavorite(recipeId);
      else await api.removeFavorite(recipeId);
      onChange?.(next);
    } catch {
      setOn(!next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Убрать из избранного" : "В избранное"}
      title={on ? "Убрать из избранного" : "В избранное"}
      className={`icon-btn ${on ? "text-berry border-berry" : ""} ${className}`}
    >
      <Heart className={on ? "fill-current" : ""} />
    </button>
  );
}
