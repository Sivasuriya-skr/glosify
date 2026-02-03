package com.budgetwise.service;

import com.budgetwise.dto.SettingsRequest;
import com.budgetwise.dto.SettingsResponse;
import com.budgetwise.model.Settings;
import com.budgetwise.model.User;
import com.budgetwise.repository.SettingsRepository;
import com.budgetwise.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final SettingsRepository settingsRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String identifier = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier))
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    /**
     * Get current user's settings
     */
    public SettingsResponse getSettings() {
        User user = getCurrentUser();
        Settings settings = settingsRepository.findByUser(user)
                .orElseGet(() -> createDefaultSettings(user));
        return mapToResponse(settings);
    }

    /**
     * Update current user's settings
     */
    public SettingsResponse updateSettings(SettingsRequest request) {
        User user = getCurrentUser();
        Settings settings = settingsRepository.findByUser(user)
                .orElseGet(() -> createDefaultSettings(user));

        if (request.getLanguage() != null) {
            settings.setLanguage(request.getLanguage());
        }
        if (request.getCurrency() != null) {
            settings.setCurrency(request.getCurrency());
        }
        if (request.getMonthlyIncome() != null) {
            settings.setMonthlyIncome(request.getMonthlyIncome());
        }
        if (request.getRiskTolerance() != null) {
            settings.setRiskTolerance(request.getRiskTolerance());
        }

        Settings saved = settingsRepository.save(settings);
        return mapToResponse(saved);
    }

    /**
     * Create default settings for a new user
     */
    private Settings createDefaultSettings(User user) {
        Settings settings = Settings.builder()
                .user(user)
                .language("us English")
                .currency("INR (₹) - Indian Rupee")
                .monthlyIncome("100000")
                .riskTolerance("Moderate - Balanced approach to risk and return")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        return settingsRepository.save(settings);
    }

    /**
     * Map Settings entity to SettingsResponse DTO
     */
    private SettingsResponse mapToResponse(Settings settings) {
        return SettingsResponse.builder()
                .id(settings.getId())
                .language(settings.getLanguage())
                .currency(settings.getCurrency())
                .monthlyIncome(settings.getMonthlyIncome())
                .riskTolerance(settings.getRiskTolerance())
                .createdAt(settings.getCreatedAt())
                .updatedAt(settings.getUpdatedAt())
                .build();
    }
}

