package com.budgetwise.repository;

import com.budgetwise.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    //  Find user by email (used for login)
    Optional<User> findByEmail(String email);

    //  Find user by username (used for login and profile fetch)
    Optional<User> findByUsername(String username);

    //  Check duplicates during registration
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
}
