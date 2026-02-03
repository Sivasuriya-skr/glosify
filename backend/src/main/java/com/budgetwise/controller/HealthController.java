package com.budgetwise.controller;

import com.budgetwise.service.DbHealthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {
    private final DbHealthService dbHealthService;

    @GetMapping("/db")
    public ResponseEntity<Map<String, Object>> checkDb() {
        String err = dbHealthService.checkDatabase();
        if (err == null) {
            return ResponseEntity.ok(Map.of("status", "UP"));
        } else {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of("status", "DOWN", "error", err));
        }
    }
}
