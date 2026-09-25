import { HashRouter, Routes, Route } from 'react-router-dom';
import OnboardingPage from './pages/OnboardingPage';
import GeneratingPage from './pages/GeneratingPage';
import MealPlanPage from './pages/MealPlanPage';
import RecipePage from './pages/RecipePage';
import GroceryListPage from './pages/GroceryListPage';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<OnboardingPage />} />
        <Route path="/generating" element={<GeneratingPage />} />
        <Route path="/plan/:id" element={<MealPlanPage />} />
        <Route path="/recipe/:id" element={<RecipePage />} />
        <Route path="/plan/:id/grocery" element={<GroceryListPage />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
