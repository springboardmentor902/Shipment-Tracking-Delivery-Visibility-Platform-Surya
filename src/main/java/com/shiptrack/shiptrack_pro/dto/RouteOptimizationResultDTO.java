package com.shiptrack.shiptrack_pro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteOptimizationResultDTO {
    private RouteAlternativeDTO selectedRoute;
    private List<RouteAlternativeDTO> alternatives;
    private String selectionReason;
}
