package com.shiptrack.shiptrack_pro.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PODRequest {

    @NotBlank(message = "Recipient name is required")
    private String recipientName;

    private String signatureData; // Base64 encoded signature SVG/PNG
    private String photoUrl;       // Photo URL or Base64 string
    private String notes;
}
