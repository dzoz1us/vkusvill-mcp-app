import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../store";

const STAGES = [
  { text: "Анализируем ваши предпочтения...", emoji: "🔍" },
  { text: "Подбираем рецепты из каталога...", emoji: "📖" },
  { text: "Оптимизируем список продуктов...", emoji: "🛒" },
  { text: "Рассчитываем бюджет...", emoji: "💰" },
  { text: "Формируем план питания...", emoji: "✨" },
];

export default function GeneratingPage() {
  const navigate = useNavigate();
  const { currentPlan, planState, planError, generatePlan } = useAppStore();
  const generationStarted = useRef(false);

  // Запускаем генерацию при монтировании
  useEffect(() => {
    if (planState !== "idle" || generationStarted.current) return;
    generationStarted.current = true;
    void generatePlan();
  }, [generatePlan, planState]);

  useEffect(() => {
    if (planState === "success" && currentPlan) {
      const timer = setTimeout(() => {
        navigate(`/plan/${currentPlan.id}`);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [planState, currentPlan, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md w-full">
        {planState === "error" ? (
          <div className="bg-white rounded-2xl shadow-lg border border-red-100 p-8">
            <div className="text-5xl mb-4">😔</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Ошибка генерации
            </h2>
            <p className="text-gray-500 mb-6">
              {planError || "Что-то пошло не так"}
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition"
            >
              Попробовать снова
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Animated icon */}
            <div className="relative">
              <div className="w-24 h-24 mx-auto bg-emerald-100 rounded-full flex items-center justify-center animate-pulse">
                <span className="text-5xl">🍳</span>
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-lg">✨</span>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Создаём ваш план
              </h2>
              <p className="text-gray-500">Это займёт пару минут</p>
            </div>

            {/* Stages */}
            <div className="space-y-3">
              {STAGES.map((stage, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 animate-fade-in"
                  style={{ animationDelay: `${i * 0.5}s` }}
                >
                  <span className="text-xl">{stage.emoji}</span>
                  <span className="text-sm text-gray-600">{stage.text}</span>
                  <div className="ml-auto">
                    <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  </div>
                </div>
              ))}
            </div>

            {/* Loading bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full animate-loading-bar" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
