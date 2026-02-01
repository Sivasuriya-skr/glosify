package com.budgetwise.service;

import com.budgetwise.dto.AIInsightRequest;
import com.budgetwise.dto.AIInsightResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

@Slf4j
@Service
public class OllamaService {

    private final WebClient webClient;
    private final String model;
    private final ObjectMapper objectMapper;
    private final int timeout;

    public OllamaService(
            @Value("${ollama.base-url:http://localhost:11434}") String baseUrl,
            @Value("${ollama.model:llama3.2:1b}") String model, // default set to installed model
            @Value("${ollama.timeout:120000}") int timeout
    ) {
        this.model = model;
        this.timeout = timeout;
        this.objectMapper = new ObjectMapper();
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .build();
        log.info("OllamaService initialized with model: {}, timeout: {}ms", model, timeout);
    }

    public AIInsightResponse generateInsight(AIInsightRequest request) {
        try {
            String cleanContext = decodeHtmlEntities(request.getContext());

            log.info("Generating AI insight for query: {}", request.getQuery());
            log.debug("Financial context: {}", cleanContext);

            AIInsightRequest cleanRequest = new AIInsightRequest();
            cleanRequest.setQuery(request.getQuery());
            cleanRequest.setContext(cleanContext);

            // Predefined responses (no external call)
            String predefined = getPredefinedResponse(cleanRequest);
            if (predefined != null) {
                log.info("Using predefined response for query type");
                return AIInsightResponse.builder()
                        .insight(predefined)
                        .category(extractCategory(predefined))
                        .recommendation("Follow the above suggestions for better financial management.")
                        .build();
            }

            String prompt = buildPrompt(cleanRequest);
            log.info("Full prompt sent to Ollama (truncated): {}", prompt.length() > 200 ? prompt.substring(0, 200) + "..." : prompt);

            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "prompt", prompt,
                    "stream", false
            );

            log.info("Sending request to Ollama at: /api/generate with timeout: {}ms", timeout);
            long startTime = System.currentTimeMillis();

            String response = webClient.post()
                    .uri("/api/generate")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofMillis(timeout))
                    .block();

            long duration = System.currentTimeMillis() - startTime;
            log.info("Received response from Ollama in {}ms", duration);

            if (response == null) {
                log.error("Received null response from Ollama");
                return AIInsightResponse.builder()
                        .insight("I couldn't get a response from the AI service.")
                        .category("Error")
                        .recommendation("Please try again in a moment.")
                        .build();
            }

            log.debug("Raw Ollama response length: {}", response.length());

