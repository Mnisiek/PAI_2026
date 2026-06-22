package com.pai2026.backend.offers.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * The "allowed params for a leaf category" list + filter config. No inheritance:
 * each leaf declares its full param set explicitly.
 */
@Entity
@Table(name = "category_attribute",
        uniqueConstraints = @UniqueConstraint(columnNames = {"category_id", "attribute_id"}))
public class CategoryAttribute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attribute_id", nullable = false)
    private Attribute attribute;

    @Column(nullable = false)
    private boolean filterable = true;

    @Column(nullable = false)
    private boolean required = false;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    protected CategoryAttribute() {
    }

    public Long getId() {
        return id;
    }

    public Category getCategory() {
        return category;
    }

    public Attribute getAttribute() {
        return attribute;
    }

    public boolean isFilterable() {
        return filterable;
    }

    public boolean isRequired() {
        return required;
    }

    public int getSortOrder() {
        return sortOrder;
    }
}
