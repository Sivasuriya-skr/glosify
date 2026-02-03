package com.budgetwise.service;

import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DbHealthService {
    private final JdbcTemplate jdbcTemplate;

    /**
     * Returns null if healthy, or an error message if not healthy.
     */
    public String checkDatabase() {
        try {
            // A lightweight query to verify connectivity
            Integer result = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            if (result != null && result == 1) {
                return null; // healthy
            }
            return "Unexpected response from database: " + result;
        } catch (DataAccessException ex) {
            return ex.getMessage();
        }
    }
}
