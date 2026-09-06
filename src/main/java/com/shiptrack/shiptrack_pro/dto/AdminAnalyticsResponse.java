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
public class AdminAnalyticsResponse implements Serializable {
    private static final long serialVersionUID = 1L;

    // User Summary
    private long totalUsers;
    private long activeUsers;
    private Map<String, Long> roleDistribution;

    // Platform-wide Shipment Monitoring
    private long totalShipments;
    private long activeShipments;
    private long deliveredShipments;
    private long cancelledShipments;
    private Map<String, Long> statusBreakdown;

    // Delivery Analytics
    private double platformDeliverySuccessRatePercent;
    private double avgDeliveryTimeHours;

    // Route Performance
    private long totalRoutes;
    private double avgDistanceKm;
    private double avgActualTimeMinutes;
    private double timeEstimateAccuracyPercent;
    private String bestPerformingRoute;
    private String worstPerformingRoute;

    // System Monitoring
    private String systemStatus;
    private long memoryUsageMb;
    private long activeConnections;

    // Reports Management Section
    private long availableReportTypesCount;
    private long reportsGeneratedTotal;
}
