package com.menyushka.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.menyushka.enums.Unit;
import com.menyushka.service.dto.AggregatedIngredient;
import com.menyushka.service.dto.RecipeIngredientInput;
import com.menyushka.service.dto.RecipeInput;

class GroceryServiceTest {

    private final GroceryService service = new GroceryService(new QuantityService());

    private static RecipeIngredientInput ing(
            int id, String name, double qty, String unit
    ) {
        return new RecipeIngredientInput(id, name, qty, unit);
    }

    @Test
    void twoRecipesSharedIngredients() {
        // Recipe A: tomato 200g + chicken 300g
        // Recipe B: tomato 300g + chicken 200g
        // Both for 2 servings, user has 2 people.
        // Expected: tomato 500g, chicken 500g.
        RecipeInput recipeA = new RecipeInput(
                1, 2,
                List.of(ing(1, "Помидор", 200, "g"), ing(2, "Курица", 300, "g"))
        );
        RecipeInput recipeB = new RecipeInput(
                2, 2,
                List.of(ing(1, "Помидор", 300, "g"), ing(2, "Курица", 200, "g"))
        );

        List<AggregatedIngredient> result = service.aggregateIngredients(
                List.of(recipeA, recipeB), 2
        );

        assertEquals(2, result.size());

        AggregatedIngredient tomato = result.get(0);
        assertEquals(1, tomato.ingredientId());
        assertEquals(500.0, tomato.neededQuantity());
        assertEquals(Unit.G, tomato.unit());

        AggregatedIngredient chicken = result.get(1);
        assertEquals(2, chicken.ingredientId());
        assertEquals(500.0, chicken.neededQuantity());
        assertEquals(Unit.G, chicken.unit());
    }

    @Test
    void scalesBeforeSumming() {
        // Both recipes for 2 servings, user has 4 people -> all doubled.
        RecipeInput recipeA = new RecipeInput(
                1, 2, List.of(ing(1, "Помидор", 200, "g"))
        );
        RecipeInput recipeB = new RecipeInput(
                2, 2, List.of(ing(1, "Помидор", 300, "g"))
        );

        List<AggregatedIngredient> result = service.aggregateIngredients(
                List.of(recipeA, recipeB), 4
        );

        // (200 + 300) * 2 = 1000
        assertEquals(1, result.size());
        assertEquals(1000.0, result.get(0).neededQuantity());
    }

    @Test
    void mixedUnits() {
        // 1 kg from one recipe + 300 g from another = 1300 g total.
        RecipeInput recipeA = new RecipeInput(
                1, 2, List.of(ing(1, "Курица", 1, "kg"))
        );
        RecipeInput recipeB = new RecipeInput(
                2, 2, List.of(ing(1, "Курица", 300, "g"))
        );

        List<AggregatedIngredient> result = service.aggregateIngredients(
                List.of(recipeA, recipeB), 2
        );

        assertEquals(1, result.size());
        assertEquals(1300.0, result.get(0).neededQuantity());
        assertEquals(Unit.G, result.get(0).unit());
    }

    @Test
    void stableOrder() {
        // Ingredients keep first-seen order.
        RecipeInput recipe = new RecipeInput(
                1, 2,
                List.of(
                        ing(5, "A", 10, "g"),
                        ing(3, "B", 20, "g"),
                        ing(9, "C", 30, "g")
                )
        );

        List<AggregatedIngredient> result = service.aggregateIngredients(
                List.of(recipe), 2
        );

        assertEquals(3, result.size());
        assertEquals(5, result.get(0).ingredientId());
        assertEquals(3, result.get(1).ingredientId());
        assertEquals(9, result.get(2).ingredientId());
    }

    @Test
    void noDuplicatesPerIngredient() {
        // Same ingredient across 3 recipes -> single aggregated row.
        RecipeInput recipeA = new RecipeInput(1, 2, List.of(ing(1, "X", 100, "g")));
        RecipeInput recipeB = new RecipeInput(2, 2, List.of(ing(1, "X", 100, "g")));
        RecipeInput recipeC = new RecipeInput(3, 2, List.of(ing(1, "X", 100, "g")));

        List<AggregatedIngredient> result = service.aggregateIngredients(
                List.of(recipeA, recipeB, recipeC), 2
        );

        assertEquals(1, result.size());
        assertEquals(300.0, result.get(0).neededQuantity());
    }

    @Test
    void peopleCountMustBePositive() {
        assertThrows(
                IllegalArgumentException.class,
                () -> service.aggregateIngredients(List.of(), 0)
        );
    }

    @Test
    void mixedUnitsForSameIngredientRaises() {
        // Same ingredientId but g in one recipe and ml in the other.
        RecipeInput recipeA = new RecipeInput(1, 2, List.of(ing(1, "X", 100, "g")));
        RecipeInput recipeB = new RecipeInput(2, 2, List.of(ing(1, "X", 100, "ml")));

        assertThrows(
                IllegalArgumentException.class,
                () -> service.aggregateIngredients(List.of(recipeA, recipeB), 2)
        );
    }
}