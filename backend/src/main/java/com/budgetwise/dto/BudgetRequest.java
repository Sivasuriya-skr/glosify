package com.budgetwise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BudgetRequest {
    private String category;
    private BigDecimal amount;
    private LocalDate startDate;
    private LocalDate endDate;
}