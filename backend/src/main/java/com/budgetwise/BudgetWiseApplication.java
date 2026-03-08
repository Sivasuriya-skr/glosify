package com.budgetwise;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;

import java.io.File;
import java.nio.file.Paths;

@SpringBootApplication
public class BudgetWiseApplication {
    
    // Load environment variables from .env file before anything else
    static {
        loadEnvFile();
    }
    
    private static void loadEnvFile() {
        try {
            String currentDir = System.getProperty("user.dir");
            System.err.println("Current working directory: " + currentDir);
            
            // Try different possible locations for .env file
            String[] possiblePaths = {
                currentDir + File.separator + ".env",
                currentDir + File.separator + "backend" + File.separator + ".env",
                new File(currentDir).getParent() + File.separator + ".env"
            };
            
            File envFile = null;
            for (String path : possiblePaths) {
                File f = new File(path);
                System.err.println("Checking for .env at: " + f.getAbsolutePath());
                if (f.exists()) {
                    envFile = f;
                    break;
                }
            }
            
            if (envFile != null && envFile.exists()) {
                Dotenv dotenv = Dotenv.configure()
                        .directory(envFile.getParent())
                        .filename(".env")
                        .ignoreIfMissing()
                        .load();
                
                // Load all environment variables into system properties
                dotenv.entries().forEach(entry -> {
                    System.setProperty(entry.getKey(), entry.getValue());
                    System.err.println("Loaded env: " + entry.getKey());
                });
                
                System.err.println("✓ Successfully loaded .env file from: " + envFile.getAbsolutePath());
            } else {
                System.err.println("⚠ Warning: .env file not found in any of the expected locations");
            }
        } catch (Exception e) {
            System.err.println("✗ Error loading .env file: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    public static void main(String[] args) {
        SpringApplication.run(BudgetWiseApplication.class, args);
    }
}