package com.vkusplan.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "ingredients",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_ingredients_normalized_name",
                columnNames = "normalized_name"
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ingredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(name = "normalized_name", nullable = false, length = 200)
    private String normalizedName;

    @Column(name = "default_unit", nullable = false, length = 20)
    private String defaultUnit;

    @Column(length = 100)
    private String category;
}