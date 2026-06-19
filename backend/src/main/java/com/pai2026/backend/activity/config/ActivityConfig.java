package com.pai2026.backend.activity.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Activity module infrastructure: the scheduled background flush of the
 * ClickHouse writer ({@code @EnableScheduling}) and off-request-thread Redis
 * retargeting updates ({@code @EnableAsync}).
 */
@Configuration
@EnableScheduling
@EnableAsync
public class ActivityConfig {
}
