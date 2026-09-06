package com.shiptrack.shiptrack_pro.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShipmentResponse {
    private Long id;
    private String trackingNumber;
    private Long createdBy;
    private Long businessId;
    private Long assignedOperatorId;
    private String senderName;
    private String senderPhone;
    private String senderEmail;
    private String senderAddress;
    private String receiverName;
    private String receiverPhone;
    private String receiverEmail;
    private String receiverAddress;
    private String pickupAddress;
    private String deliveryAddress;
    private Double pickupLatitude;
    private Double pickupLongitude;
    private Double deliveryLatitude;
    private Double deliveryLongitude;
    private String status;
    private String priority;
    private LocalDateTime estimatedDeliveryDate;
    private LocalDateTime actualDeliveryDate;
    private String cancellationReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<PackageResponse> packages;
}
