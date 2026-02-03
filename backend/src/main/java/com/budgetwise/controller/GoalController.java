package com.budgetwise.controller;

import com.budgetwise.dto.GoalRequest;
import com.budgetwise.dto.GoalResponse;
import com.budgetwise.service.GoalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;

    @PostMapping
    public ResponseEntity<GoalResponse> createGoal(@RequestBody GoalRequest request) {
        return ResponseEntity.ok(goalService.createGoal(request));
    }

    @GetMapping
    public ResponseEntity<List<GoalResponse>> getAllGoals() {
        return ResponseEntity.ok(goalService.getUserGoals());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GoalResponse> getGoal(@PathVariable Long id) {
        return ResponseEntity.ok(goalService.getGoalById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GoalResponse> updateGoal(
            @PathVariable Long id,
            @RequestBody GoalRequest request) {
        return ResponseEntity.ok(goalService.updateGoal(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGoal(@PathVariable Long id) {
        goalService.deleteGoal(id);
        return ResponseEntity.noContent().build();
    }
}
