package com.budgetwise.service;

import com.budgetwise.dto.TransactionRequest;
import com.budgetwise.dto.TransactionResponse;
import com.budgetwise.model.Transaction;
import com.budgetwise.model.User;
import com.budgetwise.repository.TransactionRepository;
import com.budgetwise.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String identifier = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(identifier)
                .or(() -> userRepository.findByEmail(identifier))
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public TransactionResponse createTransaction(TransactionRequest request) {
        User user = getCurrentUser();

        Transaction transaction = Transaction.builder()
                .description(request.getDescription())
                .amount(request.getAmount())
                .category(request.getCategory())
                .paymentMethod(request.getPaymentMethod())
                .date(request.getDate())
                .type(request.getType())
                .currency(request.getCurrency())
                .user(user)
                .build();

        transaction = transactionRepository.save(transaction);
        return mapToResponse(transaction);
    }

    public TransactionResponse updateTransaction(Long id, TransactionRequest request) {
        User user = getCurrentUser();
        Transaction txn = transactionRepository.findById(id)
                .filter(t -> t.getUser().equals(user))
                .orElseThrow(() -> new RuntimeException("Transaction not found or unauthorized"));

        txn.setDescription(request.getDescription());
        txn.setAmount(request.getAmount());
        txn.setCategory(request.getCategory());
        txn.setType(request.getType());
        txn.setDate(request.getDate());
        txn.setPaymentMethod(request.getPaymentMethod());
        txn.setCurrency(request.getCurrency());

        Transaction updated = transactionRepository.save(txn);
        return mapToResponse(updated);
    }

    public void deleteTransaction(Long id) {
        User user = getCurrentUser();
        Transaction txn = transactionRepository.findById(id)
                .filter(t -> t.getUser().equals(user))
                .orElseThrow(() -> new RuntimeException("Transaction not found or unauthorized"));
        transactionRepository.delete(txn);
    }

    public List<TransactionResponse> getUserTransactions() {
        User user = getCurrentUser();
        return transactionRepository.findByUser(user)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<TransactionResponse> getTransactionsByDateRange(LocalDateTime start, LocalDateTime end) {
        User user = getCurrentUser();
        return transactionRepository.findByUserAndDateBetween(user, start, end)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private TransactionResponse mapToResponse(Transaction transaction) {
        return TransactionResponse.builder()
                .id(transaction.getId())
                .description(transaction.getDescription())
                .amount(transaction.getAmount())
                .category(transaction.getCategory())
                .paymentMethod(transaction.getPaymentMethod())
                .date(transaction.getDate())
                .type(transaction.getType())
                .currency(transaction.getCurrency())
                .build();
    }
}
