package com.budgetwise.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateProfileRequest {
    private String username;
    private String currentPassword;
    private String newPassword;
    private String fullName;
    private String occupation;
    private String address;
    private String phoneNumber;
    private String dateOfBirth;
    private String bio;
}