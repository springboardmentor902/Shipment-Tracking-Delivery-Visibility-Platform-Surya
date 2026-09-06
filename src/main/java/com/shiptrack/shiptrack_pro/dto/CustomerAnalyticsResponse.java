package com.shiptrack.shiptrack_pro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CustomerAnalyticsResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private long activeShipmentCount;
    private long totalShipmentHistoryCount;
    private Map<String, Long> statusBreakdown;
    private double onTimeDeliveryRatePercent;
    private double avgDeliveryTimeHours;
    private String topDestination;
}
