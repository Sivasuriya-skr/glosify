package com.budgetwise.security;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordCheck {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

        String storedHash = "$2a$10$HBUw06CAaxNnN09nmBB3uO4Vp28.xOyC3ONMjtPPBUKFKzIhetyvK";
        String rawPassword = "Vinu@123"; // change to test your password

        boolean matches = encoder.matches(rawPassword, storedHash);

        if (matches) {
            System.out.println("Password matches the stored hash.");
        } else {
            System.out.println("Password does NOT match.");
        }
    }
}
