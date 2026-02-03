package com.budgetwise.controller;

import com.budgetwise.dto.AIInsightRequest;
import com.budgetwise.dto.AIInsightResponse;
import com.budgetwise.dto.TransactionResponse;
import com.budgetwise.model.User;
import com.budgetwise.service.OllamaService;
import com.budgetwise.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class AIController {

    private final OllamaService ollamaService;
    private final TransactionService transactionService;

    @PostMapping("/insights")
    public ResponseEntity<AIInsightResponse> getAIInsights(
            @RequestBody AIInsightRequest request,
            @AuthenticationPrincipal User user) {
        
        // Get user's financial context
        List<TransactionResponse> transactionResponses = transactionService.getUserTransactions();
        String context = buildFinancialContext(transactionResponses);
        
        request.setContext(context);
        AIInsightResponse response = ollamaService.generateInsight(request);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/spending-analysis")
    public ResponseEntity<AIInsightResponse> getSpendingAnalysis(@AuthenticationPrincipal User user) {
        List<TransactionResponse> transactionResponses = transactionService.getUserTransactions();
        String context = buildFinancialContext(transactionResponses);
        
        AIInsightRequest request = AIInsightRequest.builder()
                .query("Analyze my spending patterns and provide insights")
                .context(context)
                .build();
                
        AIInsightResponse response = ollamaService.generateInsight(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/budget-recommendations")
    public ResponseEntity<AIInsightResponse> getBudgetRecommendations(@AuthenticationPrincipal User user) {
        List<TransactionResponse> transactionResponses = transactionService.getUserTransactions();
        String context = buildFinancialContext(transactionResponses);
        
        AIInsightRequest request = AIInsightRequest.builder()
                .query("Provide budget recommendations based on my spending")
                .context(context)
                .build();
                
        AIInsightResponse response = ollamaService.generateInsight(request);
        return ResponseEntity.ok(response);
    }

    private String buildFinancialContext(List<TransactionResponse> transactions) {
        if (transactions.isEmpty()) {
            return "No transaction data available";
        }

        StringBuilder context = new StringBuilder();
        context.append("FINANCIAL SUMMARY:\n");
        
        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal totalExpenses = BigDecimal.ZERO;
        
        for (TransactionResponse transaction : transactions) {
            if ("INCOME".equalsIgnoreCase(transaction.getType())) {
                totalIncome = totalIncome.add(transaction.getAmount());
            } else if ("EXPENSE".equalsIgnoreCase(transaction.getType())) {
                totalExpenses = totalExpenses.add(transaction.getAmount());
            }
        }
        
        BigDecimal netAmount = totalIncome.subtract(totalExpenses);
        
        context.append(String.format("Total Income: ₹%s\n", totalIncome));
        context.append(String.format("Total Expenses: ₹%s\n", totalExpenses));
        context.append(String.format("Net Balance: ₹%s\n", netAmount));
        
        if (netAmount.compareTo(BigDecimal.ZERO) > 0) {
            context.append("Status: SURPLUS (Income > Expenses)\n");
        } else if (netAmount.compareTo(BigDecimal.ZERO) < 0) {
            context.append("Status: DEFICIT (Expenses > Income)\n");
        } else {
            context.append("Status: BALANCED\n");
        }
        
        context.append("\nTransaction Details:\n");
        for (TransactionResponse transaction : transactions) {
            context.append(String.format("- %s: ₹%s (%s - %s)\n", 
                transaction.getType(), 
                transaction.getAmount(), 
                transaction.getCategory(),
                transaction.getDescription()));
        }
        
        return context.toString();
    }
}
