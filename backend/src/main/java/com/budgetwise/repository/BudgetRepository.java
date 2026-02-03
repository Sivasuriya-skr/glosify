package com.budgetwise.repository;

import com.budgetwise.model.Budget;
import com.budgetwise.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface BudgetRepository extends JpaRepository<Budget, Long> {
    List<Budget> findByUser(User user);
    List<Budget> findByUserAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
            User user, LocalDate currentDate, LocalDate currentDate2);
    List<Budget> findByUserAndCategory(User user, String category);
    void deleteByUser(User user);
}