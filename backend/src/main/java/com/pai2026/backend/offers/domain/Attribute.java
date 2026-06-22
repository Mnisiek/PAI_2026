package com.pai2026.backend.offers.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** The param dictionary entry (e.g. {@code color}, {@code storage}, {@code screen_size}). */
@Entity
@Table(name = "attribute")
public class Attribute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String code;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "data_type", nullable = false, length = 16)
    private AttributeDataType dataType;

    @Column(length = 32)
    private String unit;

    /** Whether this param defines a variant axis (size/color) vs a plain spec. */
    @Column(name = "is_variant_axis", nullable = false)
    private boolean variantAxis = false;

    protected Attribute() {
    }

    public Long getId() {
        return id;
    }

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public AttributeDataType getDataType() {
        return dataType;
    }

    public String getUnit() {
        return unit;
    }

    public boolean isVariantAxis() {
        return variantAxis;
    }
}
