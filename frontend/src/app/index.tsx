import { useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "@/pages/home";
import { OnboardingPage } from "@/pages/onboarding";
import { GeneratingPage } from "@/pages/generating";
import { MealPlanPage } from "@/pages/meal-plan";
import { RecipePage } from "@/pages/recipe";
import { GroceryListPage } from "@/pages/grocery-list";
import { CatalogPage } from "@/pages/catalog";
import { PlansPage } from "@/pages/plans";
import { OrdersPage } from "@/pages/orders";
import { ProfilePage } from "@/pages/profile";
import { AdminPage } from "@/pages/admin";
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from "@/pages/auth";
import { AppShell } from "@/widgets/app-shell";
import { RequireAuth } from "@/features/auth";
import { useUserStore } from "@/entities/user";
import ScrollToTop from "./ScrollToTop";
import "./styles/index.css";

export default function App() {
  const init = useUserStore((s) => s.init);
  useEffect(() => {
    void init();
  }, [init]);

  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/start" element={<OnboardingPage />} />
        <Route path="/generating" element={<RequireAuth><GeneratingPage /></RequireAuth>} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<AppShell />}>
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/recipe/:id" element={<RecipePage />} />
          <Route path="/plans" element={<RequireAuth><PlansPage /></RequireAuth>} />
          <Route path="/plan/:id" element={<RequireAuth><MealPlanPage /></RequireAuth>} />
          <Route path="/plan/:id/grocery" element={<RequireAuth><GroceryListPage /></RequireAuth>} />
          <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth admin><AdminPage /></RequireAuth>} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
