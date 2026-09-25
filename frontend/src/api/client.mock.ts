import type {
  GenerateRequest,
  MealPlan,
  Recipe,
  GroceryList,
  CartResponse,
  ReplaceMealResponse,
  GroceryItem,
  DayMeal,
  Ingredient,
} from '../types';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data generators
const recipeNames = {
  breakfast: [
    'Овсянка с ягодами и мёдом',
    'Сырники со сметаной',
    'Омлет с овощами',
    'Гранола с йогуртом',
    'Творожная запеканка',
    'Бутерброды с авокадо',
    'Каша рисовая с тыквой',
  ],
  lunch: [
    'Куриный суп с лапшой',
    'Паста болоньезе',
    'Греческий салат с курицей',
    'Борщ с говядиной',
    'Ризотто с грибами',
    'Том ям с креветками',
    'Куриная грудка с киноа',
  ],
  dinner: [
    'Запечённый лосось с овощами',
    'Котлеты с пюре',
    'Стейк из индейки с салатом',
    'Плов с курицей',
    'Рыбные котлеты с рисом',
    'Тушёная капуста с сосисками',
    'Паста карбонара',
  ],
};

const allIngredients: Ingredient[] = [
  { id: '1', name: 'Куриная грудка', quantity: 500, unit: 'г' },
  { id: '2', name: 'Рис', quantity: 200, unit: 'г' },
  { id: '3', name: 'Лук репчатый', quantity: 2, unit: 'шт' },
  { id: '4', name: 'Морковь', quantity: 1, unit: 'шт' },
  { id: '5', name: 'Масло растительное', quantity: 30, unit: 'мл' },
  { id: '6', name: 'Соль', quantity: 5, unit: 'г' },
  { id: '7', name: 'Перец чёрный', quantity: 2, unit: 'г' },
  { id: '8', name: 'Овсяные хлопья', quantity: 100, unit: 'г' },
  { id: '9', name: 'Молоко', quantity: 200, unit: 'мл' },
  { id: '10', name: 'Ягоды замороженные', quantity: 150, unit: 'г' },
  { id: '11', name: 'Мёд', quantity: 20, unit: 'г' },
  { id: '12', name: 'Творог', quantity: 300, unit: 'г' },
  { id: '13', name: 'Яйца', quantity: 3, unit: 'шт' },
  { id: '14', name: 'Мука', quantity: 50, unit: 'г' },
  { id: '15', name: 'Сметана', quantity: 100, unit: 'г' },
  { id: '16', name: 'Лосось филе', quantity: 400, unit: 'г' },
  { id: '17', name: 'Брокколи', quantity: 200, unit: 'г' },
  { id: '18', name: 'Лимон', quantity: 1, unit: 'шт' },
  { id: '19', name: 'Чеснок', quantity: 3, unit: 'зубч' },
  { id: '20', name: 'Паста спагетти', quantity: 250, unit: 'г' },
  { id: '21', name: 'Говяжий фарш', quantity: 400, unit: 'г' },
  { id: '22', name: 'Томаты в с/с', quantity: 400, unit: 'г' },
  { id: '23', name: 'Пармезан', quantity: 50, unit: 'г' },
  { id: '24', name: 'Базилик свежий', quantity: 10, unit: 'г' },
];

function generateRecipe(mealType: 'breakfast' | 'lunch' | 'dinner', index: number): Recipe {
  const names = recipeNames[mealType];
  const name = names[index % names.length];
  const ingredientCount = 4 + Math.floor(Math.random() * 5);
  const startIdx = Math.floor(Math.random() * (allIngredients.length - ingredientCount));
  const ingredients = allIngredients.slice(startIdx, startIdx + ingredientCount);

  return {
    id: `recipe-${mealType}-${index}-${Date.now()}`,
    name,
    image_url: `https://images.unsplash.com/photo-${
      mealType === 'breakfast' ? '1533089862915-7c2d72638f1c' :
      mealType === 'lunch' ? '1546069901-ba9599a7e63c' :
      '1467003909585-2f8072700fe2'
    }?w=400&h=300&fit=crop`,
    cook_time_minutes: mealType === 'breakfast' ? 15 + Math.floor(Math.random() * 15) : 30 + Math.floor(Math.random() * 40),
    servings: 2 + Math.floor(Math.random() * 3),
    nutrition: {
      calories: mealType === 'breakfast' ? 300 + Math.floor(Math.random() * 200) : 400 + Math.floor(Math.random() * 300),
      protein: 15 + Math.floor(Math.random() * 25),
      fat: 10 + Math.floor(Math.random() * 20),
      carbs: 30 + Math.floor(Math.random() * 40),
    },
    diet: 'none',
    appliances: ['stove'],
    ingredients,
    steps: [
      'Подготовить все ингредиенты, промыть и нарезать.',
      'Разогреть сковороду/духовку до нужной температуры.',
      'Обжарить основные ингредиенты до золотистой корочки.',
      'Добавить специи и соус, перемешать.',
      'Готовить до полной готовности, подавать горячим.',
    ],
  };
}

