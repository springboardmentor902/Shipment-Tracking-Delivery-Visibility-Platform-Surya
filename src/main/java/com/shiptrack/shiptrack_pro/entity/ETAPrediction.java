package com.shiptrack.shiptrack_pro.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "eta_predictions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ETAPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "shipment_id", nullable = false)
    private Long shipmentId;

    @Column(name = "predicted_delivery_time")
    private LocalDateTime predictedDeliveryTime;

    @Column(name = "delay_risk_score")
    private Integer delayRiskScore; // 0-10, higher = higher risk

    @Column(name = "confidence_score")
    private Integer confidenceScore; // 0-100%

    @Column(name = "factors", columnDefinition = "text")
    private String factors; // JSON string

    @CreationTimestamp
    @Column(name = "calculated_at", updatable = false)
    private LocalDateTime calculatedAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
