package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.dto.PODRequest;
import com.shiptrack.shiptrack_pro.dto.PODResponse;
import com.shiptrack.shiptrack_pro.dto.PODVerifyRequest;
import com.shiptrack.shiptrack_pro.entity.ProofOfDelivery;
import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.entity.User;
import com.shiptrack.shiptrack_pro.repository.PODRepository;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.service.PODService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PODServiceImpl implements PODService {

    private final PODRepository podRepository;
    private final ShipmentRepository shipmentRepository;
    private final com.shiptrack.shiptrack_pro.service.BrevoEmailService brevoEmailService;

    @Override
    public PODResponse submitPOD(Long shipmentId, PODRequest request, Long userId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found with id: " + shipmentId));

        ProofOfDelivery pod = podRepository.findByShipmentId(shipmentId)
                .orElse(ProofOfDelivery.builder()
                        .shipmentId(shipmentId)
                        .build());

        pod.setRecipientName(request.getRecipientName());
        pod.setSignatureData(request.getSignatureData());
        pod.setPhotoUrl(request.getPhotoUrl());
        pod.setNotes(request.getNotes());
        pod.setVerificationStatus("PENDING");

        ProofOfDelivery savedPOD = podRepository.save(pod);

        // Update shipment status to DELIVERED and set actual delivery timestamp
        shipment.setStatus("DELIVERED");
        shipment.setActualDeliveryDate(LocalDateTime.now());
        shipmentRepository.save(shipment);

        log.info("Proof of Delivery submitted for shipment ID: {}", shipmentId);

        // Trigger Brevo Delivery Email Notification to both Sender and Receiver
        try {
            brevoEmailService.sendDeliveryNotification(shipment);
        } catch (Exception e) {
            log.warn("Failed to send Brevo delivery email notification for shipment {}: {}", shipmentId, e.getMessage());
        }

        return mapToResponse(savedPOD);
    }

    @Override
    public PODResponse verifyPOD(Long shipmentId, PODVerifyRequest request, Long verifiedByUserId) {
        ProofOfDelivery pod = podRepository.findByShipmentId(shipmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proof of Delivery not found for shipment ID: " + shipmentId));

        String status = request.getStatus();
        if (!"VERIFIED".equalsIgnoreCase(status) && !"REJECTED".equalsIgnoreCase(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status must be VERIFIED or REJECTED");
        }

        pod.setVerificationStatus(status.toUpperCase());
        pod.setVerifiedBy(verifiedByUserId);
        pod.setVerifiedAt(LocalDateTime.now());
        pod.setVerificationNotes(request.getVerificationNotes());

        ProofOfDelivery savedPOD = podRepository.save(pod);
        log.info("POD verification updated for shipment ID: {} to status: {}", shipmentId, status.toUpperCase());

        return mapToResponse(savedPOD);
    }

    @Override
    public List<PODResponse> getPendingPODs() {
        return podRepository.findByVerificationStatus("PENDING")
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<PODResponse> getAllPODs() {
        return podRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PODResponse getPODByShipmentId(Long shipmentId, User currentUser) {
        ProofOfDelivery pod = podRepository.findByShipmentId(shipmentId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Proof of Delivery not found for shipment ID: " + shipmentId));

        if (currentUser != null) {
            String role = currentUser.getRole();
            boolean isStaffOrAdmin = "ADMINISTRATOR".equals(role) || "SUPPORT_AGENT".equals(role) || "LOGISTICS_OPERATOR".equals(role);
            if (!isStaffOrAdmin) {
                Shipment shipment = shipmentRepository.findById(shipmentId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shipment not found"));
                boolean isOwner = (shipment.getCreatedBy() != null && shipment.getCreatedBy().equals(currentUser.getId())) ||
                        (shipment.getBusinessId() != null && shipment.getBusinessId().equals(currentUser.getId()));
                if (!isOwner) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to view this Proof of Delivery");
                }
            }
        }

        return mapToResponse(pod);
    }

    private PODResponse mapToResponse(ProofOfDelivery pod) {
        return PODResponse.builder()
                .id(pod.getId())
                .shipmentId(pod.getShipmentId())
                .recipientName(pod.getRecipientName())
                .signatureData(pod.getSignatureData())
                .photoUrl(pod.getPhotoUrl())
                .notes(pod.getNotes())
                .verificationStatus(pod.getVerificationStatus())
                .verifiedBy(pod.getVerifiedBy())
                .verifiedAt(pod.getVerifiedAt())
                .verificationNotes(pod.getVerificationNotes())
                .createdAt(pod.getCreatedAt())
                .build();
    }
}
