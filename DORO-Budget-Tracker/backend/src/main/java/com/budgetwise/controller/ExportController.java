package com.budgetwise.controller;

import com.budgetwise.service.ExportImportService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
public class ExportController {

    private final ExportImportService exportImportService;

    @GetMapping("/pdf")
    public ResponseEntity<byte[]> exportToPdf(@RequestParam(defaultValue = "all") String sections) {
        try {
            System.out.println("PDF export requested for sections: " + sections);
            Map<String, Boolean> options = new HashMap<>();
            
            // Parse sections parameter
            if ("all".equalsIgnoreCase(sections)) {
                options.put("transactions", true);
                options.put("budgets", true);
                options.put("goals", true);
            } else {
                String[] sectionArray = sections.split(",");
                for (String section : sectionArray) {
                    options.put(section.trim(), true);
                }
            }
            
            byte[] pdfData = exportImportService.exportData("pdf", options);
            
            String filename = "financial-report-" + 
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")) + ".pdf";
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfData);
        } catch (Exception e) {
            System.err.println("PDF export error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }

    @GetMapping("/csv")
    public ResponseEntity<byte[]> exportToCsv(@RequestParam(defaultValue = "all") String sections) {
        try {
            Map<String, Boolean> options = new HashMap<>();
            
            // Parse sections parameter
            if ("all".equalsIgnoreCase(sections)) {
                options.put("transactions", true);
                options.put("budgets", true);
                options.put("goals", true);
            } else {
                String[] sectionArray = sections.split(",");
                for (String section : sectionArray) {
                    options.put(section.trim(), true);
                }
            }
            
            byte[] csvData = exportImportService.exportData("csv", options);
            
            String filename = "financial-data-" + 
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")) + ".csv";
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                    .contentType(MediaType.parseMediaType("text/csv"))
                    .body(csvData);
        } catch (Exception e) {
            System.err.println("CSV export error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }

    @GetMapping("/json")
    public ResponseEntity<byte[]> exportToJson(@RequestParam(defaultValue = "all") String sections) {
        try {
            Map<String, Boolean> options = new HashMap<>();
            
            // Parse sections parameter
            if ("all".equalsIgnoreCase(sections)) {
                options.put("transactions", true);
                options.put("budgets", true);
                options.put("goals", true);
            } else {
                String[] sectionArray = sections.split(",");
                for (String section : sectionArray) {
                    options.put(section.trim(), true);
                }
            }
            
            byte[] jsonData = exportImportService.exportData("json", options);
            
            String filename = "financial-data-" + 
                LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy")) + ".json";
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(jsonData);
        } catch (Exception e) {
            System.err.println("JSON export error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }

    @PostMapping("/import")
    public ResponseEntity<Map<String, Object>> importData(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "options", required = false) String optionsJson) {
        try {
            System.out.println("Import requested for file: " + file.getOriginalFilename());
            System.out.println("File size: " + file.getSize() + " bytes");
            System.out.println("File content type: " + file.getContentType());
            System.out.println("Options: " + optionsJson);
            
            // Validate file
            if (file.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "File is empty. Please select a valid file to import.");
                return ResponseEntity.status(400).body(errorResponse);
            }
            
            // Validate file extension
            String filename = file.getOriginalFilename();
            if (filename == null || (!filename.endsWith(".csv") && !filename.endsWith(".json") && !filename.endsWith(".pdf"))) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Invalid file format. Please upload a CSV, JSON, or PDF file.");
                return ResponseEntity.status(400).body(errorResponse);
            }
            
            // Parse options from request parameter
            Map<String, Boolean> options = new HashMap<>();
            if (optionsJson != null && !optionsJson.isEmpty()) {
                try {
                    ObjectMapper objectMapper = new ObjectMapper();
                    @SuppressWarnings("unchecked")
                    Map<String, Boolean> parsedOptions = objectMapper.readValue(optionsJson, Map.class);
                    options = parsedOptions;
                    System.out.println("Parsed options: " + options);
                } catch (Exception parseEx) {
                    System.out.println("Failed to parse options, using defaults: " + parseEx.getMessage());
                    options.put("transactions", true);
                    options.put("budgets", true);
                    options.put("goals", true);
                }
            } else {
                // Default: import all
                options.put("transactions", true);
                options.put("budgets", true);
                options.put("goals", true);
            }
            
            // Determine file format from filename
            String format = "json"; // default
            
            if (filename != null) {
                if (filename.endsWith(".csv")) {
                    format = "csv";
                } else if (filename.endsWith(".json")) {
                    format = "json";
                } else if (filename.endsWith(".pdf")) {
                    format = "pdf";
                }
            }
            
            System.out.println("Importing file as format: " + format);
            
            // Call import service (no longer throws exceptions)
            Map<String, Object> result = exportImportService.importData(format, file.getInputStream(), options);
            
            System.out.println("Import result: " + result);
            
            // Check if import was successful
            Boolean success = (Boolean) result.getOrDefault("success", true);
            if (!success) {
                return ResponseEntity.status(400).body(result);
            }
            
            return ResponseEntity.ok().body(result);
        } catch (IllegalArgumentException e) {
            System.err.println("Validation error: " + e.getMessage());
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Validation error: " + e.getMessage());
            
            return ResponseEntity.status(400).body(errorResponse);
        } catch (Exception e) {
            System.err.println("Import error: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Import failed: " + e.getMessage() + ". Please check that the file format matches the export format.");
            
            return ResponseEntity.status(400).body(errorResponse);
        }
    }
}
