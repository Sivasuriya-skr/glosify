package com.budgetwise.repository;

import com.budgetwise.model.PasswordResetToken;
import com.budgetwise.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    
    Optional<PasswordResetToken> findByToken(String token);
    
    List<PasswordResetToken> findByUser(User user);
    
    void deleteByUser(User user);
    
    void deleteByExpiryDateBefore(LocalDateTime now);
    
    Optional<PasswordResetToken> findByTokenAndUsedFalse(String token);
}
