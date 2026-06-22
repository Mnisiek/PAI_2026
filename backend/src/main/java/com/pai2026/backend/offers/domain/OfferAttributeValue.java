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
import java.math.BigDecimal;

/**
 * The "bag": an offer's value for a declared param. Exactly one of the typed
 * value columns is populated, per the attribute's data type. Filter facets are
 * derived from whatever values exist here — there is no controlled vocabulary.
 */
@Entity
@Table(name = "offer_attribute_value",
        uniqueConstraints = @UniqueConstraint(columnNames = {"offer_id", "attribute_id"}))
public class OfferAttributeValue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "offer_id", nullable = false)
    private Offer offer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "attribute_id", nullable = false)
    private Attribute attribute;

    @Column(name = "text_value", length = 512)
    private String textValue;

    @Column(name = "num_value", precision = 18, scale = 4)
    private BigDecimal numValue;

    @Column(name = "bool_value")
    private Boolean boolValue;

    protected OfferAttributeValue() {
    }

    public Long getId() {
        return id;
    }

    public Offer getOffer() {
        return offer;
    }

    public Attribute getAttribute() {
        return attribute;
    }

    public String getTextValue() {
        return textValue;
    }

    public BigDecimal getNumValue() {
        return numValue;
    }

    public Boolean getBoolValue() {
        return boolValue;
    }
}
