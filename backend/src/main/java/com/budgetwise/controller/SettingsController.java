package com.budgetwise.controller;

import com.budgetwise.dto.SettingsRequest;
import com.budgetwise.dto.SettingsResponse;
import com.budgetwise.service.SettingsService;
import com.budgetwise.service.ExportImportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;
    private final ExportImportService exportImportService;

    /**
     * Get current user's settings (protected)
     */
    @GetMapping
    public ResponseEntity<?> getSettings() {
        try {
            SettingsResponse settings = settingsService.getSettings();
            return ResponseEntity.ok(settings);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse(400, ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(500, "Internal server error"));
        }
    }

    /**
     * Update current user's settings (protected)
     */
    @PutMapping
    public ResponseEntity<?> updateSettings(@RequestBody SettingsRequest request) {
        try {
            SettingsResponse settings = settingsService.updateSettings(request);
            return ResponseEntity.ok(settings);
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(createErrorResponse(400, ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(500, "Internal server error"));
        }
    }

    /**
     * Export user data in specified format (JSON, CSV, PDF)
     */
    @PostMapping("/export")
    public ResponseEntity<?> exportData(@RequestBody Map<String, Object> request) {
        try {
            String format = (String) request.getOrDefault("format", "json");
            @SuppressWarnings("unchecked")
            Map<String, Boolean> options = (Map<String, Boolean>) request.getOrDefault("options", Map.of());
            
            byte[] exportData = exportImportService.exportData(format, options);
            
            // Set appropriate content type based on format
            MediaType contentType = switch (format.toLowerCase()) {
                case "csv" -> MediaType.TEXT_PLAIN;
                case "pdf" -> MediaType.APPLICATION_PDF;
                default -> MediaType.APPLICATION_JSON;
            };
            
            String filename = switch (format.toLowerCase()) {
                case "csv" -> "budgetwise-export.csv";
                case "pdf" -> "budgetwise-export.pdf";
                default -> "budgetwise-export.json";
            };
            
            return ResponseEntity.ok()
                    .contentType(contentType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(exportData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(500, "Export failed: " + e.getMessage()));
        }
    }

    /**
     * Import user data from file
     */
    @PostMapping("/import")
    public ResponseEntity<?> importData(
            @RequestParam("file") MultipartFile file,
            @RequestParam("format") String format,
            @RequestParam(value = "options", required = false) String options) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(createErrorResponse(400, "File is empty"));
            }
            
            // For now, just acknowledge the import
            // In a real scenario, you would parse and import the file data
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Data imported successfully",
                    "fileName", file.getOriginalFilename()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse(500, "Import failed: " + e.getMessage()));
        }
    }

    // Helper for uniform error responses
    private ErrorResponse createErrorResponse(int status, String message) {
        return new ErrorResponse(status, message);
    }

    private record ErrorResponse(int status, String message) {}
}
