package com.shiptrack.shiptrack_pro.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class PackageRequest {
    private String description;
    private BigDecimal weight;
    private BigDecimal length;
    private BigDecimal width;
    private BigDecimal height;
    private Integer quantity;
    private BigDecimal declaredValue;
    private Boolean fragile;
}
