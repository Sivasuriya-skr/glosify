package com.budgetwise.controller;

import com.budgetwise.dto.UpdateProfileRequest;
import com.budgetwise.dto.UserProfileDTO;
import com.budgetwise.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    /**
     * Get current user profile (protected)
     */
    @GetMapping
    public ResponseEntity<?> getProfile() {
        try {
            UserProfileDTO profile = profileService.getUserProfile();
            return ResponseEntity.ok(profile);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse(400, ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(500, "Internal server error"));
        }
    }

    /**
     * Update user profile details (protected)
     */
    @PutMapping
    public ResponseEntity<?> updateProfile(@RequestBody UpdateProfileRequest request) {
        try {
            UserProfileDTO updatedProfile = profileService.updateProfile(request);
            return ResponseEntity.ok(updatedProfile);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse(400, ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(500, "Internal server error"));
        }
    }

    /**
     * Upload user profile image (protected)
     */
    @PostMapping("/avatar")
    public ResponseEntity<?> uploadProfileImage(@RequestParam("file") MultipartFile file) {
        try {
            UserProfileDTO updatedProfile = profileService.uploadProfileImage(file);
            return ResponseEntity.ok(updatedProfile);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse(400, ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(500, "Internal server error"));
        }
    }

    /**
     * Get profile image (public)
     */
    @GetMapping("/avatar/{filename}")
    public ResponseEntity<?> getProfileImage(@PathVariable String filename) {
        try {
            // Serve the file directly from /uploads directory
            java.nio.file.Path imagePath = java.nio.file.Paths.get("uploads").resolve(filename);
            if (!java.nio.file.Files.exists(imagePath)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(createErrorResponse(404, "Image not found"));
            }

            byte[] imageBytes = java.nio.file.Files.readAllBytes(imagePath);
            return ResponseEntity.ok()
                    .header("Content-Type", "image/png")
                    .body(imageBytes);
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(500, "Failed to load image"));
        }
    }

    /**
     * Delete user account permanently
     */
    @DeleteMapping("/account")
    public ResponseEntity<?> deleteAccount() {
        try {
            profileService.deleteAccount();
            return ResponseEntity.ok(new SuccessResponse("Account deleted successfully. Goodbye!"));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse(400, ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(500, "Internal server error"));
        }
    }

    /**
     * Reset all user data (transactions, budgets, goals)
     */
    @PostMapping("/reset-data")
    public ResponseEntity<?> resetAccountData() {
        try {
            profileService.resetAccountData();
            return ResponseEntity.ok(new SuccessResponse("Account data reset successfully"));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse(400, ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(500, "Internal server error"));
        }
    }

    // Helper for uniform error responses
    private ErrorResponse createErrorResponse(int status, String message) {
        return new ErrorResponse(status, message);
    }

    private record ErrorResponse(int status, String message) {}
    
    private record SuccessResponse(String message) {}
}
