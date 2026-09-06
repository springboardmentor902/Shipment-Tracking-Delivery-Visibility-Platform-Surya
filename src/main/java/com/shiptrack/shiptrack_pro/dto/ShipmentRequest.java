package com.shiptrack.shiptrack_pro.dto;

import lombok.Data;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

@Data
public class ShipmentRequest {
    @NotBlank(message = "Sender name is required")
    private String senderName;

    private String senderPhone;

    private String senderEmail;

    @NotBlank(message = "Sender address is required")
    private String senderAddress;

    @NotBlank(message = "Receiver name is required")
    private String receiverName;

    private String receiverPhone;

    private String receiverEmail;

    @NotBlank(message = "Receiver address is required")
    private String receiverAddress;

    @NotBlank(message = "Pickup address is required")
    private String pickupAddress;

    @NotBlank(message = "Delivery address is required")
    private String deliveryAddress;

    private String priority;

    private List<PackageRequest> packages;
}
