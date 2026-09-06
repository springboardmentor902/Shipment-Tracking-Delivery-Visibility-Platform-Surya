package com.shiptrack.shiptrack_pro.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "proof_of_deliveries")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProofOfDelivery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "shipment_id", nullable = false, unique = true)
    private Long shipmentId;

    @Column(name = "recipient_name")
    private String recipientName;

    @Column(name = "signature_data", columnDefinition = "TEXT")
    private String signatureData; // Base64 encoded signature image

    @Column(name = "photo_url", columnDefinition = "TEXT")
    private String photoUrl; // Photo URL or Base64 string

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "verification_status")
    private String verificationStatus; // e.g. PENDING, VERIFIED, REJECTED

    @Column(name = "verified_by")
    private Long verifiedBy;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    @Column(name = "verification_notes", columnDefinition = "TEXT")
    private String verificationNotes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
