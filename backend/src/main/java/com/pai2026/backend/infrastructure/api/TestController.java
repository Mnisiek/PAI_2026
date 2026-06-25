package com.pai2026.backend.infrastructure.api;

import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
public class TestController {

    @QueryMapping
    public String healthCheck() {
        return "OK";
    }
}
