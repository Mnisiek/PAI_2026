package com.pai2026.backend.offers.service;

import com.pai2026.backend.offers.domain.*;
import com.pai2026.backend.offers.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Component
public class CatalogSeeder implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;
    private final OfferRepository offerRepository;

    public CatalogSeeder(
            CategoryRepository categoryRepository,
            BrandRepository brandRepository,
            ProductRepository productRepository,
            OfferRepository offerRepository) {
        this.categoryRepository = categoryRepository;
        this.brandRepository = brandRepository;
        this.productRepository = productRepository;
        this.offerRepository = offerRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (categoryRepository.count() > 0) {
            return; // Already seeded
        }

        // 1. Seed Brands
        Brand apple = new Brand("Apple", "apple", "https://logo.url/apple", "Apple products", true);
        Brand samsung = new Brand("Samsung", "samsung", null, "Samsung products", true);
        Brand sony = new Brand("Sony", "sony", null, "Sony products", true);
        Brand generic = new Brand("Generic", "generic", null, "Generic brand", true);
        brandRepository.saveAll(List.of(apple, samsung, sony, generic));

        // 2. Seed Categories
        Category elektronika = createCategory("Elektronika", "elektronika", null, 1);
        Category domIOgrod = createCategory("Dom i Ogród", "dom-i-ogrod", null, 2);
        Category sport = createCategory("Sport", "sport", null, 3);
        Category moda = createCategory("Moda", "moda", null, 4);
        Category biuro = createCategory("Biuro", "biuro", null, 5);

        categoryRepository.saveAll(List.of(elektronika, domIOgrod, sport, moda, biuro));

        // Subcategories
        Category audio = createCategory("Audio", "audio", elektronika, 1);
        Category monitory = createCategory("Monitory", "monitory", elektronika, 2);
        Category kuchnia = createCategory("Kuchnia", "kuchnia", domIOgrod, 1);
        Category oswietlenie = createCategory("Oświetlenie", "oswietlenie", domIOgrod, 2);
        Category fitness = createCategory("Fitness", "fitness", sport, 1);
        Category wearables = createCategory("Wearables", "wearables", sport, 2);
        Category okrycia = createCategory("Okrycia", "okrycia", moda, 1);
        Category obuwie = createCategory("Obuwie", "obuwie", moda, 2);
        Category fotele = createCategory("Fotele", "fotele", biuro, 1);
        Category lampy = createCategory("Lampy", "lampy", biuro, 2);

        categoryRepository.saveAll(List.of(audio, monitory, kuchnia, oswietlenie, fitness, wearables, okrycia, obuwie, fotele, lampy));

        // 3. Seed Products and their corresponding Offers
        seedProduct(
                "Słuchawki bezprzewodowe S-900", "sluchawki-bezprzewodowe-s-900",
                "Redukcja szumu, do 40 h pracy, Bluetooth 5.3.",
                "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
                audio, sony, 349.99, "S900-BLK", 15
        );

        seedProduct(
                "Monitor 27 cali QHD", "monitor-27-cali-qhd",
                "Odświeżanie 165 Hz, panel IPS, tryb nocny.",
                "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80",
                monitory, samsung, 1199.00, "MON-27-QHD", 8
        );

        seedProduct(
                "Ekspres ciśnieniowy Barista One", "ekspres-cisnieniowy-barista-one",
                "Młynek stalowy, 12 profilów, automatyczne czyszczenie.",
                "https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=900&q=80",
                kuchnia, generic, 1899.50, "EXP-BAR-ONE", 5
        );

        seedProduct(
                "Lampa stojąca Arc Light", "lampa-stojaca-arc-light",
                "Regulacja wysokości i ciepła barwa światła.",
                "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?auto=format&fit=crop&w=900&q=80",
                oswietlenie, generic, 429.00, "LMP-ARC-LGT", 20
        );

        seedProduct(
                "Mata treningowa Pro Grip", "mata-treningowa-pro-grip",
                "Antypoślizgowa, 6 mm grubości, materiał premium.",
                "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=900&q=80",
                fitness, generic, 159.00, "MAT-PRO-GRP", 30
        );

        seedProduct(
                "Smartwatch Active 4", "smartwatch-active-4",
                "GPS, monitor snu, 7 dni pracy na baterii.",
                "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80",
                wearables, samsung, 799.00, "SMW-ACT-4", 12
        );

        seedProduct(
                "Kurtka miejska Northline", "kurtka-miejska-northline",
                "Wodoodporna, oddychająca, kaptur chowany w kołnierz.",
                "https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=900&q=80",
                okrycia, generic, 569.00, "JAC-NLINE-M", 6
        );

        seedProduct(
                "Buty biegowe AeroFlow", "buty-biegowe-aeroflow",
                "Lekka podeszwa, amortyzacja dynamiczna.",
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
                obuwie, generic, 499.00, "SHO-AFLOW-42", 18
        );

        seedProduct(
                "Fotel ergonomiczny Office Plus", "fotel-ergonomiczny-office-plus",
                "Regulacja 4D, siatka mesh, podparcie lędźwi.",
                "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80",
                fotele, generic, 1350.00, "CHR-OFF-PLUS", 4
        );

        seedProduct(
                "Lampka biurkowa Focus Beam", "lampka-biurkowa-focus-beam",
                "Sterowanie dotykowe, trzy temperatury światła.",
                "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=80",
                lampy, generic, 189.00, "LMP-FCS-BM", 25
        );
    }

    private Category createCategory(String name, String slug, Category parent, int sortOrder) {
        Category category = new Category();
        category.setName(name);
        category.setSlug(slug);
        category.setParent(parent);
        category.setSortOrder(sortOrder);
        category.setActive(true);
        return category;
    }

    private void seedProduct(
            String name, String slug, String description, String imageUrl,
            Category category, Brand brand, double price, String sku, int stock) {
        
        Product product = new Product();
        product.setName(name);
        product.setSlug(slug);
        product.setDescription(description);
        product.setMainImageUrl(imageUrl);
        product.setCategory(category);
        product.setBrand(brand);
        product.setStatus("ACTIVE");
        product.setSearchText(name + " " + description + " " + brand.getName() + " " + category.getName());
        product.setSpecs(List.of(
                new Spec("Producent", brand.getName()),
                new Spec("Kategoria", category.getName())
        ));
        
        product = productRepository.save(product);

        Offer offer = new Offer();
        offer.setProduct(product);
        offer.setSku(sku);
        offer.setPrice(BigDecimal.valueOf(price));
        offer.setPriceCurrency("PLN");
        offer.setStock(stock);
        offer.setStatus("ACTIVE");

        offerRepository.save(offer);
    }
}
