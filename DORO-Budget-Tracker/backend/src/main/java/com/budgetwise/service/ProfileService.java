package com.budgetwise.service;

import com.budgetwise.dto.UpdateProfileRequest;
import com.budgetwise.dto.UserProfileDTO;
import com.budgetwise.model.User;
import com.budgetwise.repository.UserRepository;
import com.budgetwise.repository.TransactionRepository;
import com.budgetwise.repository.BudgetRepository;
import com.budgetwise.repository.GoalRepository;
import com.budgetwise.repository.PasswordResetTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final GoalRepository goalRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;

    /**
     * Retrieves the currently authenticated user based on the identifier
     * (can be either email or username from the SecurityContext).
     */
    private User getCurrentUser() {
        String identifier = SecurityContextHolder.getContext().getAuthentication().getName();

        return userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier))
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    /**
     * Returns the user's profile details.
     */
    public UserProfileDTO getUserProfile() {
        User user = getCurrentUser();
        return UserProfileDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .occupation(user.getOccupation())
                .address(user.getAddress())
                .phoneNumber(user.getPhoneNumber())
                .dateOfBirth(user.getDateOfBirth())
                .bio(user.getBio())
                .profileImageUrl(user.getProfileImage() != null
                        ? "/api/profile/avatar/" + user.getProfileImage()
                        : null)
                .createdAt(user.getCreatedAt())
                .build();
    }

    /**
     * Updates user profile details such as username or password.
     */
    public UserProfileDTO updateProfile(UpdateProfileRequest request) {
        User user = getCurrentUser();
        log.info("Updating profile for user: {}", user.getId());
        log.info("Request data - fullName: {}, occupation: {}, address: {}", 
                request.getFullName(), request.getOccupation(), request.getAddress());

        // Update username if provided
        if (request.getUsername() != null && !request.getUsername().isEmpty()) {
            if (userRepository.existsByUsername(request.getUsername()) &&
                    !request.getUsername().equals(user.getUsername())) {
                throw new RuntimeException("This username is already taken. Please choose a different one.");
            }
            user.setUsername(request.getUsername());
        }

        // Handle password update
        if (request.getNewPassword() != null && !request.getNewPassword().isEmpty()) {
            if (request.getCurrentPassword() == null ||
                    !passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new RuntimeException("The current password you entered is incorrect.");
            }
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        // Update profile fields
        if (request.getFullName() != null && !request.getFullName().isEmpty()) {
            user.setFullName(request.getFullName());
            log.info("Setting fullName: {}", request.getFullName());
        }
        if (request.getOccupation() != null && !request.getOccupation().isEmpty()) {
            user.setOccupation(request.getOccupation());
            log.info("Setting occupation: {}", request.getOccupation());
        }
        if (request.getAddress() != null && !request.getAddress().isEmpty()) {
            user.setAddress(request.getAddress());
            log.info("Setting address: {}", request.getAddress());
        }
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isEmpty()) {
            user.setPhoneNumber(request.getPhoneNumber());
            log.info("Setting phoneNumber: {}", request.getPhoneNumber());
        }
        if (request.getDateOfBirth() != null && !request.getDateOfBirth().isEmpty()) {
            user.setDateOfBirth(request.getDateOfBirth());
            log.info("Setting dateOfBirth: {}", request.getDateOfBirth());
        }
        if (request.getBio() != null && !request.getBio().isEmpty()) {
            user.setBio(request.getBio());
            log.info("Setting bio: {}", request.getBio());
        }

        user = userRepository.save(user);
        log.info("User profile saved. FullName after save: {}", user.getFullName());

        return UserProfileDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .occupation(user.getOccupation())
                .address(user.getAddress())
                .phoneNumber(user.getPhoneNumber())
                .dateOfBirth(user.getDateOfBirth())
                .bio(user.getBio())
                .profileImageUrl(user.getProfileImage() != null
                        ? "/api/profile/avatar/" + user.getProfileImage()
                        : null)
                .createdAt(user.getCreatedAt())
                .build();
    }

    /**
     * Uploads or updates a user’s profile image.
     */
    public UserProfileDTO uploadProfileImage(MultipartFile file) {
        User user = getCurrentUser();

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("Please select an image to upload.");
        }

        try {
            Path uploadDir = Paths.get("uploads").toAbsolutePath();
            if (!Files.exists(uploadDir)) {
                Files.createDirectories(uploadDir);
            }

            String original = Objects.requireNonNull(file.getOriginalFilename())
                    .replaceAll("[^a-zA-Z0-9.\\-_]", "_");

            String filename = user.getId() + "_" + Instant.now().toEpochMilli() + "_" + original;
            Path target = uploadDir.resolve(filename);
            Files.copy(file.getInputStream(), target);

            user.setProfileImage(filename);
            userRepository.save(user);

            return UserProfileDTO.builder()
                    .id(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .occupation(user.getOccupation())
                    .address(user.getAddress())
                    .phoneNumber(user.getPhoneNumber())
                    .dateOfBirth(user.getDateOfBirth())
                    .bio(user.getBio())
                    .profileImageUrl("/api/profile/avatar/" + filename)
                    .createdAt(user.getCreatedAt())
                    .build();

        } catch (IOException ex) {
            throw new RuntimeException("Unable to save your profile picture. Please try again.");
        }
    }

    /**
     * Deletes the user account and all associated data
     */
    @Transactional
    public void deleteAccount() {
        User user = getCurrentUser();
        log.info("Deleting account for user: {}", user.getId());
        
        try {
            // Delete user profile image if exists
            if (user.getProfileImage() != null) {
                Path imagePath = Paths.get("uploads").resolve(user.getProfileImage());
                try {
                    Files.delete(imagePath);
                } catch (Exception e) {
                    log.warn("Failed to delete profile image: {}", e.getMessage());
                }
            }
            
            // Delete password reset tokens first (foreign key constraint)
            passwordResetTokenRepository.deleteByUser(user);
            log.info("Deleted password reset tokens for user: {}", user.getId());
            
            // Delete user from database (CASCADE will handle related data)
            userRepository.deleteById(user.getId());
            log.info("User account deleted successfully: {}", user.getId());
        } catch (Exception e) {
            log.error("Error deleting account: {}", e.getMessage());
            throw new RuntimeException("Unable to delete your account. Please try again later.");
        }
    }

    /**
     * Resets all user data (transactions, budgets, goals) but keeps the account
     */
    @Transactional
    public void resetAccountData() {
        User user = getCurrentUser();
        log.info("Resetting account data for user: {}", user.getId());
        
        try {
            // Delete all transactions for this user
            transactionRepository.deleteByUser(user);
            log.info("Deleted all transactions for user: {}", user.getId());
            
            // Delete all budgets for this user
            budgetRepository.deleteByUser(user);
            log.info("Deleted all budgets for user: {}", user.getId());
            
            // Delete all goals for this user
            goalRepository.deleteByUser(user);
            log.info("Deleted all goals for user: {}", user.getId());
            
            log.info("Account data reset successfully for user: {}", user.getId());
        } catch (Exception e) {
            log.error("Error resetting account data: {}", e.getMessage());
            throw new RuntimeException("Unable to reset your account data. Please try again later.");
        }
    }
}
