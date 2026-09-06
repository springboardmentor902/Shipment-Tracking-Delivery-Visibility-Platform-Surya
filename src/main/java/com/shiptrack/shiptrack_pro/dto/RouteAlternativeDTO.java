package com.shiptrack.shiptrack_pro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteAlternativeDTO {
    private String summary;
    private Double distanceKm;
    private Integer durationMinutes;
    private Integer trafficDurationMinutes;
    private String trafficCondition;
}
