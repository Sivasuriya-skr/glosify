package com.budgetwise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SettingsResponse {
    private Long id;
    private String language;
    private String currency;
    private String monthlyIncome;
    private String riskTolerance;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
