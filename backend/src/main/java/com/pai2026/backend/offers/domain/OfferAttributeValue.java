package com.pai2026.backend.offers.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "offer_attribute_value")
public class OfferAttributeValue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "offer_id")
    private Offer offer;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "attribute_id")
    private Attribute attribute;

    @Column(name = "text_value")
    private String textValue;

    @Column(name = "num_value", precision = 18, scale = 4)
    private BigDecimal numValue;

    @Column(name = "bool_value")
    private Boolean boolValue;

    public OfferAttributeValue() {}

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Offer getOffer() {
        return offer;
    }

    public void setOffer(Offer offer) {
        this.offer = offer;
    }

    public Attribute getAttribute() {
        return attribute;
    }

    public void setAttribute(Attribute attribute) {
        this.attribute = attribute;
    }

    public String getTextValue() {
        return textValue;
    }

    public void setTextValue(String textValue) {
        this.textValue = textValue;
    }

    public BigDecimal getNumValue() {
        return numValue;
    }

    public void setNumValue(BigDecimal numValue) {
        this.numValue = numValue;
    }

    public Boolean getBoolValue() {
        return boolValue;
    }

    public void setBoolValue(Boolean boolValue) {
        this.boolValue = boolValue;
    }
}
