package com.pai2026.backend.offers.api;

import com.pai2026.backend.offers.api.dto.*;
import com.pai2026.backend.offers.domain.*;
import com.pai2026.backend.offers.service.OffersService;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.BatchMapping;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.stereotype.Controller;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Controller
public class OffersController {

    private final OffersService offersService;

    public OffersController(OffersService offersService) {
        this.offersService = offersService;
    }

    /** Resolves the {@code Query.offersModule} namespace field. */
    @QueryMapping
    public OffersModuleQuery offersModule() {
        return new OffersModuleQuery();
    }

    @MutationMapping
    public Category addCategory(@Argument AddCategoryInput input) {
        return offersService.addCategory(input);
    }

    @MutationMapping
    public Product addProduct(@Argument AddProductInput input) {
        return offersService.addProduct(input);
    }

    @MutationMapping
    public Offer addOffer(@Argument AddOfferInput input) {
        return offersService.addOffer(input);
    }
    @SchemaMapping(typeName = "OffersModuleQuery")
    public Product product(@Argument String slug) {
        return offersService.getProductBySlug(slug);
    }

    @SchemaMapping(typeName = "OffersModuleQuery")
    public ProductPage products(
            @Argument String search,
            @Argument ProductFilter filter,
            @Argument String sort,
            @Argument int page,
            @Argument int size) {
        return offersService.getProducts(search, filter, sort, page, size);
    }

    @SchemaMapping(typeName = "OffersModuleQuery")
    public Category category(@Argument String slug) {
        return offersService.getCategoryBySlug(slug);
    }

    @SchemaMapping(typeName = "OffersModuleQuery")
    public List<Category> rootCategories() {
        return offersService.getRootCategories();
    }

    @SchemaMapping(typeName = "OffersModuleQuery")
    public List<Facet> facets(
            @Argument String categorySlug,
            @Argument String search,
            @Argument ProductFilter filter) {
        return offersService.getFacets(categorySlug, search, filter);
    }

    // --- Product Field Resolvers ---

    @SchemaMapping(typeName = "Product")
    public List<Category> breadcrumbs(Product product) {
        if (product.getCategory() == null) {
            return Collections.emptyList();
        }
        Category current = product.getCategory();
        List<Category> path = new ArrayList<>();
        while (current != null) {
            path.add(0, current);
            current = current.getParent();
        }
        return path;
    }

    @SchemaMapping(typeName = "Product")
    public Money priceFrom(Product product) {
        return product.getOffers().stream()
                .filter(o -> "ACTIVE".equals(o.getStatus()))
                .map(Offer::getPrice)
                .min(BigDecimal::compareTo)
                .map(price -> new Money(price, "PLN"))
                .orElse(null);
    }

    @SchemaMapping(typeName = "Product")
    public Offer defaultOffer(Product product) {
        List<Offer> activeOffers = product.getOffers().stream()
                .filter(o -> "ACTIVE".equals(o.getStatus()))
                .toList();
        if (activeOffers.isEmpty()) {
            return null;
        }

        return activeOffers.stream()
                .filter(o -> o.getStock() > 0)
                .min(java.util.Comparator.comparing(Offer::getPrice))
                .orElseGet(() -> activeOffers.stream()
                        .min(java.util.Comparator.comparing(Offer::getPrice))
                        .orElse(null));
    }

    /** Batch mapping for Product.offers to prevent N+1 queries */
    @BatchMapping(typeName = "Product", field = "offers")
    public Map<Product, List<Offer>> offers(List<Product> products) {
        return offersService.getOffersForProducts(products);
    }

    // --- Category Field Resolvers ---

    @SchemaMapping(typeName = "Category")
    public boolean isLeaf(Category category) {
        return category.getChildren().isEmpty();
    }

    @SchemaMapping(typeName = "Category")
    public List<AttributeDef> attributes(Category category) {
        return category.getCategoryAttributes().stream()
                .map(ca -> new AttributeDef(
                        ca.getAttribute().getCode(),
                        ca.getAttribute().getName(),
                        ca.getAttribute().getDataType(),
                        ca.getAttribute().getUnit(),
                        ca.getAttribute().isVariantAxis(),
                        ca.isFilterable()
                ))
                .toList();
    }

    // --- Offer Field Resolvers ---

    @SchemaMapping(typeName = "Offer")
    public Money price(Offer offer) {
        return new Money(offer.getPrice(), offer.getPriceCurrency());
    }

    @SchemaMapping(typeName = "Offer")
    public Money compareAtPrice(Offer offer) {
        return offer.getCompareAtPrice() != null
                ? new Money(offer.getCompareAtPrice(), offer.getPriceCurrency())
                : null;
    }

    @SchemaMapping(typeName = "Offer")
    public List<AttributeValue> attributes(Offer offer) {
        return offer.getAttributeValues().stream()
                .map(av -> new AttributeValue(
                        av.getAttribute().getCode(),
                        av.getAttribute().getName(),
                        av.getAttribute().getDataType(),
                        av.getAttribute().getUnit(),
                        av.getTextValue(),
                        av.getNumValue() != null ? av.getNumValue().doubleValue() : null,
                        av.getBoolValue()
                ))
                .toList();
    }
}
