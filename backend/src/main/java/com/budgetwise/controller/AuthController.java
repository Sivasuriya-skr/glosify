package com.budgetwise.controller;

import com.budgetwise.dto.AuthRequest;
import com.budgetwise.dto.AuthResponse;
import com.budgetwise.dto.RegisterRequest;
import com.budgetwise.service.AuthService;
import com.budgetwise.service.PasswordResetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // ✅ Allow React frontend or any other client
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;

    // ---------------- REGISTER ----------------
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } 
        catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new AuthResponse(null, null, null, "Registration failed: " + ex.getMessage()));
        } 
        catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new AuthResponse(null, null, null, "Unexpected error: " + ex.getMessage()));
        }
    }

    // ---------------- LOGIN (email or username) ----------------
    @PostMapping("/login")
    public ResponseEntity<?> authenticate(@RequestBody AuthRequest request) {
        try {
            AuthResponse response = authService.authenticate(request);
            return ResponseEntity.ok(response);
        } 
        catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AuthResponse(null, null, null, "Login failed: " + ex.getMessage()));
        } 
        catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new AuthResponse(null, null, null, "Unexpected error: " + ex.getMessage()));
        }
    }

    // ---------------- LOGOUT ----------------
    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new AuthResponse(null, null, null, "No valid token provided"));
            }

            String token = authHeader.substring(7);
            authService.logout(token);

            return ResponseEntity.ok(
                    new AuthResponse(null, null, null, "Logout successful")
            );

        } 
        catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new AuthResponse(null, null, null, "Logout failed: " + ex.getMessage()));
        }
    }

    // ---------------- FORGOT PASSWORD ----------------
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Email is required"));
            }

            passwordResetService.createPasswordResetToken(email);
            
            return ResponseEntity.ok(
                    Map.of("success", true, "message", "Password reset link sent to your email")
            );

        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Failed to process request"));
        }
    }

    // ---------------- RESET PASSWORD ----------------
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            String newPassword = request.get("newPassword");

            if (token == null || newPassword == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Token and new password are required"));
            }

            passwordResetService.resetPassword(token, newPassword);
            
            return ResponseEntity.ok(
                    Map.of("success", true, "message", "Password reset successful")
            );

        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Failed to reset password"));
        }
    }
    // ---------------- SEND OTP ----------------
    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("success", false, "message", "Email is required"));
            }

            authService.sendOtp(email);
            
            return ResponseEntity.ok(
                    Map.of("success", true, "message", "Verification code sent to your email")
            );

        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("success", false, "message", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Failed to send verification code"));
        }
    }
}
