import { useEffect, useState } from "react";
import { api } from "@/shared/api";
import type { Recipe } from "@/shared/api";

type RecipeState = "loading" | "success" | "not_found";

export function useRecipe(id: string | undefined) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [state, setState] = useState<RecipeState>("loading");

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setState("loading");
    api
      .getRecipe(id)
      .then((data) => {
        if (cancelled) return;
        setRecipe(data);
        setState("success");
      })
      .catch(() => {
        if (!cancelled) setState("not_found");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return { recipe, state };
}
