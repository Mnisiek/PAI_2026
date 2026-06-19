package com.pai2026.backend.activity.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;

/**
 * Wires a ClickHouse-bound {@link NamedParameterJdbcTemplate}. The underlying
 * {@link DriverManagerDataSource} is intentionally <em>not</em> exposed as a
 * bean, so Spring Boot's primary (Postgres) {@code DataSource} auto-configuration
 * is left untouched.
 */
@Configuration
public class ClickHouseConfig {

    @Bean
    NamedParameterJdbcTemplate clickHouseJdbc(
            @Value("${clickhouse.url}") String url,
            @Value("${clickhouse.username}") String username,
            @Value("${clickhouse.password}") String password) {
        DriverManagerDataSource dataSource = new DriverManagerDataSource(url, username, password);
        return new NamedParameterJdbcTemplate(dataSource);
    }
}
