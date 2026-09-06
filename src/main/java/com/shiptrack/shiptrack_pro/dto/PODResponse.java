package com.shiptrack.shiptrack_pro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PODResponse {
    private Long id;
    private Long shipmentId;
    private String recipientName;
    private String signatureData;
    private String photoUrl;
    private String notes;
    private String verificationStatus;
    private Long verifiedBy;
    private LocalDateTime verifiedAt;
    private String verificationNotes;
    private LocalDateTime createdAt;
}
