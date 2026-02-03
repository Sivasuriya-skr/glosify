package com.budgetwise.repository;

import com.budgetwise.model.Goal;
import com.budgetwise.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GoalRepository extends JpaRepository<Goal, Long> {
    List<Goal> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Goal> findByUser(User user);
    void deleteByUser(User user);
}
