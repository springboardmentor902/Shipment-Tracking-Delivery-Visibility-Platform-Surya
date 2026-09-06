package com.shiptrack.shiptrack_pro.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteResponse {
    private Long id;
    private Long shipmentId;
    private String originAddress;
    private Double originLatitude;
    private Double originLongitude;
    private String destinationAddress;
    private Double destinationLatitude;
    private Double destinationLongitude;
    private Double distanceKm;
    private Integer estimatedTimeMinutes;
    private Integer actualTimeMinutes;
    private String trafficCondition;
    private String waypoints;
    private Long driverId;
    private Double currentLatitude;
    private Double currentLongitude;
    private LocalDateTime locationUpdatedAt;
    private String status;
    private Boolean isCurrent;
    private String selectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
