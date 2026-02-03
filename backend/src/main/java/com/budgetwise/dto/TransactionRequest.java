package com.budgetwise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransactionRequest {
    private String description;
    private BigDecimal amount;
    private String category;
    private String type; // INCOME or EXPENSE (case-insensitive)
    private LocalDateTime date;
    private String paymentMethod; // Cash, Card, UPI, etc.
    private String currency; // Currency code or display string
}
