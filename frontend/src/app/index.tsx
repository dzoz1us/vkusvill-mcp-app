import { HashRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "@/pages/home";
import { OnboardingPage } from "@/pages/onboarding";
import { GeneratingPage } from "@/pages/generating";
import { MealPlanPage } from "@/pages/meal-plan";
import { RecipePage } from "@/pages/recipe";
import { GroceryListPage } from "@/pages/grocery-list";
import ScrollToTop from "./ScrollToTop";
import "./styles/index.css";

export default function App() {
  return (
    <HashRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/start" element={<OnboardingPage />} />
        <Route path="/generating" element={<GeneratingPage />} />
        <Route path="/plan/:id" element={<MealPlanPage />} />
        <Route path="/recipe/:id" element={<RecipePage />} />
        <Route path="/plan/:id/grocery" element={<GroceryListPage />} />
      </Routes>
    </HashRouter>
  );
}
