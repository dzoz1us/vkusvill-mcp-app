package com.menyushka.domain;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "meal_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MealPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /** Владелец плана. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(length = 200)
    private String title;

    /** Сохранён ли план пользователем в «Мои планы». */
    @Column(nullable = false)
    @Builder.Default
    private Boolean saved = false;

    /** Сколько приёмов пищи не уместилось в бюджет. */
    @Column(name = "omitted_meals", nullable = false)
    @Builder.Default
    private Integer omittedMeals = 0;

    @Column(name = "people_count", nullable = false)
    private Integer peopleCount;

    /** Бюджет на неделю, ₽. Ноль означает «без ограничения». */
    @Column(nullable = false)
    private Double budget;

    @Column(name = "days_json", nullable = false, columnDefinition = "TEXT")
    private String daysJson;

    @Column(name = "preferences_json", nullable = false, columnDefinition = "TEXT")
    private String preferencesJson;

    @Column(name = "appliances_json", nullable = false, columnDefinition = "TEXT")
    private String appliancesJson;

    @Column(nullable = false, length = 30)
    private String diet;

    @Column(name = "cart_estimated_cost", nullable = false)
    private Double cartEstimatedCost;

    @Column(name = "unresolved_items_count", nullable = false)
    private Integer unresolvedItemsCount;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "random_seed")
    private Integer randomSeed;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @OneToMany(
            mappedBy = "mealPlan",
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    @Builder.Default
    private List<MealPlanMeal> meals = new ArrayList<>();
}