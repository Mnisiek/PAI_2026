package com.pai2026.backend.offers.service;

import com.pai2026.backend.offers.api.dto.AttributeFilterInput;
import com.pai2026.backend.offers.api.dto.ProductFilter;
import com.pai2026.backend.offers.domain.*;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class ProductSpecification {

    public static Specification<Product> filterBy(String search, ProductFilter filter, List<Long> categoryIds, String sort) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Search text (ILIKE on product.searchText)
            if (search != null && !search.isBlank()) {
                String searchPattern = "%" + search.trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("searchText")), searchPattern));
            }

            // 2. Category Filter (match categoryIds including descendants)
            if (categoryIds != null && !categoryIds.isEmpty()) {
                predicates.add(root.get("category").get("id").in(categoryIds));
            }

            // 3. Brand Filter (match brandSlugs)
            if (filter != null && filter.brandSlugs() != null && !filter.brandSlugs().isEmpty()) {
                predicates.add(root.get("brand").get("slug").in(filter.brandSlugs()));
            }

            // 4. In Stock Filter (has at least one active offer with stock > 0)
            // 5. Price Min/Max (has at least one active offer within price range)
            // Let's use EXISTS subqueries to filter products by their offers, avoiding duplicate rows from joins.
            if (filter != null && (filter.inStock() != null && filter.inStock()
                    || filter.priceMin() != null || filter.priceMax() != null)) {
                
                Subquery<Long> offerSubquery = query.subquery(Long.class);
                Root<Offer> offerRoot = offerSubquery.from(Offer.class);
                offerSubquery.select(cb.literal(1L));
                
                List<Predicate> subqueryPredicates = new ArrayList<>();
                subqueryPredicates.add(cb.equal(offerRoot.get("product"), root));
                subqueryPredicates.add(cb.equal(offerRoot.get("status"), "ACTIVE"));
                
                if (filter.inStock() != null && filter.inStock()) {
                    subqueryPredicates.add(cb.greaterThan(offerRoot.get("stock"), 0));
                }
                
                if (filter.priceMin() != null) {
                    subqueryPredicates.add(cb.ge(offerRoot.get("price"), filter.priceMin()));
                }
                
                if (filter.priceMax() != null) {
                    subqueryPredicates.add(cb.le(offerRoot.get("price"), filter.priceMax()));
                }
                
                offerSubquery.where(subqueryPredicates.toArray(new Predicate[0]));
                predicates.add(cb.exists(offerSubquery));
            }

            // 6. Dynamic Attributes Filters (attributes list)
            if (filter != null && filter.attributes() != null && !filter.attributes().isEmpty()) {
                for (AttributeFilterInput attrFilter : filter.attributes()) {
                    if (attrFilter.code() == null || attrFilter.code().isBlank()) {
                        continue;
                    }
                    
                    Subquery<Long> attrSubquery = query.subquery(Long.class);
                    Root<OfferAttributeValue> avRoot = attrSubquery.from(OfferAttributeValue.class);
                    attrSubquery.select(cb.literal(1L));
                    
                    List<Predicate> subqueryPredicates = new ArrayList<>();
                    // link to main product via offer
                    subqueryPredicates.add(cb.equal(avRoot.get("offer").get("product"), root));
                    subqueryPredicates.add(cb.equal(avRoot.get("offer").get("status"), "ACTIVE"));
                    // match attribute code
                    subqueryPredicates.add(cb.equal(avRoot.get("attribute").get("code"), attrFilter.code()));
                    
                    // check values for TEXT/BOOL
                    if (attrFilter.values() != null && !attrFilter.values().isEmpty()) {
                        List<Predicate> valuePredicates = new ArrayList<>();
                        valuePredicates.add(avRoot.get("textValue").in(attrFilter.values()));
                        
                        // Parse values as boolean where possible for boolValue mapping
                        List<Boolean> boolValues = attrFilter.values().stream()
                                .filter(v -> "true".equalsIgnoreCase(v) || "false".equalsIgnoreCase(v))
                                .map(Boolean::parseBoolean)
                                .toList();
                        if (!boolValues.isEmpty()) {
                            valuePredicates.add(avRoot.get("boolValue").in(boolValues));
                        }
                        
                        subqueryPredicates.add(cb.or(valuePredicates.toArray(new Predicate[0])));
                    }
                    
                    // check min/max for NUMBER
                    if (attrFilter.min() != null) {
                        subqueryPredicates.add(cb.ge(avRoot.get("numValue"), attrFilter.min()));
                    }
                    
                    if (attrFilter.max() != null) {
                        subqueryPredicates.add(cb.le(avRoot.get("numValue"), attrFilter.max()));
                    }
                    
                    attrSubquery.where(subqueryPredicates.toArray(new Predicate[0]));
                    predicates.add(cb.exists(attrSubquery));
                }
            }

            // Always enforce that the product is ACTIVE
            predicates.add(cb.equal(root.get("status"), "ACTIVE"));

            // 7. Price Sorting (only for the main query, not count query)
            if (query.getResultType() != Long.class && (sort != null)) {
                if ("PRICE_ASC".equals(sort) || "PRICE_DESC".equals(sort)) {
                    Subquery<java.math.BigDecimal> minPriceSubquery = query.subquery(java.math.BigDecimal.class);
                    Root<Offer> offerRoot = minPriceSubquery.from(Offer.class);
                    minPriceSubquery.select(cb.min(offerRoot.get("price")));
                    minPriceSubquery.where(
                        cb.equal(offerRoot.get("product"), root),
                        cb.equal(offerRoot.get("status"), "ACTIVE")
                    );

                    Order priceOrder = "PRICE_DESC".equals(sort)
                        ? cb.desc(minPriceSubquery)
                        : cb.asc(minPriceSubquery);

                    query.orderBy(priceOrder);
                }
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
