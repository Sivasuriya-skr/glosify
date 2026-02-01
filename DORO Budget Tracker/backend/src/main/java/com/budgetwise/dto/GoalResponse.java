package com.budgetwise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GoalResponse {
    private Long id;
    private String goalName;
    private String category;
    private Double targetAmount;
    private Double currentAmount;
    private LocalDate deadline;
    private String priority;
    private LocalDate createdAt;
}
