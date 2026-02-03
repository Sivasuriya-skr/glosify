package com.budgetwise.repository;

import com.budgetwise.model.Settings;
import com.budgetwise.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SettingsRepository extends JpaRepository<Settings, Long> {
    Optional<Settings> findByUser(User user);
    Optional<Settings> findByUserId(Long userId);
}
