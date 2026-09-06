package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ETAScheduledService {

    private final ETACalculationService etaCalculationService;
    private final ShipmentRepository shipmentRepository;

    @Scheduled(fixedRate = 20 * 60 * 1000) // Every 20 minutes
    public void recalculateETAForInProgressShipments() {
        log.info("Starting scheduled ETA recalculation for in-progress shipments");

        try {
            // Find all shipments that are in transit or picked up
            List<Shipment> inProgressShipments = shipmentRepository.findAll().stream()
                    .filter(s -> "IN_TRANSIT".equals(s.getStatus()) || "PICKED_UP".equals(s.getStatus()))
                    .toList();

            log.info("Found {} in-progress shipments for ETA recalculation", inProgressShipments.size());

            int successCount = 0;
            int failureCount = 0;

            for (Shipment shipment : inProgressShipments) {
                try {
                    etaCalculationService.calculateETA(shipment.getId());
                    successCount++;
                } catch (Exception e) {
                    log.warn("Failed to recalculate ETA for shipment {}: {}", shipment.getId(), e.getMessage());
                    failureCount++;
                }
            }

            log.info("Scheduled ETA recalculation completed: {} successes, {} failures", successCount, failureCount);

        } catch (Exception e) {
            log.error("Error during scheduled ETA recalculation: {}", e.getMessage());
        }
    }
}
