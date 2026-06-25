package com.pai2026.backend.offers.api;

import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.anyString;

import static org.mockito.ArgumentMatchers.any;
import com.pai2026.backend.offers.domain.Category;
import com.pai2026.backend.offers.domain.Product;
import com.pai2026.backend.infrastructure.api.OffersController;
import com.pai2026.backend.infrastructure.service.OffersService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.graphql.test.autoconfigure.GraphQlTest;
import org.springframework.graphql.test.tester.GraphQlTester;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.List;

@GraphQlTest(OffersController.class)
@org.springframework.context.annotation.Import(com.pai2026.backend.infrastructure.config.SecurityConfig.class)
class OffersControllerTest {

    @Autowired
    GraphQlTester graphQlTester;

    @MockitoBean
    OffersService offersService;

    @MockitoBean
    com.pai2026.backend.infrastructure.config.JwtFilter jwtFilter;

    @Test
    void getRootCategoriesResolvesSuccessfully() {
        Category electronics = new Category();
        electronics.setId(1L);
        electronics.setName("Elektronika");
        electronics.setSlug("elektronika");

        when(offersService.getRootCategories()).thenReturn(List.of(electronics));

        String query = """
                query {
                  offersModule {
                    rootCategories {
                      id
                      name
                      slug
                    }
                  }
                }
                """;

        graphQlTester.document(query)
                .execute()
                .path("offersModule.rootCategories[0].name").entity(String.class).isEqualTo("Elektronika")
                .path("offersModule.rootCategories[0].slug").entity(String.class).isEqualTo("elektronika");
    }

    @Test
    void getProductBySlugResolvesSuccessfully() {
        Product phone = new Product();
        phone.setId(10L);
        phone.setName("Smartphone X");
        phone.setSlug("smartphone-x");
        phone.setStatus("ACTIVE");

        when(offersService.getProductBySlug("smartphone-x")).thenReturn(phone);

        String query = """
                query {
                  offersModule {
                    product(slug: "smartphone-x") {
                      id
                      name
                      slug
                      status
                    }
                  }
                }
                """;

        graphQlTester.document(query)
                .execute()
                .path("offersModule.product.name").entity(String.class).isEqualTo("Smartphone X")
                .path("offersModule.product.status").entity(String.class).isEqualTo("ACTIVE");
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void addCategoryResolvesSuccessfullyForAdmin() {
        Category category = new Category();
        category.setId(5L);
        category.setName("Books");
        category.setSlug("books");

        when(offersService.addCategory(any())).thenReturn(category);

        String mutation = """
                mutation {
                  addCategory(input: { name: "Books", parentId: null }) {
                    id
                    name
                    slug
                  }
                }
                """;

        graphQlTester.document(mutation)
                .execute()
                .path("addCategory.name").entity(String.class).isEqualTo("Books");
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    void addCategoryFailsForCustomer() {
        String mutation = """
                mutation {
                  addCategory(input: { name: "Books", parentId: null }) {
                    id
                    name
                    slug
                  }
                }
                """;

        graphQlTester.document(mutation)
                .execute()
                .errors()
                .satisfy(errors -> {
                    org.junit.jupiter.api.Assertions.assertFalse(errors.isEmpty());
                    String msg = errors.get(0).getMessage().toLowerCase();
                    org.junit.jupiter.api.Assertions.assertTrue(
                        msg.contains("internal_error")
                        || msg.contains("access is denied") 
                        || msg.contains("forbidden")
                        || msg.contains("denied")
                        || msg.contains("unauthorized")
                    );
                });
    }
}
