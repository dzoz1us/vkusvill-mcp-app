import { DISHES } from "./dishes";
import { Plate } from "./primitives";

/**
 * Точное соответствие «название рецепта → рисунок блюда».
 * Никакого подбора по ключевым словам: неизвестный рецепт получает пустую тарелку.
 */
const DISH_BY_RECIPE: Record<string, string> = {
  "Овсянка с ягодами и мёдом": "oatmeal-berries",
  "Сырники со сметаной": "syrniki",
  "Омлет с овощами": "omelette",
  "Творожная запеканка": "cottage-casserole",
  "Гречка с молоком": "buckwheat",
  "Банановый смузи с овсянкой": "banana-smoothie",
  "Смузи-боул с ягодами": "smoothie-bowl",
  "Овсянка в микроволновке": "oatmeal-plain",
  "Яичница с помидорами": "eggs-tomatoes",
  "Овсянка на воде с ягодами": "oatmeal-berries",
  "Запечённые яблоки с мёдом": "baked-apples",
  "Овсяный пирог с ягодами": "oat-pie",
  "Омлет в кружке": "omelette",
  "Овсянка на воде в микроволновке": "oatmeal-plain",
  "Ягодный смузи": "berry-smoothie",
  "Зелёный смузи": "green-smoothie",
  "Рисовая каша с яблоками": "rice-apple-porridge",
  "Молочная овсяная каша в мультиварке": "oatmeal-plain",
  "Сырники в аэрогриле": "syrniki",
  "Тосты с сыром и помидорами": "cheese-tomato-toast",
  "Курица с рисом и овощами": "chicken-rice-veg",
  "Паста болоньезе": "bolognese",
  "Плов с курицей": "plov",
  "Греческий салат с курицей": "greek-salad",
  "Борщ с говядиной": "borscht",
  "Ризотто с грибами": "mushroom-risotto",
  "Куриная грудка с гречкой": "chicken-buckwheat",
  "Запечённый лосось с брокколи": "salmon-broccoli",
  "Котлеты с пюре": "cutlets-puree",
  "Рыбные котлеты с рисом": "fish-cutlets-rice",
  "Тушёная капуста с курицей": "stewed-cabbage",
  "Паста карбонара": "carbonara",
  "Куриный суп с лапшой": "chicken-noodle-soup",
  "Стейк из индейки с салатом": "turkey-steak-salad",
  "Овощное рагу": "vegetable-stew",
  "Салат Цезарь с курицей": "caesar",
  "Томатный суп с базиликом": "tomato-basil-soup",
  "Рис с овощами": "rice-veg",
  "Щи из свежей капусты": "shchi",
  "Грибной суп с картофелем": "mushroom-soup",
  "Крем-суп из брокколи": "broccoli-soup",
  "Томатный крем-суп": "tomato-cream-soup",
  "Запечённая курица с картофелем": "roast-chicken-potato",
  "Рыба запечённая с овощами": "baked-fish-veg",
  "Овощи гриль": "grilled-veg",
  "Суп овощной с рисом": "veg-rice-soup",
  "Рис с овощами в микроволновке": "rice-veg",
  "Плов в мультиварке": "plov",
  "Гречка с курицей в мультиварке": "chicken-buckwheat",
  "Курица с картофелем в аэрогриле": "roast-chicken-potato",
  "Овощи с рисом в аэрогриле": "rice-veg",
  "Жареная картошка с грибами": "fried-potato-mushroom",
  "Курица-гриль с овощами": "grilled-chicken-veg",
  "Тефтели в томатном соусе": "meatballs-tomato",
  "Гречка с грибами": "buckwheat-mushroom",
  "Курица с брокколи запечённая": "baked-chicken-broccoli",
  "Картофель по-деревенски": "country-potatoes",
  "Рыба в фольге с овощами": "fish-foil",
  "Тушёная курица с овощами в мультиварке": "stewed-chicken-veg",
  "Картофель в аэрогриле": "country-potatoes",
  "Куриные ножки в аэрогриле": "chicken-legs",
  "Овощи на пару в микроволновке": "steamed-veg",
  "Салат из огурцов и помидоров": "cucumber-tomato-salad",
  "Салат с курицей и яблоком": "chicken-apple-salad",
};

export const hasDishArt = (recipeName: string) => recipeName in DISH_BY_RECIPE;

interface DishArtProps {
  /** Название рецепта: по нему выбирается рисунок. */
  recipeName: string;
  className?: string;
}

export default function DishArt({ recipeName, className = "" }: DishArtProps) {
  const dish = DISHES[DISH_BY_RECIPE[recipeName]];

  return (
    <svg
      viewBox="0 0 120 120"
      role="img"
      aria-label={recipeName}
      className={`block overflow-hidden ${className}`}
      style={{ background: dish?.bg ?? "#f6efe2" }}
    >
      <g transform="translate(60 61) scale(1.1) translate(-60 -60)">{dish ? dish.art : <Plate />}</g>
    </svg>
  );
}
