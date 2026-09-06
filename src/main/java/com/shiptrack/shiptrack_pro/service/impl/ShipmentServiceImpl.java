package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.dto.PackageRequest;
import com.shiptrack.shiptrack_pro.dto.PackageResponse;
import com.shiptrack.shiptrack_pro.dto.ShipmentRequest;
import com.shiptrack.shiptrack_pro.dto.ShipmentResponse;
import com.shiptrack.shiptrack_pro.entity.Package;
import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.repository.PackageRepository;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.service.ShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShipmentServiceImpl implements ShipmentService {

    private final ShipmentRepository shipmentRepository;
    private final PackageRepository packageRepository;
    private final com.shiptrack.shiptrack_pro.service.BrevoEmailService brevoEmailService;

    @Override
    public ShipmentResponse createShipment(ShipmentRequest request, Long userId) {
        String trackingNumber = generateTrackingNumber();

        String senderEmail = (request.getSenderEmail() != null && !request.getSenderEmail().trim().isEmpty()) 
                ? request.getSenderEmail().trim() : "suryalbrcem9@gmail.com";
        String receiverEmail = (request.getReceiverEmail() != null && !request.getReceiverEmail().trim().isEmpty()) 
                ? request.getReceiverEmail().trim() : "suryalbrcem9@gmail.com";

        Shipment shipment = Shipment.builder()
                .trackingNumber(trackingNumber)
                .createdBy(userId)
                .senderName(request.getSenderName())
                .senderPhone(request.getSenderPhone())
                .senderEmail(senderEmail)
                .senderAddress(request.getSenderAddress())
                .receiverName(request.getReceiverName())
                .receiverPhone(request.getReceiverPhone())
                .receiverEmail(receiverEmail)
                .receiverAddress(request.getReceiverAddress())
                .pickupAddress(request.getPickupAddress())
                .deliveryAddress(request.getDeliveryAddress())
                .priority(request.getPriority() != null ? request.getPriority() : "STANDARD")
                .status("PENDING")
                .build();

        Shipment savedShipment = shipmentRepository.save(shipment);

        if (request.getPackages() != null && !request.getPackages().isEmpty()) {
            for (PackageRequest packageRequest : request.getPackages()) {
                Package packageEntity = Package.builder()
                        .shipmentId(savedShipment.getId())
                        .description(packageRequest.getDescription())
                        .weight(packageRequest.getWeight())
                        .length(packageRequest.getLength())
                        .width(packageRequest.getWidth())
                        .height(packageRequest.getHeight())
                        .quantity(packageRequest.getQuantity())
                        .declaredValue(packageRequest.getDeclaredValue())
                        .fragile(packageRequest.getFragile() != null ? packageRequest.getFragile() : false)
                        .build();
                packageRepository.save(packageEntity);
            }
        }

        // Trigger Brevo Transactional Email Notification
        try {
            brevoEmailService.sendShipmentConfirmation(savedShipment);
        } catch (Exception e) {
            // Log & continue without breaking transaction
        }

        return mapToResponse(savedShipment);
    }

    @Override
    public List<ShipmentResponse> getShipmentsByUser(Long userId, String userRole) {
        List<Shipment> shipments;

        switch (userRole) {
            case "CUSTOMER":
                shipments = shipmentRepository.findByCreatedByOrderByIdDesc(userId);
                break;
            case "LOGISTICS_OPERATOR":
                shipments = shipmentRepository.findByAssignedOperatorIdOrderByIdDesc(userId);
                break;
            case "ADMINISTRATOR":
            case "SUPPORT_AGENT":
                shipments = shipmentRepository.findAllByOrderByIdDesc();
                break;
            case "BUSINESS_CLIENT":
                shipments = shipmentRepository.findByBusinessIdOrderByIdDesc(userId);
                break;
            default:
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid role for shipment access");
        }

        return shipments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ShipmentResponse getShipmentById(Long id) {
        Shipment shipment = shipmentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found"));
        return mapToResponse(shipment);
    }

    private String generateTrackingNumber() {
        return "ST" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private ShipmentResponse mapToResponse(Shipment shipment) {
        List<Package> packages = packageRepository.findByShipmentId(shipment.getId());
        List<PackageResponse> packageResponses = packages.stream()
                .map(pkg -> PackageResponse.builder()
                        .id(pkg.getId())
                        .shipmentId(pkg.getShipmentId())
                        .description(pkg.getDescription())
                        .weight(pkg.getWeight())
                        .length(pkg.getLength())
                        .width(pkg.getWidth())
                        .height(pkg.getHeight())
                        .quantity(pkg.getQuantity())
                        .declaredValue(pkg.getDeclaredValue())
                        .fragile(pkg.getFragile())
                        .createdAt(pkg.getCreatedAt())
                        .updatedAt(pkg.getUpdatedAt())
                        .build())
                .collect(Collectors.toList());

        return ShipmentResponse.builder()
                .id(shipment.getId())
                .trackingNumber(shipment.getTrackingNumber())
                .createdBy(shipment.getCreatedBy())
                .businessId(shipment.getBusinessId())
                .assignedOperatorId(shipment.getAssignedOperatorId())
                .senderName(shipment.getSenderName())
                .senderPhone(shipment.getSenderPhone())
                .senderEmail(shipment.getSenderEmail() != null ? shipment.getSenderEmail() : "suryalbrcem9@gmail.com")
                .senderAddress(shipment.getSenderAddress())
                .receiverName(shipment.getReceiverName())
                .receiverPhone(shipment.getReceiverPhone())
                .receiverEmail(shipment.getReceiverEmail() != null ? shipment.getReceiverEmail() : "suryalbrcem9@gmail.com")
                .receiverAddress(shipment.getReceiverAddress())
                .pickupAddress(shipment.getPickupAddress())
                .deliveryAddress(shipment.getDeliveryAddress())
                .pickupLatitude(shipment.getPickupLatitude())
                .pickupLongitude(shipment.getPickupLongitude())
                .deliveryLatitude(shipment.getDeliveryLatitude())
                .deliveryLongitude(shipment.getDeliveryLongitude())
                .status(shipment.getStatus())
                .priority(shipment.getPriority())
                .estimatedDeliveryDate(shipment.getEstimatedDeliveryDate())
                .actualDeliveryDate(shipment.getActualDeliveryDate())
                .cancellationReason(shipment.getCancellationReason())
                .createdAt(shipment.getCreatedAt())
                .updatedAt(shipment.getUpdatedAt())
                .packages(packageResponses)
                .build();
    }
}
