package com.budgetwise.controller;

import com.budgetwise.dto.CategoryRequest;
import com.budgetwise.dto.CategoryResponse;
import com.budgetwise.model.Category;
import com.budgetwise.model.User;
import com.budgetwise.repository.CategoryRepository;
import com.budgetwise.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "*")
public class CategoryController {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    // Default categories to initialize for new users
    private static final List<String> DEFAULT_CATEGORIES = Arrays.asList(
        "Salary",
        "Housing",
        "Food",
        "Transport",
        "Shopping",
        "Entertainment",
        "Healthcare",
        "Education",
        "Other"
    );

    /**
     * Get all categories for the authenticated user
     */
    @GetMapping
    public ResponseEntity<?> getCategories(Authentication authentication) {
        try {
            // Check if authentication is present
            if (authentication == null || authentication.getName() == null) {
                System.err.println("[CATEGORY] Authentication is null or has no name");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Authentication required. Please login."));
            }
            
            String identifier = authentication.getName();
            System.out.println("[CATEGORY] Fetching categories for user: " + identifier);
            
            // Try to find by username first (JWT contains username), then by email as fallback
            Optional<User> userOpt = userRepository.findByUsername(identifier);
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByEmail(identifier);
            }
            
            if (userOpt.isEmpty()) {
                System.err.println("[CATEGORY] User not found in database: " + identifier);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not found. Please logout and login again."));
            }
            
            User user = userOpt.get();
            List<Category> categories = categoryRepository.findByUserOrderByCreatedAtAsc(user);
            
            // If user has no categories, initialize with defaults
            if (categories.isEmpty()) {
                categories = initializeDefaultCategories(user);
            }
            
            List<CategoryResponse> response = categories.stream()
                .map(cat -> new CategoryResponse(
                    cat.getId(),
                    cat.getName(),
                    cat.isDefault(),
                    cat.getCreatedAt()
                ))
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Error fetching categories: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error fetching categories: " + e.getMessage()));
        }
    }

    /**
     * Add a new category
     */
    @PostMapping
    public ResponseEntity<?> addCategory(
            @RequestBody CategoryRequest request,
            Authentication authentication) {
        try {
            // Check if authentication is present
            if (authentication == null || authentication.getName() == null) {
                System.err.println("[CATEGORY] Authentication is null or has no name");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Authentication required. Please login again."));
            }
            
            String identifier = authentication.getName();
            System.out.println("[CATEGORY] Adding category for user: " + identifier);
            
            // Try to find by username first (JWT contains username), then by email as fallback
            Optional<User> userOpt = userRepository.findByUsername(identifier);
            if (userOpt.isEmpty()) {
                userOpt = userRepository.findByEmail(identifier);
            }
            
            if (userOpt.isEmpty()) {
                System.err.println("[CATEGORY] User not found in database: " + identifier);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not found. Please logout and login again."));
            }
            
            User user = userOpt.get();
            
            // Validate category name
            if (request.getName() == null || request.getName().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("message", "Category name cannot be empty"));
            }
            
            String categoryName = request.getName().trim();
            
            // Check if category already exists for this user
            if (categoryRepository.existsByUserAndName(user, categoryName)) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Category already exists"));
            }
            
            // Create and save new category
            Category category = new Category(user, categoryName, false);
            category = categoryRepository.save(category);
            
            CategoryResponse response = new CategoryResponse(
                category.getId(),
                category.getName(),
                category.isDefault(),
                category.getCreatedAt()
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            System.err.println("Error adding category: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error adding category: " + e.getMessage()));
        }
    }

    /**
     * Delete a category (only custom categories, not default ones)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            String email = authentication.getName();
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not found"));
            }
            
            User user = userOpt.get();
            Optional<Category> categoryOpt = categoryRepository.findById(id);
            
            if (categoryOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Category not found"));
            }
            
            Category category = categoryOpt.get();
            
            // Check if category belongs to the user
            if (!category.getUser().getId().equals(user.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "You don't have permission to delete this category"));
            }
            
            // Prevent deletion of default categories
            if (category.isDefault()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Cannot delete default categories"));
            }
            
            categoryRepository.delete(category);
            
            return ResponseEntity.ok(Map.of(
                "message", "Category deleted successfully",
                "id", id
            ));
            
        } catch (Exception e) {
            System.err.println("Error deleting category: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error deleting category: " + e.getMessage()));
        }
    }

    /**
     * Initialize default categories for a user
     */
    private List<Category> initializeDefaultCategories(User user) {
        List<Category> categories = new ArrayList<>();
        
        for (String categoryName : DEFAULT_CATEGORIES) {
            Category category = new Category(user, categoryName, true);
            categories.add(categoryRepository.save(category));
        }
        
        System.out.println("Initialized " + categories.size() + " default categories for user: " + user.getEmail());
        return categories;
    }

    /**
     * Reset categories to defaults (for debugging/testing)
     */
    @PostMapping("/reset")
    public ResponseEntity<?> resetCategories(Authentication authentication) {
        try {
            String email = authentication.getName();
            Optional<User> userOpt = userRepository.findByEmail(email);
            
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "User not found"));
            }
            
            User user = userOpt.get();
            
            // Delete all existing categories for this user
            List<Category> existingCategories = categoryRepository.findByUserOrderByCreatedAtAsc(user);
            categoryRepository.deleteAll(existingCategories);
            
            // Initialize defaults
            List<Category> categories = initializeDefaultCategories(user);
            
            List<CategoryResponse> response = categories.stream()
                .map(cat -> new CategoryResponse(
                    cat.getId(),
                    cat.getName(),
                    cat.isDefault(),
                    cat.getCreatedAt()
                ))
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "message", "Categories reset to defaults",
                "categories", response
            ));
            
        } catch (Exception e) {
            System.err.println("Error resetting categories: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("message", "Error resetting categories: " + e.getMessage()));
        }
    }
}
