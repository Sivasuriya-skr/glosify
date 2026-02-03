package com.budgetwise.service;

import com.budgetwise.model.PasswordResetToken;
import com.budgetwise.model.User;
import com.budgetwise.repository.PasswordResetTokenRepository;
import com.budgetwise.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {
    
    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    
    @Transactional
    public void createPasswordResetToken(String email) {
        // Find user by email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email address"));
        
        // Delete any existing tokens for this user
        tokenRepository.deleteByUser(user);
        
        // Generate unique token
        String token = UUID.randomUUID().toString();
        
        // Create and save password reset token
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .token(token)
                .user(user)
                .expiryDate(LocalDateTime.now().plusHours(1)) // Valid for 1 hour
                .used(false)
                .build();
        
        tokenRepository.save(resetToken);
        
        // Send email with reset link
        emailService.sendPasswordResetEmail(user.getEmail(), user.getUsername(), token);
        
        log.info("Password reset token created for user: {}", user.getEmail());
    }
    
    @Transactional
    public void resetPassword(String token, String newPassword) {
        // Find token
        PasswordResetToken resetToken = tokenRepository.findByTokenAndUsedFalse(token)
                .orElseThrow(() -> new RuntimeException("This reset link is invalid or has already been used."));
        
        // Check if token is expired
        if (resetToken.isExpired()) {
            throw new RuntimeException("This reset link has expired. Please request a new one.");
        }
        
        // Check if token has been used
        if (resetToken.isUsed()) {
            throw new RuntimeException("This reset link has already been used. Please request a new one.");
        }
        
        // Update user password
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        // Mark token as used
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);
        
        log.info("Password successfully reset for user: {}", user.getEmail());
    }
    
    @Transactional
    public void cleanupExpiredTokens() {
        tokenRepository.deleteByExpiryDateBefore(LocalDateTime.now());
        log.info("Cleaned up expired password reset tokens");
    }
}
