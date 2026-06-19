package com.pai2026.backend.offers.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "attribute")
public class Attribute {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    @Column(name = "data_type", nullable = false)
    private String dataType; // TEXT, NUMBER, BOOL

    private String unit;

    @Column(name = "is_variant_axis", nullable = false)
    private boolean isVariantAxis = false;

    public Attribute() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDataType() {
        return dataType;
    }

    public void setDataType(String dataType) {
        this.dataType = dataType;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public boolean isVariantAxis() {
        return isVariantAxis;
    }

    public void setVariantAxis(boolean variantAxis) {
        isVariantAxis = variantAxis;
    }
}
