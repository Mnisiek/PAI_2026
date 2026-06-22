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

/**
 * Variant-specific images for an offer (e.g. the blue photos). The product's
 * main photo is a single column on {@code product} ({@code main_image_url}).
 */
@Entity
@Table(name = "offer_image")
public class OfferImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "offer_id", nullable = false)
    private Offer offer;

    @Column(nullable = false, length = 1024)
    private String url;

    @Column(length = 255)
    private String alt;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder = 0;

    protected OfferImage() {
    }

    public Long getId() {
        return id;
    }

    public Offer getOffer() {
        return offer;
    }

    public String getUrl() {
        return url;
    }

    public String getAlt() {
        return alt;
    }

    public int getSortOrder() {
        return sortOrder;
    }
}
