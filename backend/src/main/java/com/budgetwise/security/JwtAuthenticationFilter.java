package com.budgetwise.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Intercepts every incoming request and validates JWT if present.
 * Ensures authenticated context is set for all secured endpoints (GET, POST, PUT, DELETE).
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        // Log every incoming request for debugging
        System.out.println("Incoming request: " + request.getMethod() + " " + request.getRequestURI());

        // If no JWT header or malformed, move forward without authentication
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7).trim();

        try {
            // Extract username/email from token
            final String identifier = jwtTokenProvider.extractUsername(jwt);

            if (identifier != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UserDetails userDetails = customUserDetailsService.loadUserByUsername(identifier);

                // Validate JWT signature and expiration
                if (jwtTokenProvider.validateToken(jwt, userDetails)) {
                    UsernamePasswordAuthenticationToken authToken =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );

                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);

                    System.out.println("Authenticated user: " + identifier);
                } else {
                    System.out.println("Invalid or expired JWT for: " + identifier);
                }
            }

        } catch (Exception ex) {
            System.out.println("JWT processing error: " + ex.getMessage());
        }

        // Continue to next filter or controller
        filterChain.doFilter(request, response);
    }
}
