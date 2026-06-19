package com.pai2026.backend.offers.api;

import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.anyString;

import com.pai2026.backend.offers.domain.Category;
import com.pai2026.backend.offers.domain.Product;
import com.pai2026.backend.offers.service.OffersService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.graphql.test.autoconfigure.GraphQlTest;
import org.springframework.graphql.test.tester.GraphQlTester;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.List;

@GraphQlTest(OffersController.class)
class OffersControllerTest {

    @Autowired
    GraphQlTester graphQlTester;

    @MockitoBean
    OffersService offersService;

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
}
