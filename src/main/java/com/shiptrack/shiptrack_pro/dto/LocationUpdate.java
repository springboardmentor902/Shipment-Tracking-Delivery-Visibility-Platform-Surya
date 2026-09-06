package com.shiptrack.shiptrack_pro.dto;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

@Data
public class LocationUpdate {
    @NotNull(message = "Latitude is required")
    private Double latitude;

    @NotNull(message = "Longitude is required")
    private Double longitude;
}
