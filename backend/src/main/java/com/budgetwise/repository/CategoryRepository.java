package com.budgetwise.repository;

import com.budgetwise.model.Category;
import com.budgetwise.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    
    List<Category> findByUserOrderByNameAsc(User user);
    
    List<Category> findByUserOrderByCreatedAtAsc(User user);
    
    Optional<Category> findByUserAndName(User user, String name);
    
    boolean existsByUserAndName(User user, String name);
    
    void deleteByUserAndId(User user, Long id);
}
