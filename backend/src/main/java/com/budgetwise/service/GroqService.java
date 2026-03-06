package com.budgetwise.service;

import com.budgetwise.dto.AIInsightRequest;
import com.budgetwise.dto.AIInsightResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.regex.Pattern;

@Slf4j
@Service
public class GroqService {

    private final String apiKey;
    private final String apiUrl;
    private final String model;
    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate;

    public GroqService(
            @Value("${groq.api.key}") String apiKey,
            @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}") String apiUrl,
            @Value("${groq.model:llama3-8b-8192}") String model
    ) {
        this.apiKey = apiKey;
        this.apiUrl = apiUrl;
        this.model = model;
        this.objectMapper = new ObjectMapper();
        this.restTemplate = new RestTemplate();
        log.info("GroqService initialized with model: {}", model);
    }

    public AIInsightResponse generateInsight(AIInsightRequest request) {
        try {
            String cleanContext = decodeHtmlEntities(request.getContext());

            log.info("Generating AI insight for query: {}", request.getQuery());
            log.debug("Financial context: {}", cleanContext);

            AIInsightRequest cleanRequest = new AIInsightRequest();
            cleanRequest.setQuery(request.getQuery());
            cleanRequest.setContext(cleanContext);

            // Predefined responses (no external call needed)
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
            log.info("Sending request to Groq API with model: {}", model);
            long startTime = System.currentTimeMillis();

            // Build messages for Groq (OpenAI-compatible format)
            Map<String, String> systemMsg = new HashMap<>();
            systemMsg.put("role", "system");
            systemMsg.put("content",
                "You are a professional financial advisor for India. " +
                "Always use the ₹ symbol. Provide structured financial analysis.");

            Map<String, String> userMsg = new HashMap<>();
            userMsg.put("role", "user");
            userMsg.put("content", prompt);

            // Build request body
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("messages", List.of(systemMsg, userMsg));
            requestBody.put("max_tokens", 1024);

            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // Call Groq API
            ResponseEntity<Map> response = restTemplate.exchange(
                    apiUrl, HttpMethod.POST, entity, Map.class
            );

            long duration = System.currentTimeMillis() - startTime;
            log.info("Received response from Groq in {}ms", duration);

            if (response.getBody() == null) {
                log.error("Received null response from Groq");
                return AIInsightResponse.builder()
                        .insight("I couldn't get a response from the AI service.")
                        .category("Error")
                        .recommendation("Please try again in a moment.")
                        .build();
            }

            // Extract reply from Groq response
            List<Map> choices = (List<Map>) response.getBody().get("choices");
            Map message = (Map) choices.get(0).get("message");
            String aiRaw = (String) message.get("content");

            log.debug("Raw Groq response length: {}", aiRaw != null ? aiRaw.length() : 0);

            return parseResponse(aiRaw);

        } catch (Exception e) {
            log.error("Error generating AI insight. Error type: {}, Message: {}",
                    e.getClass().getSimpleName(), e.getMessage());

            String fallbackInsight = """
                    **📊 Financial Analysis:**
                    1. Unable to fetch AI analysis right now due to connection issues.
                    2. Your financial data is still being tracked locally.

                    **💡 Recommendations:**
                    1. Track your expenses this week and identify the top 3 categories to cut back.
                    2. Aim to reduce discretionary spending by at least 10% this month.
                    3. Review your budget allocations to ensure they align with your goals.

                    **✅ Action Steps:**
                    1. Check your Groq API key and network connection.
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
            return "I'm your AI financial advisor, specialized only in money matters. " +
                   "Please ask me about budgeting, savings, investments, expenses, or financial planning. " +
                   "How can I help you with your finances today?";
        }

        return null;
    }

    /**
     * Parse raw response string and return AIInsightResponse.
     */
    private AIInsightResponse parseResponse(String aiRaw) {
        try {
            if (aiRaw == null) {
                return AIInsightResponse.builder()
                        .insight("AI analysis completed")
                        .category("General")
                        .recommendation("Review your financial data regularly.")
                        .build();
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
     * Normalize the model output into the exact sections with bold headings and numbered bullets.
     */
    private String normalizeAiOutput(String raw) {
        if (raw == null) return "";

        String text = decodeHtmlEntities(raw).replace("\r", "\n").replace("\t", " ");
        text = text.replaceAll("(?m)^[\\s]*[-–—]\\s+", "* ");
        text = text.replaceAll("(?m)^\\s*•\\s+", "* ");
        text = text.replaceAll("\\s*\\n\\s*\\n\\s*", "\n\n");
        text = text.trim();

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

        if (analysis.isBlank() && recommendations.isBlank() && actions.isBlank()) {
            String[] parts = text.split("\\n\\s*\\n");
            if (parts.length >= 3) {
                analysis = parts[0];
                recommendations = parts[1];
                actions = String.join("\n", Arrays.copyOfRange(parts, 2, parts.length));
            } else {
                analysis = text;
            }
        }

        String cleanAnalysis = ensureHeadingAndBullets("Financial Analysis", analysis);
        String cleanRecommendations = ensureHeadingAndBullets("Recommendations", recommendations);
        String cleanActions = ensureHeadingAndBullets("Action Steps", actions);

        StringBuilder sb = new StringBuilder();
        if (!cleanAnalysis.isBlank()) sb.append(cleanAnalysis.trim()).append("\n\n");
        if (!cleanRecommendations.isBlank()) sb.append(cleanRecommendations.trim()).append("\n\n");
        if (!cleanActions.isBlank()) sb.append(cleanActions.trim());

        return sb.toString().trim();
    }

    private int indexOfRegexCaseInsensitive(String text, String phrase) {
        if (text == null || phrase == null) return -1;
        return text.toLowerCase().indexOf(phrase.toLowerCase());
    }

    private String ensureHeadingAndBullets(String heading, String sectionText) {
        if (sectionText == null) return "";

        String t = sectionText.trim();
        t = t.replaceAll("(?i)^\\*?\\*?[📊💡✅\\s]*" +
                Pattern.quote(heading.toLowerCase()
                        .replace("📊 ", "").replace("💡 ", "").replace("✅ ", "")) +
                "[:\\s]*", "");

        String[] rawLines = t.split("\\n");
        List<String> points = new ArrayList<>();

        for (String line : rawLines) {
            String s = line.trim();
            if (s.isEmpty()) continue;
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
            String[] sentences = s.split("(?<=[.?!])\\s+");
            for (String sent : sentences) {
                String ss = sent.trim();
                if (!ss.isEmpty()) points.add(ss);
            }
        }

        if (points.isEmpty()) return "";
        if (points.size() > 6) points = points.subList(0, 6);

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

    private String extractRecommendationSnippet(String normalized) {
        if (normalized == null) return "";
        int idx = normalized.indexOf("**💡 Recommendations:**");
        if (idx < 0) idx = normalized.indexOf("**Recommendations:**");
        if (idx >= 0) {
            String rest = normalized.substring(idx);
            String[] lines = rest.split("\\n");
            for (String line : lines) {
                line = line.trim();
                if (line.matches("^\\d+\\.\\s+.*")) {
                    return line.replaceFirst("^\\d+\\.\\s+", "").trim();
                }
                if (line.startsWith("* ")) {
                    return line.substring(2).trim();
                }
            }
        }
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
}