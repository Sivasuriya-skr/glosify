package com.budgetwise.service;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class OtpService {

    private final Map<String, OtpData> otpMap = new ConcurrentHashMap<>();
    private final Random random = new Random();
    private static final int OTP_EXPIRY_MINUTES = 10;

    @Data
    @AllArgsConstructor
    private static class OtpData {
        private String code;
        private LocalDateTime expiryTime;
    }

    public String generateOtp(String email) {
        String code = String.format("%06d", random.nextInt(1000000));
        otpMap.put(email, new OtpData(code, LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES)));
        log.info("Generated OTP for {}: {}", email, code);
        return code;
    }

    public boolean verifyOtp(String email, String code) {
        OtpData otpData = otpMap.get(email);
        if (otpData == null) {
            log.warn("No OTP found for {}", email);
            return false;
        }

        if (otpData.getExpiryTime().isBefore(LocalDateTime.now())) {
            log.warn("OTP expired for {}", email);
            otpMap.remove(email);
            return false;
        }

        boolean isValid = otpData.getCode().equals(code);
        if (isValid) {
            otpMap.remove(email); // Remove after successful verification
            log.info("OTP verified successfully for {}", email);
        } else {
            log.warn("Invalid OTP entered for {}", email);
        }
        return isValid;
    }

    public void clearOtp(String email) {
        otpMap.remove(email);
    }
}
