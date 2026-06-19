package com.pai2026.backend.offers.service;

import com.pai2026.backend.offers.api.dto.*;
import com.pai2026.backend.offers.domain.*;
import com.pai2026.backend.offers.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class OffersService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final OfferRepository offerRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public OffersService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            BrandRepository brandRepository,
            OfferRepository offerRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.brandRepository = brandRepository;
        this.offerRepository = offerRepository;
    }

    public Product getProductBySlug(String slug) {
        return productRepository.findBySlugAndStatusActive(slug).orElse(null);
    }

    public Category getCategoryBySlug(String slug) {
        return categoryRepository.findBySlugAndIsActiveTrue(slug).orElse(null);
    }

    public List<Category> getRootCategories() {
        return categoryRepository.findRootCategories();
    }

    public Map<Product, List<Offer>> getOffersForProducts(List<Product> products) {
        if (products == null || products.isEmpty()) {
            return Collections.emptyMap();
        }
        List<Long> productIds = products.stream().map(Product::getId).toList();
        List<Offer> activeOffers = offerRepository.findByProductIdInAndStatus(productIds, "ACTIVE");

        Map<Long, List<Offer>> offersByProductId = activeOffers.stream()
                .collect(Collectors.groupingBy(o -> o.getProduct().getId()));

        return products.stream().collect(Collectors.toMap(
                p -> p,
                p -> offersByProductId.getOrDefault(p.getId(), Collections.emptyList())
        ));
    }

    public ProductPage getProducts(String search, ProductFilter filter, String sort, int page, int size) {
        List<Long> categoryIds = null;
        if (filter != null && filter.categorySlug() != null && !filter.categorySlug().isBlank()) {
            Category category = categoryRepository.findBySlugAndIsActiveTrue(filter.categorySlug()).orElse(null);
            if (category != null) {
                categoryIds = getCategoryIdsRecursively(category);
            } else {
                // Category slug was provided but not found, so no products should match
                return new ProductPage(Collections.emptyList(), 0, page, size, false);
            }
        }

        Specification<Product> spec = ProductSpecification.filterBy(search, filter, categoryIds, sort);

        // Sorting mapping for pageable
        Sort sortObj = Sort.unsorted();
        if (sort != null) {
            if ("NEWEST".equals(sort)) {
                sortObj = Sort.by(Sort.Direction.DESC, "createdAt");
            } else if ("RELEVANCE".equals(sort)) {
                sortObj = Sort.by(Sort.Direction.DESC, "id");
            }
            // PRICE_ASC and PRICE_DESC sorting is handled internally in ProductSpecification.java using Criteria subqueries.
        } else {
            sortObj = Sort.by(Sort.Direction.DESC, "id"); // Default sort
        }

        Pageable pageable = PageRequest.of(page, size, sortObj);
        Page<Product> productPage = productRepository.findAll(spec, pageable);

        return new ProductPage(
                productPage.getContent(),
                productPage.getTotalElements(),
                page,
                size,
                productPage.hasNext()
        );
    }

    public List<Facet> getFacets(String categorySlug, String search, ProductFilter filter) {
        Category category = categoryRepository.findBySlugAndIsActiveTrue(categorySlug).orElse(null);
        if (category == null) {
            return Collections.emptyList();
        }

        List<Long> categoryIds = getCategoryIdsRecursively(category);

        // Find all matching product IDs for the current search and filter
        // First we get matching products according to search & filter criteria.
        Specification<Product> spec = ProductSpecification.filterBy(search, filter, categoryIds, null);
        List<Product> matchingProducts = productRepository.findAll(spec);
        if (matchingProducts.isEmpty()) {
            return Collections.emptyList();
        }

        List<Long> productIds = matchingProducts.stream().map(Product::getId).toList();

        // Load filterable attributes declared for this category
        List<CategoryAttribute> filterableCategoryAttributes = category.getCategoryAttributes().stream()
                .filter(CategoryAttribute::isFilterable)
                .toList();

        if (filterableCategoryAttributes.isEmpty()) {
            return Collections.emptyList();
        }

        // Fetch aggregation metrics from OfferAttributeValue for the matching products
        // Group by attribute code
        List<Object[]> numberStats = entityManager.createQuery(
                "SELECT av.attribute.code, MIN(av.numValue), MAX(av.numValue) " +
                "FROM OfferAttributeValue av " +
                "WHERE av.offer.product.id IN :productIds AND av.offer.status = 'ACTIVE' " +
                "GROUP BY av.attribute.code", Object[].class)
                .setParameter("productIds", productIds)
                .getResultList();

        List<Object[]> textStats = entityManager.createQuery(
                "SELECT av.attribute.code, av.textValue, av.boolValue, COUNT(av.id) " +
                "FROM OfferAttributeValue av " +
                "WHERE av.offer.product.id IN :productIds AND av.offer.status = 'ACTIVE' " +
                "GROUP BY av.attribute.code, av.textValue, av.boolValue", Object[].class)
                .setParameter("productIds", productIds)
                .getResultList();

        // Build mappings of stats for easy access
        Map<String, double[]> numRangeMap = new HashMap<>();
        for (Object[] row : numberStats) {
            String code = (String) row[0];
            BigDecimal min = (BigDecimal) row[1];
            BigDecimal max = (BigDecimal) row[2];
            if (min != null && max != null) {
                numRangeMap.put(code, new double[]{min.doubleValue(), max.doubleValue()});
            }
        }

        Map<String, List<FacetOption>> optionsMap = new HashMap<>();
        for (Object[] row : textStats) {
            String code = (String) row[0];
            String textVal = (String) row[1];
            Boolean boolVal = (Boolean) row[2];
            long count = (Long) row[3];

            String valueStr = textVal;
            if (valueStr == null && boolVal != null) {
                valueStr = boolVal.toString();
            }

            if (valueStr != null) {
                optionsMap.computeIfAbsent(code, k -> new ArrayList<>())
                        .add(new FacetOption(valueStr, count));
            }
        }

        // Map CategoryAttributes to Facet DTOs
        List<Facet> facets = new ArrayList<>();
        for (CategoryAttribute catAttr : filterableCategoryAttributes) {
            Attribute attr = catAttr.getAttribute();
            String code = attr.getCode();
            String name = attr.getName();
            String dataType = attr.getDataType();
            String unit = attr.getUnit();

            Double min = null;
            Double max = null;
            List<FacetOption> options = Collections.emptyList();

            if ("NUMBER".equals(dataType)) {
                double[] range = numRangeMap.get(code);
                if (range != null) {
                    min = range[0];
                    max = range[1];
                }
            } else {
                List<FacetOption> opts = optionsMap.get(code);
                if (opts != null) {
                    opts.sort((a, b) -> Long.compare(b.count(), a.count())); // Descending count
                    options = opts;
                }
            }

            facets.add(new Facet(code, name, dataType, unit, options, min, max));
        }

        return facets;
    }

    private List<Long> getCategoryIdsRecursively(Category category) {
        List<Long> ids = new ArrayList<>();
        ids.add(category.getId());
        for (Category child : category.getChildren()) {
            ids.addAll(getCategoryIdsRecursively(child));
        }
        return ids;
    }
}