function generateMealPlan(request: GenerateRequest): MealPlan {
  const meals: DayMeal[] = [];
  const mealTypes: ('breakfast' | 'lunch' | 'dinner')[] = ['breakfast', 'lunch', 'dinner'];
  let mealIndex = 0;

  request.days.forEach(day => {
    mealTypes.forEach(mealType => {
      meals.push({
        id: `meal-${day}-${mealType}-${Date.now()}`,
        day,
        meal_type: mealType,
        recipe: generateRecipe(mealType, mealIndex++),
      });
    });
  });

  const baseCost = meals.length * 250 + Math.floor(Math.random() * 500);
  const cost = Math.min(baseCost, request.budget * 0.95);

  return {
    id: `plan-${Date.now()}`,
    created_at: new Date().toISOString(),
    params: request,
    meals,
    cart_estimated_cost: Math.round(cost),
    budget: request.budget,
    unresolved_items_count: Math.floor(Math.random() * 4),
    status: 'ready',
  };
}

function generateGroceryList(plan: MealPlan): GroceryList {
  const allIngredientsMap = new Map<string, { name: string; quantity: number; unit: string }>();

  plan.meals.forEach(meal => {
  // Mock stores full Recipe objects even though the type says RecipeShort.
    const fullRecipe = meal.recipe as Recipe;
    fullRecipe.ingredients.forEach((ing: Ingredient) => {
      const existing = allIngredientsMap.get(ing.name);
      if (existing) {
        existing.quantity += ing.quantity;
      } else {
        allIngredientsMap.set(ing.name, { name: ing.name, quantity: ing.quantity, unit: ing.unit });
      }
    });
  });

  const statuses: ('matched' | 'requires_review' | 'not_found')[] = ['matched', 'matched', 'matched', 'requires_review', 'not_found'];
  let totalCost = 0;
  let matchedCount = 0;
  let reviewCount = 0;
  let notFoundCount = 0;

  const items: GroceryItem[] = Array.from(allIngredientsMap.values()).map((ing, i) => {
    const packageQty = ing.unit === 'г' ? 500 : ing.unit === 'мл' ? 1000 : ing.unit === 'шт' ? 1 : 1;
    const packageCount = Math.ceil(ing.quantity / packageQty);
    const pricePerPackage = ing.unit === 'г' ? 89 + Math.floor(Math.random() * 100) :
                           ing.unit === 'мл' ? 59 + Math.floor(Math.random() * 60) :
                           29 + Math.floor(Math.random() * 150);
    const itemPrice = pricePerPackage * packageCount;
    totalCost += itemPrice;

    const status = i < allIngredientsMap.size * 0.7 ? 'matched' :
                   i < allIngredientsMap.size * 0.9 ? 'requires_review' : 'not_found';
    
    if (status === 'matched') matchedCount++;
    else if (status === 'requires_review') reviewCount++;
    else notFoundCount++;

    return {
      id: `grocery-${i}`,
      product_name: ing.name,
      needed_quantity: ing.quantity,
      needed_unit: ing.unit,
      package_quantity: packageQty,
      package_count: packageCount,
      price_per_package: pricePerPackage,
      match_status: status,
      is_bought: false,
      ingredient_id: `ing-${i}`,
    };
  });

  return {
    items,
    total_cost: Math.round(totalCost),
    matched_count: matchedCount,
    review_count: reviewCount,
    not_found_count: notFoundCount,
  };
}

