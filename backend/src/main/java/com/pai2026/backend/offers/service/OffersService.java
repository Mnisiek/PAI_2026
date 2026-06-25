package com.pai2026.backend.offers.service;

import com.pai2026.backend.activity.persistence.RetargetingStore;
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

import java.text.Normalizer;
import java.math.BigDecimal;
import java.util.*;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class OffersService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final OfferRepository offerRepository;
    private final AttributeRepository attributeRepository;
    private final CategoryAttributeRepository categoryAttributeRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public OffersService(
            ProductRepository productRepository,
            CategoryRepository categoryRepository,
            BrandRepository brandRepository,
            OfferRepository offerRepository,
            AttributeRepository attributeRepository,
            CategoryAttributeRepository categoryAttributeRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.brandRepository = brandRepository;
        this.offerRepository = offerRepository;
        this.attributeRepository = attributeRepository;
        this.categoryAttributeRepository = categoryAttributeRepository;
    }

    @Transactional
    public Category addCategory(AddCategoryInput input) {
        String name = requireText(input.name(), "Category name is required.");

        Category parent = null;
        Long parentId = null;
        if (input.parentId() != null && !input.parentId().isBlank()) {
            parentId = parseId(input.parentId(), "Invalid parentId.");
            parent = categoryRepository.findByIdAndIsActiveTrue(parentId)
                    .orElseThrow(() -> new IllegalArgumentException("Parent category not found."));
        }

        Category category = new Category();
        category.setName(name);
        category.setParent(parent);
        category.setActive(true);
        category.setSortOrder(categoryRepository.findMaxSortOrderByParentId(parentId) + 1);
        category.setSlug(uniqueSlug(name, categoryRepository::existsBySlug));

        Category saved = categoryRepository.save(category);

        // Declared filters become filterable category_attribute rows.
        if (input.attributes() != null) {
            for (CategoryAttributeInput attr : input.attributes()) {
                if (attr == null) {
                    continue;
                }
                String attrName = trimToNull(attr.name());
                if (attrName == null) {
                    continue;
                }
                Attribute attribute = resolveOrCreateAttribute(attrName, attr.dataType(), attr.unit());
                registerCategoryFilter(saved, attribute);
            }
        }

        return saved;
    }

    @Transactional
    public Product addProduct(AddProductInput input) {
        String name = requireText(input.name(), "Product name is required.");
        String sku = requireText(input.sku(), "SKU is required.");
        BigDecimal price = requirePrice(input.price());
        int stock = normalizeStock(input.stock());

        Long categoryId = parseId(input.categoryId(), "Invalid categoryId.");
        Category category = categoryRepository.findByIdAndIsActiveTrue(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Category not found."));

        if (offerRepository.existsBySku(sku)) {
            throw new IllegalArgumentException("Offer SKU already exists.");
        }

        Product product = new Product();
        product.setName(name);
        product.setSlug(uniqueSlug(name, productRepository::existsBySlug));
        product.setDescription(trimToNull(input.description()));
        product.setCategory(category);
        product.setBrand(resolveOrCreateBrand(input.brandName()));
        product.setMainImageUrl(trimToNull(input.imageUrl()));
        product.setStatus("ACTIVE");
        product.setSpecs(new ArrayList<>());
        product.setSearchText(buildSearchText(name, input.description(), input.brandName(), category.getName()));

        Product savedProduct = productRepository.save(product);

        Offer offer = new Offer();
        offer.setProduct(savedProduct);
        offer.setSku(sku);
        offer.setPrice(price);
        offer.setPriceCurrency("PLN");
        offer.setStock(stock);
        offer.setStatus("ACTIVE");

        persistAttributePairs(offer, savedProduct, toAttributePairs(input.attributes()));

        offerRepository.save(offer);

        return savedProduct;
    }

    @Transactional
    public Offer addOffer(AddOfferInput input) {
        String sku = requireText(input.sku(), "SKU is required.");
        BigDecimal price = requirePrice(input.price());
        int stock = normalizeStock(input.stock());

        Long productId = parseId(input.productId(), "Invalid productId.");
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("Product not found."));

        if (offerRepository.existsBySku(sku)) {
            throw new IllegalArgumentException("Offer SKU already exists.");
        }

        Offer offer = new Offer();
        offer.setProduct(product);
        offer.setSku(sku);
        offer.setPrice(price);
        offer.setPriceCurrency("PLN");
        offer.setStock(stock);
        offer.setStatus("ACTIVE");

        persistAttributePairs(offer, product, collectAttributePairs(input));
        applyOfferImages(offer, input.images());

        return offerRepository.save(offer);
    }

    /**
     * Attaches each attribute value to the offer (typing it by the attribute's data
     * type) and ensures the attribute is a filterable facet on the product's category.
     */
    private void persistAttributePairs(Offer offer, Product product, List<AttributePair> pairs) {
        for (AttributePair pair : pairs) {
            Attribute attribute = resolveOrCreateTextAttribute(pair.name());
            OfferAttributeValue value = new OfferAttributeValue();
            value.setOffer(offer);
            value.setAttribute(attribute);
            assignTypedValue(value, attribute.getDataType(), pair.value());
            offer.getAttributeValues().add(value);

            registerCategoryFilter(product.getCategory(), attribute);
        }
    }

    /** Stores the raw string into the column matching the attribute's data type. */
    private void assignTypedValue(OfferAttributeValue value, String dataType, String raw) {
        if ("NUMBER".equals(dataType)) {
            try {
                value.setNumValue(new BigDecimal(raw.trim().replace(',', '.')));
                return;
            } catch (NumberFormatException ignored) {
                // Not a number after all — fall back to text so nothing is lost.
            }
        } else if ("BOOL".equals(dataType)) {
            value.setBoolValue(parseBool(raw));
            return;
        }
        value.setTextValue(raw);
    }

    private boolean parseBool(String raw) {
        String v = raw.trim().toLowerCase(Locale.ROOT);
        return v.equals("true") || v.equals("tak") || v.equals("yes") || v.equals("1");
    }

    private void applyOfferImages(Offer offer, List<String> imageUrls) {
        if (imageUrls == null) {
            return;
        }
        int sortOrder = 0;
        for (String raw : imageUrls) {
            String url = trimToNull(raw);
            if (url == null) {
                continue;
            }
            OfferImage image = new OfferImage();
            image.setOffer(offer);
            image.setUrl(url);
            image.setSortOrder(sortOrder++);
            offer.getImages().add(image);
        }
    }

    /** Declares {@code attribute} as a filterable facet for {@code category} (idempotent). */
    private void registerCategoryFilter(Category category, Attribute attribute) {
        if (category == null || attribute == null || attribute.getId() == null) {
            return;
        }
        if (categoryAttributeRepository.existsByCategoryIdAndAttributeId(category.getId(), attribute.getId())) {
            return;
        }

        CategoryAttribute categoryAttribute = new CategoryAttribute();
        categoryAttribute.setCategory(category);
        categoryAttribute.setAttribute(attribute);
        categoryAttribute.setFilterable(true);
        categoryAttribute.setRequired(false);
        categoryAttribute.setSortOrder((int) categoryAttributeRepository.countByCategoryId(category.getId()));
        categoryAttributeRepository.save(categoryAttribute);
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

    public List<Product> getRetargetedProducts(String userId, String sessionId, int limit) {
        List<RetargetingStore.RetargetingSignal> signals = retargetingStore.getSignals(userId, sessionId);
        if (signals.isEmpty()) {
            Pageable pageable = PageRequest.of(0, limit);
            return productRepository.findAll(pageable).getContent();
        }

        List<Long> productIds = signals.stream()
                .filter(s -> "product".equals(s.targetType()))
                .map(RetargetingStore.RetargetingSignal::targetId)
                .collect(Collectors.toList());

        List<Long> categoryIds = signals.stream()
                .filter(s -> "category".equals(s.targetType()))
                .map(RetargetingStore.RetargetingSignal::targetId)
                .collect(Collectors.toList());

        List<Product> result = new ArrayList<>();
        Set<Long> collectedProductIds = new HashSet<>();

        if (!productIds.isEmpty()) {
            List<Product> directProducts = productRepository.findAllById(productIds);
            Map<Long, Product> productMap = directProducts.stream()
                    .collect(Collectors.toMap(Product::getId, p -> p));
            for (Long pid : productIds) {
                Product p = productMap.get(pid);
                if (p != null && "ACTIVE".equals(p.getStatus())) {
                    result.add(p);
                    collectedProductIds.add(pid);
                }
            }
        }

        if (result.size() < limit && !categoryIds.isEmpty()) {
            List<Product> categoryProducts = entityManager.createQuery(
                    "SELECT p FROM Product p WHERE p.category.id IN :categoryIds AND p.status = 'ACTIVE' ORDER BY p.id DESC", Product.class)
                    .setParameter("categoryIds", categoryIds)
                    .setMaxResults(limit * 2)
                    .getResultList();

            for (Product p : categoryProducts) {
                if (result.size() >= limit) {
                    break;
                }
                if (!collectedProductIds.contains(p.getId())) {
                    result.add(p);
                    collectedProductIds.add(p.getId());
                }
            }
        }

        if (result.size() < limit) {
            List<Product> newestProducts = entityManager.createQuery(
                    "SELECT p FROM Product p WHERE p.status = 'ACTIVE' ORDER BY p.id DESC", Product.class)
                    .setMaxResults(limit * 2)
                    .getResultList();

            for (Product p : newestProducts) {
                if (result.size() >= limit) {
                    break;
                }
                if (!collectedProductIds.contains(p.getId())) {
                    result.add(p);
                    collectedProductIds.add(p.getId());
                }
            }
        }

        if (result.size() > limit) {
            return result.subList(0, limit);
        }
        return result;
    }

    private Brand resolveOrCreateBrand(String brandNameRaw) {
        String brandName = trimToNull(brandNameRaw);
        if (brandName == null) {
            return null;
        }

        String slugBase = slugify(brandName);
        if (slugBase.isBlank()) {
            slugBase = "brand";
        }

        Brand existing = brandRepository.findBySlug(slugBase).orElse(null);
        if (existing != null) {
            if (!existing.isActive()) {
                existing.setActive(true);
            }
            if (!existing.getName().equals(brandName)) {
                existing.setName(brandName);
            }
            return brandRepository.save(existing);
        }

        Brand brand = new Brand();
        brand.setName(brandName);
        brand.setSlug(uniqueSlug(slugBase, slug -> brandRepository.findBySlug(slug).isPresent()));
        brand.setActive(true);
        return brandRepository.save(brand);
    }

    private Attribute resolveOrCreateTextAttribute(String attributeName) {
        return resolveOrCreateAttribute(attributeName, "TEXT", null);
    }

    /** Finds an attribute by its slug code, or creates one with the given type/unit. */
    private Attribute resolveOrCreateAttribute(String attributeName, String dataType, String unit) {
        String codeBase = slugify(attributeName);
        if (codeBase.isBlank()) {
            codeBase = "attribute";
        }

        Attribute existing = attributeRepository.findByCode(codeBase).orElse(null);
        if (existing != null) {
            return existing;
        }

        Attribute attribute = new Attribute();
        attribute.setCode(uniqueSlug(codeBase, attributeRepository::existsByCode));
        attribute.setName(attributeName);
        attribute.setDataType(normalizeDataType(dataType));
        attribute.setUnit(trimToNull(unit));
        attribute.setVariantAxis(false);
        return attributeRepository.save(attribute);
    }

    private String normalizeDataType(String dataType) {
        if (dataType == null) {
            return "TEXT";
        }
        String normalized = dataType.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "NUMBER", "BOOL", "TEXT" -> normalized;
            default -> "TEXT";
        };
    }

    private String uniqueSlug(String baseText, Predicate<String> existsCheck) {
        String base = slugify(baseText);
        if (base.isBlank()) {
            base = "item";
        }

        String candidate = base;
        int suffix = 2;
        while (existsCheck.test(candidate)) {
            candidate = base + "-" + suffix;
            suffix++;
        }

        return candidate;
    }

    private String slugify(String input) {
        if (input == null) {
            return "";
        }

        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");

        return normalized;
    }

    private Long parseId(String value, String message) {
        try {
            return Long.parseLong(requireText(value, message));
        } catch (NumberFormatException ex) {
            throw new IllegalArgumentException(message);
        }
    }

    private BigDecimal requirePrice(Double value) {
        if (value == null || value <= 0d) {
            throw new IllegalArgumentException("Price must be greater than zero.");
        }
        return BigDecimal.valueOf(value);
    }

    private int normalizeStock(Integer value) {
        if (value == null) {
            return 0;
        }
        return Math.max(0, value);
    }

    private String requireText(String value, String message) {
        String trimmed = trimToNull(value);
        if (trimmed == null) {
            throw new IllegalArgumentException(message);
        }
        return trimmed;
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String buildSearchText(String name, String description, String brandName, String categoryName) {
        List<String> parts = new ArrayList<>();
        if (name != null) {
            parts.add(name.trim());
        }
        if (description != null && !description.isBlank()) {
            parts.add(description.trim());
        }
        if (brandName != null && !brandName.isBlank()) {
            parts.add(brandName.trim());
        }
        if (categoryName != null && !categoryName.isBlank()) {
            parts.add(categoryName.trim());
        }
        return String.join(" ", parts).toLowerCase(Locale.ROOT);
    }

    private List<AttributePair> collectAttributePairs(AddOfferInput input) {
        List<AttributePair> pairs = toAttributePairs(input.attributes());

        // Backward compatibility for older clients that still send one attribute.
        String legacyName = trimToNull(input.attributeName());
        String legacyValue = trimToNull(input.attributeValue());
        if (legacyName != null && legacyValue != null
                && pairs.stream().noneMatch(p -> slugify(p.name()).equals(slugify(legacyName)))) {
            pairs.add(new AttributePair(legacyName, legacyValue));
        }

        return pairs;
    }

    private List<AttributePair> toAttributePairs(List<AddOfferAttributeInput> attributes) {
        LinkedHashMap<String, AttributePair> dedupedByCode = new LinkedHashMap<>();
        if (attributes != null) {
            for (AddOfferAttributeInput attr : attributes) {
                if (attr == null) {
                    continue;
                }

                String name = trimToNull(attr.name());
                String value = trimToNull(attr.value());
                if (name == null || value == null) {
                    continue;
                }

                dedupedByCode.put(slugify(name), new AttributePair(name, value));
            }
        }
        return new ArrayList<>(dedupedByCode.values());
    }

    private record AttributePair(String name, String value) {}
}
