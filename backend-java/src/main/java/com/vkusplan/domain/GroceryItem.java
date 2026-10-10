package com.vkusplan.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "grocery_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroceryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "meal_plan_id", nullable = false)
    private MealPlan mealPlan;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ingredient_id")
    private Ingredient ingredient;

    @Column(name = "product_name", nullable = false, length = 200)
    private String productName;

    @Column(name = "needed_quantity", nullable = false)
    private Double neededQuantity;

    @Column(name = "needed_unit", nullable = false, length = 20)
    private String neededUnit;

    @Column(name = "product_xml_id", length = 100)
    private String productXmlId;

    @Column(name = "product_url", length = 500)
    private String productUrl;

    @Column(name = "package_quantity")
    private Double packageQuantity;

    @Column(name = "package_unit", length = 20)
    private String packageUnit;

    @Column(name = "package_count")
    private Integer packageCount;

    @Column(name = "price_per_package")
    private Double pricePerPackage;

    @Column(name = "total_price")
    private Double totalPrice;

    @Column(name = "match_status", nullable = false, length = 30)
    private String matchStatus;

    @Column(name = "is_bought", nullable = false)
    private Boolean isBought;

    @Column(name = "is_manual", nullable = false)
    private Boolean isManual;
}