// API Client
export const api = {
  async generateMealPlan(request: GenerateRequest): Promise<MealPlan> {
    await delay(2500); // Simulate generation time
    return generateMealPlan(request);
  },

  async getMealPlan(id: string): Promise<MealPlan> {
    await delay(500);
    // Return a stored plan from localStorage or generate mock
    const stored = localStorage.getItem(`meal-plan-${id}`);
    if (stored) return JSON.parse(stored);
    
    // Generate a default plan for demo
    return generateMealPlan({
      people_count: 2,
      days: ['mon', 'tue', 'wed', 'thu', 'fri'],
      budget: 5000,
      preferences: ['healthy', 'family'],
      diet: 'none',
      appliances: ['stove', 'oven'],
    });
  },

  async getRecipe(id: string): Promise<Recipe> {
    await delay(400);
    return generateRecipe(
      ['breakfast', 'lunch', 'dinner'][Math.floor(Math.random() * 3)] as 'breakfast' | 'lunch' | 'dinner',
      parseInt(id.split('-').pop() || '0')
    );
  },

  async replaceMeal(planId: string, dayMealId: string): Promise<ReplaceMealResponse> {
    await delay(1800);
    const mealTypes: ('breakfast' | 'lunch' | 'dinner')[] = ['breakfast', 'lunch', 'dinner'];
    const newRecipe = generateRecipe(mealTypes[Math.floor(Math.random() * 3)], Math.floor(Math.random() * 10));
    
    const stored = localStorage.getItem(`meal-plan-${planId}`);
    let plan: MealPlan;
    if (stored) {
      plan = JSON.parse(stored);
    } else {
      plan = generateMealPlan({
        people_count: 2,
        days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        budget: 5000,
        preferences: ['healthy'],
        diet: 'none',
        appliances: ['stove'],
      });
    }
    
    const mealIdx = plan.meals.findIndex(m => m.id === dayMealId);
    if (mealIdx >= 0) {
      plan.meals[mealIdx].recipe = newRecipe;
    }
    
    localStorage.setItem(`meal-plan-${planId}`, JSON.stringify(plan));
    
    return { plan, replaced_recipe: newRecipe };
  },

  async getGroceryList(planId: string): Promise<GroceryList> {
    await delay(800);
    const stored = localStorage.getItem(`meal-plan-${planId}`);
    let plan: MealPlan;
    if (stored) {
      plan = JSON.parse(stored);
    } else {
      plan = generateMealPlan({
        people_count: 2,
        days: ['mon', 'tue', 'wed'],
        budget: 3000,
        preferences: ['healthy'],
        diet: 'none',
        appliances: ['stove'],
      });
    }
    return generateGroceryList(plan);
  },

  async updateGroceryItem(itemId: string, isBought: boolean): Promise<{ success: boolean }> {
    await delay(300);
    return { success: true };
  },

  async createVkusvillCart(planId: string): Promise<CartResponse> {
    await delay(1500);
    const itemCount = 15 + Math.floor(Math.random() * 20);
    const carts = [];
    
    if (itemCount <= 20) {
      carts.push({
        cart_url: `https://vkusvill.ru/cart?plan=${planId}&items=${itemCount}`,
        items_count: itemCount,
      });
    } else {
      // Split into multiple carts
      let remaining = itemCount;
      let cartNum = 1;
      while (remaining > 0) {
        const count = Math.min(remaining, 20);
        carts.push({
          cart_url: `https://vkusvill.ru/cart?plan=${planId}&cart=${cartNum}&items=${count}`,
          items_count: count,
        });
        remaining -= count;
        cartNum++;
      }
    }

    return {
      carts,
      price_changed: Math.random() > 0.7,
      unresolved_items: Math.floor(Math.random() * 3),
    };
  },

  async refreshPrices(planId: string): Promise<{ cost_changed: boolean; new_cost: number }> {
    await delay(1000);
    return {
      cost_changed: Math.random() > 0.6,
      new_cost: 3000 + Math.floor(Math.random() * 2000),
    };
  },
};
