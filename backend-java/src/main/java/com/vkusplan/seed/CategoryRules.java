package com.vkusplan.seed;

import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Начальные категории и правила их назначения рецептам при первом заполнении базы.
 * Дальше категории рецептов редактирует администратор.
 */
public final class CategoryRules {

    private CategoryRules() {}

    public static final String BREAKFAST = "Завтраки";
    public static final String SOUPS = "Супы";
    public static final String SALADS = "Салаты";
    public static final String MEAT = "Мясо и птица";
    public static final String FISH = "Рыба";
    public static final String SIDES = "Каши, паста и гарниры";
    public static final String VEGETABLES = "Овощные блюда";
    public static final String DRINKS = "Смузи и напитки";
    public static final String SWEETS = "Выпечка и десерты";

    /** Название категории → slug, в порядке показа. */
    public static final Map<String, String> CATEGORIES = new LinkedHashMap<>();

    static {
        CATEGORIES.put(BREAKFAST, "breakfast");
        CATEGORIES.put(SOUPS, "soups");
        CATEGORIES.put(SALADS, "salads");
        CATEGORIES.put(MEAT, "meat");
        CATEGORIES.put(FISH, "fish");
        CATEGORIES.put(SIDES, "sides");
        CATEGORIES.put(VEGETABLES, "vegetables");
        CATEGORIES.put(DRINKS, "drinks");
        CATEGORIES.put(SWEETS, "sweets");
    }

    public static Set<String> forRecipe(String name, String mealType) {
        String n = name.toLowerCase();
        Set<String> result = new LinkedHashSet<>();

        if (n.contains("смузи")) {
            result.add(DRINKS);
        }
        if (n.contains("суп") || n.contains("борщ") || n.startsWith("щи")) {
            result.add(SOUPS);
        }
        if (n.contains("салат")) {
            result.add(SALADS);
        }
        if (containsAny(n, List.of("лосос", "рыб", "форел"))) {
            result.add(FISH);
        }
        if (containsAny(n, List.of("кур", "индейк", "тефтел", "котлет", "говяд", "стейк"))
                && !result.contains(SOUPS) && !result.contains(SALADS)) {
            result.add(MEAT);
        }
        if (containsAny(n, List.of("каша", "овсянк", "гречк", "рис", "плов", "паста", "ризотто"))
                && !result.contains(SOUPS) && !result.contains(SALADS)) {
            result.add(SIDES);
        }
        if (containsAny(n, List.of("овощ", "рагу", "картоф", "капуст", "картошк"))
                && !result.contains(SOUPS) && !result.contains(SALADS)) {
            result.add(VEGETABLES);
        }
        if (containsAny(n, List.of("пирог", "запечённые яблоки", "запеканк", "сырник"))) {
            result.add(SWEETS);
        }
        if ("breakfast".equals(mealType) && !result.contains(DRINKS)) {
            result.add(BREAKFAST);
        }
        if (result.isEmpty()) {
            result.add(VEGETABLES);
        }
        return result;
    }

    private static boolean containsAny(String text, List<String> parts) {
        for (String p : parts) {
            if (text.contains(p)) {
                return true;
            }
        }
        return false;
    }
}
