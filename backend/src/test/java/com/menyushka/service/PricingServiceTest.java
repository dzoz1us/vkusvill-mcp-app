package com.menyushka.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

class PricingServiceTest {

    private final PricingService service = new PricingService();

    @Nested
    @DisplayName("packagesNeeded")
    class PackagesNeeded {

        @Test
        void exactMultiple() {
            assertEquals(2, service.packagesNeeded(900, 450));
        }

        @Test
        void roundsUp() {
            assertEquals(2, service.packagesNeeded(700, 450));
        }

        @Test
        void singlePackage() {
            assertEquals(1, service.packagesNeeded(100, 500));
        }

        @Test
        void zeroNeeded() {
            assertEquals(0, service.packagesNeeded(0, 500));
        }

        @Test
        void zeroPackageRaises() {
            assertThrows(
                    IllegalArgumentException.class,
                    () -> service.packagesNeeded(100, 0)
            );
        }

        @Test
        void negativeNeededRaises() {
            assertThrows(
                    IllegalArgumentException.class,
                    () -> service.packagesNeeded(-1, 500)
            );
        }
    }

    @Nested
    @DisplayName("totalPrice")
    class TotalPrice {

        @Test
        void simple() {
            assertEquals(179.0, service.totalPrice(2, 89.5));
        }

        @Test
        void zeroPackages() {
            assertEquals(0.0, service.totalPrice(0, 89.5));
        }

        @Test
        void negativePackagesRaise() {
            assertThrows(
                    IllegalArgumentException.class,
                    () -> service.totalPrice(-1, 10)
            );
        }

        @Test
        void negativePriceRaises() {
            assertThrows(
                    IllegalArgumentException.class,
                    () -> service.totalPrice(1, -1)
            );
        }
    }

    @Nested
    @DisplayName("unitsCompatible")
    class UnitsCompatible {

        @Test
        void gAndG() {
            assertTrue(service.unitsCompatible("g", "g"));
        }

        @Test
        void gAndMl() {
            assertTrue(service.unitsCompatible("g", "ml"));
            assertTrue(service.unitsCompatible("ml", "g"));
        }

        @Test
        void mlAndMl() {
            assertTrue(service.unitsCompatible("ml", "ml"));
        }

        @Test
        void pcsAndPcs() {
            assertTrue(service.unitsCompatible("pcs", "pcs"));
        }

        @Test
        void pcsAndGIncompatible() {
            assertFalse(service.unitsCompatible("pcs", "g"));
            assertFalse(service.unitsCompatible("g", "pcs"));
        }
    }

    @Nested
    @DisplayName("packagesFor")
    class PackagesFor {

        @Test
        void simpleCase() {
            Integer packages = service.packagesFor(700.0, "g", 450.0, "g");
            assertEquals(2, packages);
        }

        @Test
        void gWithMlPackage() {
            Integer packages = service.packagesFor(800.0, "ml", 900.0, "g");
            assertEquals(1, packages);
        }

        @Test
        void nullPackageQuantity() {
            assertNull(service.packagesFor(500.0, "g", null, "g"));
        }

        @Test
        void nullPackageUnit() {
            assertNull(service.packagesFor(500.0, "g", 450.0, null));
        }

        @Test
        void incompatibleUnits() {
            assertNull(service.packagesFor(2.5, "pcs", 250.0, "g"));
        }
    }
}