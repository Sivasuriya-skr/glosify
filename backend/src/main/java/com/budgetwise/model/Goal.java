package com.budgetwise.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "goals")
public class Goal {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "goal_name", nullable = false)
    private String goalName;
    
    @Column(name = "category", nullable = false)
    private String category;
    
    @Column(name = "target_amount", nullable = false)
    private Double targetAmount;
    
    @Column(name = "current_amount", nullable = false)
    private Double currentAmount = 0.0;
    
    @Column(name = "deadline")
    private LocalDate deadline;
    
    @Column(name = "priority")
    private String priority;
    
    @Column(name = "created_at", nullable = false)
    private LocalDate createdAt;
    
    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
