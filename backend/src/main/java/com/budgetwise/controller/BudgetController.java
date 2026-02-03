package com.budgetwise.controller;

import com.budgetwise.dto.BudgetRequest;
import com.budgetwise.dto.BudgetResponse;
import com.budgetwise.service.BudgetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {
    private final BudgetService budgetService;

    @PostMapping
    public ResponseEntity<BudgetResponse> createBudget(@RequestBody BudgetRequest request) {
        return ResponseEntity.ok(budgetService.createBudget(request));
    }

    @GetMapping
    public ResponseEntity<List<BudgetResponse>> getAllBudgets() {
        return ResponseEntity.ok(budgetService.getAllBudgets());
    }

    @GetMapping("/current")
    public ResponseEntity<List<BudgetResponse>> getCurrentBudgets() {
        return ResponseEntity.ok(budgetService.getCurrentBudgets());
    }

    @PutMapping("/{id}")
    public ResponseEntity<BudgetResponse> updateBudget(
            @PathVariable Long id,
            @RequestBody BudgetRequest request) {
        return ResponseEntity.ok(budgetService.updateBudget(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBudget(@PathVariable Long id) {
        budgetService.deleteBudget(id);
        return ResponseEntity.ok().build();
    }
}