import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { PageSkeleton } from "@/shared/ui";
import { useUserStore } from "@/entities/user";

/** Пускает только вошедших; админские страницы — только администратора. */
export default function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { user, ready } = useUserStore();
  const location = useLocation();

  if (!ready) return <PageSkeleton rows={3} />;
  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }
  if (admin && user.role !== "ADMIN") return <Navigate to="/" replace />;
  return <>{children}</>;
}
