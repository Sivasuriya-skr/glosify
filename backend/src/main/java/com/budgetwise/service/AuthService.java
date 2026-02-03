package com.budgetwise.service;

import com.budgetwise.dto.AuthRequest;
import com.budgetwise.dto.AuthResponse;
import com.budgetwise.dto.RegisterRequest;
import com.budgetwise.model.Role;
import com.budgetwise.model.User;
import com.budgetwise.repository.UserRepository;
import com.budgetwise.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final OtpService otpService;
    private final EmailService emailService;

    // ---------------- REGISTER ----------------
    public AuthResponse register(RegisterRequest request) {

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new RuntimeException("Passwords don't match. Please make sure both passwords are the same.");
        }

        if (request.getOtp() == null || request.getOtp().trim().isEmpty()) {
            throw new RuntimeException("Email verification code is required.");
        }

        if (!otpService.verifyOtp(request.getEmail(), request.getOtp())) {
            throw new RuntimeException("Invalid or expired verification code. Please try again.");
        }

        if (request.getCaptchaValue() == null || request.getCaptchaValue().trim().isEmpty()) {
            throw new RuntimeException("Please complete the captcha verification.");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("An account with this email already exists. Please use a different email or try logging in.");
        }

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("This username is already taken. Please choose a different one.");
        }

        // Create new user without profile image
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.ROLE_USER);

        userRepository.save(user);

        var token = jwtTokenProvider.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .username(user.getUsername())
                .message("Registration successful")
                .build();
    }

    // ---------------- LOGIN ----------------
    public AuthResponse authenticate(AuthRequest request) {
        var userOpt = userRepository.findByEmail(request.getEmailOrUsername())
                .or(() -> userRepository.findByUsername(request.getEmailOrUsername()));

        var user = userOpt.orElseThrow(() -> new RuntimeException("No account found with this email or username."));

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getEmail(), request.getPassword())
        );

        var token = jwtTokenProvider.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .username(user.getUsername())
                .message("Login successful")
                .build();
    }

    // ---------------- OTP ----------------
    public void sendOtp(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new RuntimeException("An account with this email already exists.");
        }
        String otp = otpService.generateOtp(email);
        emailService.sendVerificationOtpEmail(email, otp);
    }

    // ---------------- LOGOUT ----------------
    public void logout(String token) {
        System.out.println("User logged out successfully with token: " + token);
    }
}
