import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import type { DayOfWeek, PreferenceTag, DietType, ApplianceType } from '../types';
import {
  Users, Calendar, Wallet, Sparkles, Leaf, ChefHat, ArrowRight, ArrowLeft
} from 'lucide-react';

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 'mon', label: 'Пн' },
  { value: 'tue', label: 'Вт' },
  { value: 'wed', label: 'Ср' },
  { value: 'thu', label: 'Чт' },
  { value: 'fri', label: 'Пт' },
  { value: 'sat', label: 'Сб' },
  { value: 'sun', label: 'Вс' },
];

const PREFERENCES: { value: PreferenceTag; label: string; emoji: string }[] = [
  { value: 'quick', label: 'Быстро', emoji: '⚡' },
  { value: 'low_calorie', label: 'Низкокалорийное', emoji: '🥗' },
  { value: 'family', label: 'Семейное', emoji: '👨‍👩‍👧‍👦' },
  { value: 'healthy', label: 'Здоровое', emoji: '💚' },
  { value: 'high_protein', label: 'Высокий белок', emoji: '💪' },
  { value: 'budget', label: 'Бюджетное', emoji: '💰' },
  { value: 'hearty', label: 'Сытное', emoji: '🍖' },
];

const DIETS: { value: DietType; label: string }[] = [
  { value: 'none', label: 'Без ограничений' },
  { value: 'vegetarian', label: 'Вегетарианство' },
  { value: 'vegan', label: 'Веганство' },
  { value: 'pescatarian', label: 'Пескетарианство' },
];

const APPLIANCES: { value: ApplianceType; label: string; emoji: string }[] = [
  { value: 'stove', label: 'Плита', emoji: '🔥' },
  { value: 'oven', label: 'Духовка', emoji: '🫕' },
  { value: 'microwave', label: 'Микроволновка', emoji: '📡' },
  { value: 'multicooker', label: 'Мультиварка', emoji: '🍲' },
  { value: 'air_fryer', label: 'Аэрогриль', emoji: '💨' },
  { value: 'blender', label: 'Блендер', emoji: '🌀' },
];

