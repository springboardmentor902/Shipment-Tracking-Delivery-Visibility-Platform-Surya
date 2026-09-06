package com.shiptrack.shiptrack_pro.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;

@Data
public class RouteRequest {
    @NotBlank(message = "Origin address is required")
    private String originAddress;

    @NotBlank(message = "Destination address is required")
    private String destinationAddress;

    private Long driverId;
}
