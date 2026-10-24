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
@Table(name = "order_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private PurchaseOrder order;

    @Column(name = "product_xml_id", nullable = false, length = 100)
    private String productXmlId;

    @Column(name = "product_name", nullable = false, length = 300)
    private String productName;

    @Column(name = "product_url", length = 500)
    private String productUrl;

    @Column(name = "package_count", nullable = false)
    private Integer packageCount;

    /** Количество для корзины ВкусВилл: штуки или килограммы. */
    @Column(name = "cart_quantity", nullable = false)
    private Double cartQuantity;

    @Column(name = "sold_by_weight", nullable = false)
    @Builder.Default
    private Boolean soldByWeight = false;

    @Column(name = "price_per_package")
    private Double pricePerPackage;

    @Column(name = "total_price")
    private Double totalPrice;
}
