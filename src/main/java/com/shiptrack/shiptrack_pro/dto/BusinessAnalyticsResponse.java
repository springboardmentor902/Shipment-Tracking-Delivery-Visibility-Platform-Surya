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
public class BusinessAnalyticsResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    private long totalShipments;
    private long activeShipments;
    private long completedShipments;
    private double deliverySuccessRatePercent;
    private double onTimeDeliveryRatePercent;
    private long delayedShipmentsCount;
    private double delayRatePercent;
    private long uniqueCustomersCount;
    private Map<String, Long> statusBreakdown;
}
