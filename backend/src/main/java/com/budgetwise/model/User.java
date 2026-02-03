package com.budgetwise.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ Username required and unique
    @Column(name = "username", nullable = false, unique = true)
    private String username;

    // ✅ Email required and unique
    @Column(name = "email", nullable = false, unique = true)
    private String email;

    // ✅ Password required
    @Column(name = "password", nullable = false)
    private String password;

    // ✅ Enum role (ROLE_USER, ROLE_ADMIN)
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role;

    // ✅ Optional field - no NOT NULL constraint
    @Column(name = "profile_image", nullable = true)
    private String profileImage;

    // ✅ Profile fields - all optional
    @Column(name = "full_name", nullable = true)
    private String fullName;

    @Column(name = "occupation", nullable = true)
    private String occupation;

    @Column(name = "address", nullable = true)
    private String address;

    @Column(name = "phone_number", nullable = true)
    private String phoneNumber;

    @Column(name = "date_of_birth", nullable = true)
    private String dateOfBirth;

    @Column(name = "bio", columnDefinition = "TEXT", nullable = true)
    private String bio;

    // ✅ Timestamp fields (nullable for existing users)
    @Column(name = "created_at", nullable = true)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    // ✅ Relationships
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Transaction> transactions;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Budget> budgets;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Post> posts;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Comment> comments;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Like> likes;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    private List<Goal> goals;

    // --- Spring Security implementation ---
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(role.name()));
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }
}