            return parseResponse(response);

        } catch (Exception e) {
            log.error("Error generating AI insight. Error type: {}, Message: {}", e.getClass().getSimpleName(), e.getMessage());
            String errorMsg = e.getMessage() != null ? e.getMessage() : "";
            if (e.getCause() != null && e.getCause().getMessage() != null) {
                errorMsg += " (Cause: " + e.getCause().getMessage() + ")";
            }

            // Return a helpful fallback with structured format
            String fallbackInsight = """
                    **📊 Financial Analysis:**
                    1. Unable to fetch AI analysis right now due to connection issues.
                    2. Your financial data is still being tracked locally.
                    
                    **💡 Recommendations:**
                    1. Track your expenses this week and identify the top 3 categories to cut back.
                    2. Aim to reduce discretionary spending by at least 10% this month.
                    3. Review your budget allocations to ensure they align with your goals.

                    **✅ Action Steps:**
                    1. Check if Ollama AI service is running properly.
                    2. Export transactions and categorize them today.
                    3. Set a simple weekly spending cap and review on Sundays.
                    """;

            return AIInsightResponse.builder()
                    .insight(fallbackInsight)
                    .category("General")
                    .recommendation("Track your expenses this week and identify the top 3 categories to cut back.")
                    .build();
        }
    }

    /**
     * Prompt enforcing bold headings and numbered points.
     */
    private String buildPrompt(AIInsightRequest request) {
        return String.format("""
                SYSTEM INSTRUCTION (READ CAREFULLY):
                You are a professional financial advisor for India. ALWAYS use the ₹ symbol.
                
                OUTPUT MUST FOLLOW EXACTLY and ONLY the format shown below. Do NOT add anything else.

                **📊 Financial Analysis:**
                1. <analysis-point-1>
                2. <analysis-point-2>
                3. <analysis-point-3>

                **💡 Recommendations:**
                1. <recommendation-1 with ₹ amount if applicable>
                2. <recommendation-2 with ₹ amount if applicable>
                3. <recommendation-3 with ₹ amount if applicable>

                **✅ Action Steps:**
                1. <immediate action>
                2. <long-term strategy>

                RULES:
                - Headings must be bold with double asterisks and emoji: **📊 Heading:**
                - Every item MUST be numbered (1. 2. 3.) on a new line.
                - Use these emojis for headings: 📊 for Analysis, 💡 for Recommendations, ✅ for Action Steps.
                - No extra commentary or explanation outside the structure.
                - Keep each point concise (1–2 sentences).
                - If a numeric ₹ amount is unknown, give a recommended range (e.g., "₹1,000–₹3,000").

                User Question: %s
                Financial Data: %s
                """, request.getQuery(), request.getContext());
    }

    private boolean isFinancialQuery(String query) {
        if (query == null) return false;
        String[] financialKeywords = {
                "money", "budget", "save", "saving", "invest", "investment", "expense", "spend", "spending",
                "income", "salary", "financial", "finance", "bank", "loan", "debt", "credit", "fund",
                "sip", "ppf", "fd", "mutual", "stock", "tax", "insurance", "emergency", "retirement",
                "cost", "price", "rupee", "₹", "account", "transaction", "payment", "cash", "wealth",
                "category", "analysis", "plan", "advice", "tip", "help", "manage", "optimize"
        };

        String lower = query.toLowerCase();
        for (String keyword : financialKeywords) {
            if (lower.contains(keyword)) return true;
        }
        return false;
    }

    private String getPredefinedResponse(AIInsightRequest request) {
        String q = request.getQuery();
        if (q == null) return null;
        String query = q.toLowerCase();

        if (query.contains("hi") || query.contains("hello") || query.contains("hey")) {
            return "Hi there! I'm your AI financial advisor. How can I assist you with your finances today?";
        }

        if (!isFinancialQuery(query)) {
            return "I'm your AI financial advisor, specialized only in money matters. Please ask me about budgeting, savings, investments, expenses, or financial planning. How can I help you with your finances today?";
        }

        return null;
    }

    /**
     * Parse raw response (JSON or plain text), normalize it to exact structure, and return AIInsightResponse.
     */
    private AIInsightResponse parseResponse(String response) {
        try {
            String aiRaw;
            try {
                JsonNode jsonNode = objectMapper.readTree(response);
                if (jsonNode.has("response")) {
                    aiRaw = jsonNode.get("response").asText();
                } else if (jsonNode.has("output")) { // some variants
                    aiRaw = jsonNode.get("output").asText();
                } else {
                    aiRaw = response;
                }
            } catch (Exception ex) {
                aiRaw = response;
            }

            log.debug("Raw AI output (pre-normalize): {}", aiRaw);

            String normalized = normalizeAiOutput(aiRaw);

            String shortRec = extractRecommendationSnippet(normalized);

            return AIInsightResponse.builder()
                    .insight(normalized)
                    .category(extractCategory(normalized))
                    .recommendation(shortRec)
                    .build();

        } catch (Exception e) {
            log.error("Error parsing AI response: ", e);
            return AIInsightResponse.builder()
                    .insight("AI analysis completed")
                    .category("General")
                    .recommendation("Review your financial data regularly.")
                    .build();
        }
    }

    /**
     * Normalize the model output into the exact sections with bold headings and * bullets.
     */
    private String normalizeAiOutput(String raw) {
        if (raw == null) return "";

        String text = decodeHtmlEntities(raw).replace("\r", "\n").replace("\t", " ");
        // Convert various bullets to "* "
        text = text.replaceAll("(?m)^[\\s]*[-–—]\\s+", "* ");
        text = text.replaceAll("(?m)^\\s*•\\s+", "* ");
        // Collapse multiple blank lines to two newlines
        text = text.replaceAll("\\s*\\n\\s*\\n\\s*", "\n\n");
        // Ensure consistent spacing
        text = text.trim();

        String lower = text.toLowerCase();
        int aIdx = indexOfRegexCaseInsensitive(text, "financial analysis");
        int rIdx = indexOfRegexCaseInsensitive(text, "recommendations");
        int actIdx = indexOfRegexCaseInsensitive(text, "action steps");

        String analysis = "";
        String recommendations = "";
        String actions = "";

        if (aIdx >= 0) {
            int from = aIdx;
            int to = rIdx >= 0 ? rIdx : (actIdx >= 0 ? actIdx : text.length());
            analysis = text.substring(from, Math.min(to, text.length()));
        }
        if (rIdx >= 0) {
            int from = rIdx;
            int to = actIdx >= 0 ? actIdx : text.length();
            recommendations = text.substring(from, Math.min(to, text.length()));
        }
        if (actIdx >= 0) {
            actions = text.substring(actIdx);
        }

        // If no headings found, attempt heuristic split by double newline
        if (analysis.isBlank() && recommendations.isBlank() && actions.isBlank()) {
            String[] parts = text.split("\\n\\s*\\n");
            if (parts.length >= 3) {
                analysis = parts[0];
                recommendations = parts[1];
                actions = String.join("\n", Arrays.copyOfRange(parts, 2, parts.length));
            } else {
                // fallback: put whole text into analysis
                analysis = text;
            }
        }

        String cleanAnalysis = ensureHeadingAndBullets("Financial Analysis", analysis);
        String cleanRecommendations = ensureHeadingAndBullets("Recommendations", recommendations);
        String cleanActions = ensureHeadingAndBullets("Action Steps", actions);

        StringBuilder sb = new StringBuilder();
        if (!cleanAnalysis.isBlank()) {
            sb.append(cleanAnalysis.trim()).append("\n\n");
        }
        if (!cleanRecommendations.isBlank()) {
            sb.append(cleanRecommendations.trim()).append("\n\n");
        }
        if (!cleanActions.isBlank()) {
            sb.append(cleanActions.trim());
        }

        return sb.toString().trim();
    }

    private int indexOfRegexCaseInsensitive(String text, String phrase) {
        if (text == null || phrase == null) return -1;
        return text.toLowerCase().indexOf(phrase.toLowerCase());
    }

    /**
     * Ensure the section begins with bold heading and contains numbered points.
     * If numbers missing, split into sentences to create numbered points.
     */
    private String ensureHeadingAndBullets(String heading, String sectionText) {
        if (sectionText == null) return "";

        String t = sectionText.trim();
        // Remove any leading header variants (including emojis)
        t = t.replaceAll("(?i)^\\*?\\*?[📊💡✅\\s]*" + Pattern.quote(heading.toLowerCase().replace("📊 ", "").replace("💡 ", "").replace("✅ ", "")) + "[:\\s]*", "");
        // Split into lines and convert to numbered points
        String[] rawLines = t.split("\\n");
        List<String> points = new ArrayList<>();

        for (String line : rawLines) {
            String s = line.trim();
            if (s.isEmpty()) continue;
            // Handle existing numbered points (1. 2. 3.)
            if (s.matches("^\\d+\\.\\s+.*")) {
                points.add(s.replaceFirst("^\\d+\\.\\s+", "").trim());
                continue;
            }
            if (s.startsWith("* ")) {
                points.add(s.substring(2).trim());
                continue;
            }
            if (s.matches("^[\\-•–—]\\s+.*")) {
                points.add(s.replaceFirst("^[\\-•–—]\\s+", "").trim());
                continue;
            }
            // split sentences if line is long
            String[] sentences = s.split("(?<=[.?!])\\s+");
            for (String sent : sentences) {
                String ss = sent.trim();
                if (!ss.isEmpty()) points.add(ss);
            }
        }

        if (points.isEmpty()) return "";

        // limit points to 6 to avoid overly long responses
        if (points.size() > 6) points = points.subList(0, 6);

        // Add emoji based on heading type
        String emoji = heading.contains("Analysis") ? "📊 " : 
                       heading.contains("Recommendation") ? "💡 " : 
                       heading.contains("Action") ? "✅ " : "";

        StringBuilder out = new StringBuilder();
        out.append("**").append(emoji).append(heading).append(":**").append("\n");
        int num = 1;
        for (String p : points) {
            out.append(num++).append(". ").append(p.trim()).append("\n");
        }
        return out.toString().trim();
    }

    /**
     * Extract a short recommendation snippet (first recommendation point).
     */
    private String extractRecommendationSnippet(String normalized) {
        if (normalized == null) return "";
        int idx = normalized.indexOf("**💡 Recommendations:**");
        if (idx < 0) idx = normalized.indexOf("**Recommendations:**");
        if (idx >= 0) {
            String rest = normalized.substring(idx);
            String[] lines = rest.split("\\n");
            for (String line : lines) {
                line = line.trim();
                // Handle numbered points (1. 2. 3.)
                if (line.matches("^\\d+\\.\\s+.*")) {
                    return line.replaceFirst("^\\d+\\.\\s+", "").trim();
                }
                if (line.startsWith("* ")) {
                    return line.substring(2).trim();
                }
            }
        }
        // fallback
        String plain = normalized.replaceAll("\\n", " ");
        return plain.length() > 120 ? plain.substring(0, 117) + "..." : plain;
    }

    private String extractCategory(String response) {
        if (response == null) return "General";
        String lower = response.toLowerCase();
        if (lower.contains("saving") || lower.contains("save")) return "Saving";
        if (lower.contains("spending") || lower.contains("expense")) return "Spending";
        if (lower.contains("budget")) return "Budget";
        if (lower.contains("invest") || lower.contains("sip") || lower.contains("ppf")) return "Investment";
        if (lower.contains("debt") || lower.contains("loan")) return "Debt Management";
        return "General";
    }

    private String decodeHtmlEntities(String text) {
        if (text == null) return null;

        return text
                .replace("&gt;", ">")
                .replace("&lt;", "<")
                .replace("&amp;", "&")
                .replace("&quot;", "\"")
                .replace("&apos;", "'")
                .replace("&nbsp;", " ")
                .replace("&#39;", "'")
                .replace("&#x27;", "'")
                .replace("&#34;", "\"")
                .replace("&#x22;", "\"")
                .replace("&#38;", "&")
                .replace("&#60;", "<")
                .replace("&#62;", ">")
                .replace("&#8217;", "'")
                .replace("&#8220;", "\"")
                .replace("&#8221;", "\"")
                .replace("&#8230;", "...");
    }

    private String[] splitResponse(String response) {
        response = decodeHtmlEntities(response);

        if (response.length() > 50) {
            return new String[]{
                    response.trim(),
                    "Review and implement these financial strategies for better money management."
            };
        }

        return new String[]{
                response.trim(),
                "Consider these suggestions for improved financial health."
        };
    }
}
