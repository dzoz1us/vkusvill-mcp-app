package com.vkusplan.domain;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "product_mappings",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_mapping_ingredient",
                columnNames = "ingredient_id"
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductMapping {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ingredient_id", nullable = false)
    private Ingredient ingredient;

    @Column(name = "product_xml_id", nullable = false, length = 100)
    private String productXmlId;

    @Column(name = "product_name", nullable = false, length = 300)
    private String productName;

    @Column(name = "product_url", length = 500)
    private String productUrl;

    @Column(name = "package_quantity")
    private Double packageQuantity;

    @Column(name = "package_unit", length = 20)
    private String packageUnit;

    @Column(name = "last_price")
    private Double lastPrice;

    @Column(name = "match_score", nullable = false)
    private Double matchScore;

    @Column(name = "match_status", nullable = false, length = 30)
    private String matchStatus;

    @Column(name = "last_checked_at", nullable = false)
    private Instant lastCheckedAt;
}