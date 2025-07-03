package com.ewaste.ewaste_backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration // Make sure this annotation is present
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**") // This applies CORS to ALL endpoints
                .allowedOrigins("http://localhost:3000") // This is crucial for your frontend
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS") // Allow necessary HTTP methods
                .allowedHeaders("*") // Allow all headers (including Authorization for JWT)
                .allowCredentials(true) // Important if you use cookies or session IDs (though JWT is stateless)
                .maxAge(3600); // Cache preflight results for 1 hour
    }

}
