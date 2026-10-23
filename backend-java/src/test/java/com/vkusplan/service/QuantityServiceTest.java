package com.vkusplan.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.vkusplan.enums.Unit;

class QuantityServiceTest {

    private final QuantityService service = new QuantityService();

    @Nested
    @DisplayName("toCanonical")
    class ToCanonical {

        @Test
        void gramsStayGrams() {
            CanonicalQuantity q = service.toCanonical(300, "g");
            assertEquals(300.0, q.value());
            assertEquals(Unit.G, q.unit());
        }

        @Test
        void kilogramsToGrams() {
            CanonicalQuantity q = service.toCanonical(1, "kg");
            assertEquals(1000.0, q.value());
            assertEquals(Unit.G, q.unit());
        }

        @Test
        void halfKilogram() {
            CanonicalQuantity q = service.toCanonical(0.5, "kg");
            assertEquals(500.0, q.value());
        }

        @Test
        void litersToMilliliters() {
            CanonicalQuantity q = service.toCanonical(0.5, "l");
            assertEquals(500.0, q.value());
            assertEquals(Unit.ML, q.unit());
        }

        @Test
        void piecesStayPieces() {
            CanonicalQuantity q = service.toCanonical(3, "pcs");
            assertEquals(3.0, q.value());
            assertEquals(Unit.PCS, q.unit());
        }

        @Test
        void russianAliases() {
            assertEquals(1000.0, service.toCanonical(1, "кг").value());
            assertEquals(500.0, service.toCanonical(500, "мл").value());
            assertEquals(2.0, service.toCanonical(2, "шт").value());
        }

        @Test
        void caseInsensitive() {
            assertEquals(1000.0, service.toCanonical(1, "KG").value());
        }

        @Test
        void unknownUnitRaises() {
            assertThrows(UnknownUnitException.class, () -> service.toCanonical(1, "buckets"));
        }

        @Test
        void negativeQuantityRaises() {
            assertThrows(IllegalArgumentException.class, () -> service.toCanonical(-1, "g"));
        }
    }

    @Nested
    @DisplayName("CanonicalQuantity.add")
    class AddCanonical {

        @Test
        void sameUnit() {
            CanonicalQuantity a = service.toCanonical(1000, "g");
            CanonicalQuantity b = service.toCanonical(300, "g");
            CanonicalQuantity sum = a.add(b);
            assertEquals(1300.0, sum.value());
            assertEquals(Unit.G, sum.unit());
        }

        @Test
        void oneKilogramPlusThreeHundredGrams() {
            CanonicalQuantity a = service.toCanonical(1, "kg");
            CanonicalQuantity b = service.toCanonical(300, "g");
            assertEquals(1300.0, a.add(b).value());
        }

        @Test
        void mismatchedUnitsRaises() {
            CanonicalQuantity a = service.toCanonical(100, "g");
            CanonicalQuantity b = service.toCanonical(100, "ml");
            assertThrows(IllegalArgumentException.class, () -> a.add(b));
        }
    }

    @Nested
    @DisplayName("scaleQuantity")
    class ScaleQuantity {

        @Test
        void fromTwoToFourDoubles() {
            CanonicalQuantity q = service.scaleQuantity(200, 2, 4, "g");
            assertEquals(400.0, q.value());
            assertEquals(Unit.G, q.unit());
        }

        @Test
        void fromThreeToTwo() {
            CanonicalQuantity q = service.scaleQuantity(300, 3, 2, "g");
            assertEquals(200.0, q.value());
        }

        @Test
        void kilogramsAreScaledAsGrams() {
            CanonicalQuantity q = service.scaleQuantity(1, 2, 4, "kg");
            assertEquals(2000.0, q.value());
            assertEquals(Unit.G, q.unit());
        }

        @Test
        void invalidBaseServings() {
            assertThrows(
                    IllegalArgumentException.class,
                    () -> service.scaleQuantity(100, 0, 2, "g")
            );
        }

        @Test
        void invalidPeopleCount() {
            assertThrows(
                    IllegalArgumentException.class,
                    () -> service.scaleQuantity(100, 2, 0, "g")
            );
        }
    }
}