package com.budgetwise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserProfileDTO {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String occupation;
    private String address;
    private String phoneNumber;
    private String dateOfBirth;
    private String bio;
    private String profileImageUrl;
    private LocalDateTime createdAt;
}