package main.java.com.budgetwise.config;

import io.github.cdimascio.dotenv.Dotenv;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.File;
import java.util.HashMap;
import java.util.Map;

@Slf4j
public class EnvConfig implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        try {
            String baseDir = System.getProperty("user.dir");
            File envFile = new File(baseDir, ".env");
            
            if (envFile.exists()) {
                Dotenv dotenv = Dotenv.configure()
                        .directory(baseDir)
                        .ignoreIfMissing()
                        .load();
                
                // Create a map from .env variables
                Map<String, Object> envVars = new HashMap<>();
                dotenv.entries().forEach(entry -> {
                    envVars.put(entry.getKey(), entry.getValue());
                    System.setProperty(entry.getKey(), entry.getValue());
                });
                
                // Add to Spring environment
                MapPropertySource propertySource = new MapPropertySource("dotenv", envVars);
                environment.getPropertySources().addFirst(propertySource);
                
                log.info("Successfully loaded .env file from: {}", envFile.getAbsolutePath());
            } else {
                log.warn(".env file not found at: {}", envFile.getAbsolutePath());
            }
        } catch (Exception e) {
            log.error("Error loading .env file", e);
        }
    }
}
