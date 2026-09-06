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
public class PODVerifyRequest {

    @NotBlank(message = "Status is required (VERIFIED or REJECTED)")
    private String status; // VERIFIED or REJECTED

    private String verificationNotes;
}