const BUDGET_PRESETS = [2000, 3000, 5000, 8000, 12000];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { form, setFormField, generatePlan } = useAppStore();
  const [step, setStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const totalSteps = 6;

  const validate = (): string[] => {
    const errs: string[] = [];
    if (form.people_count < 1) errs.push('Укажите количество человек (минимум 1)');
    if (form.days.length === 0) errs.push('Выберите хотя бы один день');
    if (form.budget <= 0) errs.push('Бюджет должен быть больше 0');
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    setErrors([]);
    setIsGenerating(true);
    // Сбрасываем состояние плана для новой генерации
    useAppStore.setState({ planState: 'idle', currentPlan: null, planError: null });
    navigate('/generating');
  };

  const toggleDay = (day: DayOfWeek) => {
    const newDays = form.days.includes(day)
      ? form.days.filter(d => d !== day)
      : [...form.days, day];
    setFormField('days', newDays);
  };

  const togglePreference = (pref: PreferenceTag) => {
    const newPrefs = form.preferences.includes(pref)
      ? form.preferences.filter(p => p !== pref)
      : [...form.preferences, pref];
    setFormField('preferences', newPrefs);
  };

  const toggleAppliance = (app: ApplianceType) => {
    const newApps = form.appliances.includes(app)
      ? form.appliances.filter(a => a !== app)
      : [...form.appliances, app];
    setFormField('appliances', newApps);
  };

  const canProceed = () => {
    switch (step) {
      case 0: return form.people_count >= 1;
      case 1: return form.days.length > 0;
      case 2: return form.budget > 0;
      case 3: return true;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-4xl">🍽️</span>
            <h1 className="text-3xl font-bold text-gray-900">Mise Planner</h1>
          </div>
          <p className="text-gray-500">Персональный план питания с доставкой из ВкусВилл</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1 mb-8">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i <= step ? 'bg-emerald-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-8">
          {/* Step 1: People */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Сколько человек?</h2>
                  <p className="text-sm text-gray-500">Рассчитаем порции на всех</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setFormField('people_count', Math.max(1, form.people_count - 1))}
                  className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 transition"
                >
                  −
                </button>
                <span className="text-5xl font-bold text-emerald-600 w-20 text-center">
                  {form.people_count}
                </span>
                <button
                  onClick={() => setFormField('people_count', Math.min(10, form.people_count + 1))}
                  className="w-12 h-12 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-xl font-bold text-gray-600 transition"
                >
                  +
                </button>
              </div>
              <p className="text-center text-sm text-gray-400">
                {form.people_count === 1 ? 'На одного' : form.people_count <= 3 ? 'Маленькая компания' : 'Большая семья'}
              </p>
            </div>
          )}

          {/* Step 2: Days */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Какие дни?</h2>
                  <p className="text-sm text-gray-500">Выберите дни для планирования</p>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {DAYS.map(day => (
                  <button
                    key={day.value}
                    onClick={() => toggleDay(day.value)}
                    className={`py-3 rounded-xl font-medium text-sm transition-all ${
                      form.days.includes(day.value)
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormField('days', ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                >
                  Все дни
                </button>
                <button
                  onClick={() => setFormField('days', ['mon', 'tue', 'wed', 'thu', 'fri'])}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                >
                  Будни
                </button>
                <button
                  onClick={() => setFormField('days', ['sat', 'sun'])}
                  className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                >
                  Выходные
                </button>
              </div>
              {form.days.length > 0 && (
                <p className="text-sm text-emerald-600 font-medium">
                  Выбрано: {form.days.length} {form.days.length === 1 ? 'день' : form.days.length < 5 ? 'дня' : 'дней'}
                </p>
              )}
            </div>
          )}

          {/* Step 3: Budget */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Бюджет на неделю</h2>
                  <p className="text-sm text-gray-500">Ориентировочная стоимость продуктов</p>
                </div>
              </div>
              <div className="relative">
                <input
                  type="number"
                  value={form.budget}
                  onChange={e => setFormField('budget', Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full text-3xl font-bold text-center py-4 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none transition"
                  min="100"
                  step="100"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">₽</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {BUDGET_PRESETS.map(amount => (
                  <button
                    key={amount}
                    onClick={() => setFormField('budget', amount)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      form.budget === amount
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {amount.toLocaleString()} ₽
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Preferences */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Предпочтения</h2>
                  <p className="text-sm text-gray-500">Выберите что вам важно (необязательно)</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {PREFERENCES.map(pref => (
                  <button
                    key={pref.value}
                    onClick={() => togglePreference(pref.value)}
                    className={`p-3 rounded-xl text-left transition-all flex items-center gap-2 ${
                      form.preferences.includes(pref.value)
                        ? 'bg-emerald-50 border-2 border-emerald-400 text-emerald-700'
                        : 'bg-gray-50 border-2 border-transparent text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xl">{pref.emoji}</span>
                    <span className="text-sm font-medium">{pref.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Diet */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Диета</h2>
                  <p className="text-sm text-gray-500">Есть ли ограничения в питании?</p>
                </div>
              </div>
              <div className="space-y-3">
                {DIETS.map(diet => (
                  <button
                    key={diet.value}
                    onClick={() => setFormField('diet', diet.value)}
                    className={`w-full p-4 rounded-xl text-left transition-all flex items-center gap-3 ${
                      form.diet === diet.value
                        ? 'bg-emerald-50 border-2 border-emerald-400 text-emerald-700'
                        : 'bg-gray-50 border-2 border-transparent text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      form.diet === diet.value ? 'border-emerald-500' : 'border-gray-300'
                    }`}>
                      {form.diet === diet.value && (
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      )}
                    </div>
                    <span className="font-medium">{diet.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Appliances */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Техника на кухне</h2>
                  <p className="text-sm text-gray-500">Что у вас есть? (подберём подходящие рецепты)</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {APPLIANCES.map(app => (
                  <button
                    key={app.value}
                    onClick={() => toggleAppliance(app.value)}
                    className={`p-3 rounded-xl text-left transition-all flex items-center gap-2 ${
                      form.appliances.includes(app.value)
                        ? 'bg-emerald-50 border-2 border-emerald-400 text-emerald-700'
                        : 'bg-gray-50 border-2 border-transparent text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-xl">{app.emoji}</span>
                    <span className="text-sm font-medium">{app.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              {errors.map((err, i) => (
                <p key={i} className="text-sm text-red-600">{err}</p>
              ))}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition ${
                step === 0
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Назад
            </button>

            {step < totalSteps - 1 ? (
              <button
                onClick={() => canProceed() && setStep(s => s + 1)}
                disabled={!canProceed()}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition ${
                  canProceed()
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-200'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Далее
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isGenerating || !canProceed()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-200 transition disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Генерация...
                  </>
                ) : (
                  <>
                    Создать план
                    <Sparkles className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
