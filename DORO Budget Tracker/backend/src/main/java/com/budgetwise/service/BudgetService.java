package com.budgetwise.service;

import com.budgetwise.dto.BudgetRequest;
import com.budgetwise.dto.BudgetResponse;
import com.budgetwise.model.Budget;
import com.budgetwise.model.User;
import com.budgetwise.repository.BudgetRepository;
import com.budgetwise.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BudgetService {
    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String identifier = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier))
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public BudgetResponse createBudget(BudgetRequest request) {
        User user = getCurrentUser();

        Budget budget = Budget.builder()
                .category(request.getCategory())
                .amount(request.getAmount())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .user(user)
                .build();

        budget = budgetRepository.save(budget);
        return mapToResponse(budget);
    }

    public List<BudgetResponse> getAllBudgets() {
        User user = getCurrentUser();
        return budgetRepository.findByUser(user)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<BudgetResponse> getCurrentBudgets() {
        User user = getCurrentUser();
        LocalDate now = LocalDate.now();
        return budgetRepository.findByUserAndStartDateLessThanEqualAndEndDateGreaterThanEqual(user, now, now)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public BudgetResponse updateBudget(Long budgetId, BudgetRequest request) {
        User user = getCurrentUser();
        Budget budget = budgetRepository.findById(budgetId)
                .orElseThrow(() -> new RuntimeException("Budget not found. It may have been deleted."));

        if (!budget.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You don't have permission to edit this budget.");
        }

        budget.setCategory(request.getCategory());
        budget.setAmount(request.getAmount());
        budget.setStartDate(request.getStartDate());
        budget.setEndDate(request.getEndDate());

        budget = budgetRepository.save(budget);
        return mapToResponse(budget);
    }

    public void deleteBudget(Long budgetId) {
        User user = getCurrentUser();
        Budget budget = budgetRepository.findById(budgetId)
                .orElseThrow(() -> new RuntimeException("Budget not found. It may have been deleted."));

        if (!budget.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("You don't have permission to delete this budget.");
        }

        budgetRepository.delete(budget);
    }

    private BudgetResponse mapToResponse(Budget budget) {
        return BudgetResponse.builder()
                .id(budget.getId())
                .category(budget.getCategory())
                .amount(budget.getAmount())
                .startDate(budget.getStartDate())
                .endDate(budget.getEndDate())
                .build();
    }
}