package com.shiptrack.shiptrack_pro.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PackageResponse {
    private Long id;
    private Long shipmentId;
    private String description;
    private BigDecimal weight;
    private BigDecimal length;
    private BigDecimal width;
    private BigDecimal height;
    private Integer quantity;
    private BigDecimal declaredValue;
    private Boolean fragile;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
