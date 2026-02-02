package com.budgetwise.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import java.io.UnsupportedEncodingException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    
    private final JavaMailSender mailSender;
    
    @Value("${app.name:BudgetWise}")
    private String appName;
    
    @Value("${app.support-email:support@budgetwise.com}")
    private String supportEmail;
    
    @Value("${app.base-url:http://localhost:3000}")
    private String baseUrl;
    
    public void sendPasswordResetEmail(String toEmail, String username, String resetToken) {
        try {
            if (toEmail == null || toEmail.isEmpty()) {
                throw new IllegalArgumentException("Email address cannot be null or empty");
            }
            if (resetToken == null || resetToken.isEmpty()) {
                throw new IllegalArgumentException("Reset token cannot be null or empty");
            }
            
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(supportEmail != null ? supportEmail : "noreply@budgetwise.com", appName != null ? appName : "DORO Budget Tracker");
            helper.setTo(toEmail);
            helper.setSubject((appName != null ? appName : "BudgetWise") + " - Password Reset Request");
            
            String resetLink = (baseUrl != null ? baseUrl : "http://localhost:3000") + "/reset-password?token=" + resetToken;
            
            String emailContent = buildPasswordResetEmail(username != null ? username : "User", resetLink);
            helper.setText(emailContent, true);
            
            mailSender.send(message);
            log.info("Password reset email sent successfully to: {}", toEmail);
            
        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("Failed to send password reset email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send password reset email", e);
        }
    }
    
    public void sendVerificationOtpEmail(String toEmail, String otp) {
        try {
            if (toEmail == null || toEmail.isEmpty()) {
                throw new IllegalArgumentException("Email address cannot be null or empty");
            }
            if (otp == null || otp.isEmpty()) {
                throw new IllegalArgumentException("OTP cannot be null or empty");
            }
            
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(supportEmail != null ? supportEmail : "noreply@budgetwise.com", appName != null ? appName : "DORO Budget Tracker");
            helper.setTo(toEmail);
            helper.setSubject((appName != null ? appName : "BudgetWise") + " - Email Verification Code");
            
            String emailContent = buildOtpEmail(otp);
            helper.setText(emailContent, true);
            
            mailSender.send(message);
            log.info("Verification OTP email sent successfully to: {}", toEmail);
            
        } catch (MessagingException | UnsupportedEncodingException e) {
            log.error("Failed to send verification OTP email to: {}", toEmail, e);
            throw new RuntimeException("Failed to send verification OTP email", e);
        }
    }
    
    private String buildOtpEmail(String otp) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            background-color: #f4f4f4;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            max-width: 600px;
                            margin: 20px auto;
                            background-color: #ffffff;
                            border-radius: 12px;
                            overflow: hidden;
                            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                        }
                        .header {
                            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                            color: #ffffff;
                            padding: 40px 20px;
                            text-align: center;
                        }
                        .header h1 {
                            margin: 0;
                            font-size: 32px;
                            letter-spacing: -1px;
                        }
                        .content {
                            padding: 40px;
                            color: #1f2937;
                            text-align: center;
                        }
                        .otp-container {
                            background-color: #f3f4f6;
                            border-radius: 12px;
                            padding: 24px;
                            margin: 32px 0;
                            border: 2px dashed #e5e7eb;
                        }
                        .otp-code {
                            font-size: 48px;
                            font-weight: 800;
                            color: #4f46e5;
                            letter-spacing: 12px;
                            margin: 0;
                            font-family: 'Monaco', 'Consolas', monospace;
                        }
                        .footer {
                            background-color: #f9fafb;
                            padding: 24px;
                            text-align: center;
                            color: #6b7280;
                            font-size: 14px;
                        }
                        .warning {
                            color: #ef4444;
                            font-size: 13px;
                            margin-top: 24px;
                            font-style: italic;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>""" + appName + """
                </h1>
                            <p style="margin-top: 10px; opacity: 0.9;">Verify your email address</p>
                        </div>
                        <div class="content">
                            <h2 style="margin-top: 0;">Verification Code</h2>
                            <p>Please use the following 6-digit code to complete your verification. This code will expire in 10 minutes.</p>
                            
                            <div class="otp-container">
                                <p class="otp-code">""" + otp + """
                </p>
                            </div>
                            
                            <p>If you didn't request this, you can safely ignore this email.</p>
                            
                            <div class="warning">
                                <strong>Important:</strong> Never share this code with anyone.
                            </div>
                        </div>
                        <div class="footer">
                            <p>© 2025 """ + appName + """
                . All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
                """;
    }

    private String buildPasswordResetEmail(String username, String resetLink) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            background-color: #f4f4f4;
                            margin: 0;
                            padding: 0;
                        }
                        .container {
                            max-width: 600px;
                            margin: 20px auto;
                            background-color: #ffffff;
                            border-radius: 10px;
                            overflow: hidden;
                            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                        }
                        .header {
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: #ffffff;
                            padding: 30px;
                            text-align: center;
                        }
                        .header h1 {
                            margin: 0;
                            font-size: 28px;
                        }
                        .content {
                            padding: 40px 30px;
                            color: #333333;
                        }
                        .content h2 {
                            color: #667eea;
                            margin-top: 0;
                        }
                        .content p {
                            line-height: 1.6;
                            margin: 15px 0;
                        }
                        .button {
                            display: inline-block;
                            padding: 14px 30px;
                            margin: 20px 0;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: #ffffff !important;
                            text-decoration: none;
                            border-radius: 8px;
                            font-weight: bold;
                            text-align: center;
                        }
                        .button:hover {
                            background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
                        }
                        .footer {
                            background-color: #f8f9fa;
                            padding: 20px;
                            text-align: center;
                            color: #6c757d;
                            font-size: 12px;
                        }
                        .warning {
                            background-color: #fff3cd;
                            border-left: 4px solid #ffc107;
                            padding: 15px;
                            margin: 20px 0;
                            border-radius: 4px;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔐 """ + appName + """
                </h1>
                        </div>
                        <div class="content">
                            <h2>Hello """ + username + """
                ,</h2>
                            <p>We received a request to reset your password. Click the button below to create a new password:</p>
                            
                            <div style="text-align: center;">
                                <a href='""" + resetLink + """
                ' class="button">Reset Password</a>
                            </div>
                            
                            <div class="warning">
                                <strong>⚠️ Security Notice:</strong>
                                <p style="margin: 5px 0 0 0;">This link will expire in 1 hour for security reasons. If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
                            </div>
                            
                            <p style="margin-top: 30px; color: #6c757d; font-size: 13px;">
                                If the button doesn't work, copy and paste this link into your browser:<br>
                                <a href='""" + resetLink + """
                ' style="color: #667eea; word-break: break-all;">""" + resetLink + """
                </a>
                            </p>
                        </div>
                        <div class="footer">
                            <p>© 2025 """ + appName + """
                . All rights reserved.</p>
                            <p>This is an automated email. Please do not reply to this message.</p>
                        </div>
                    </div>
                </body>
                </html>
                """;
    }
}
