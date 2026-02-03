package com.budgetwise.repository;

import com.budgetwise.model.Transaction;
import com.budgetwise.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByUser(User user);
    List<Transaction> findByUserAndDateBetween(User user, LocalDateTime start, LocalDateTime end);
    List<Transaction> findByUserAndCategory(User user, String category);
    void deleteByUser(User user);
}