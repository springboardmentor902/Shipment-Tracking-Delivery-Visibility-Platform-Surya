package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.entity.ETAPrediction;
import com.shiptrack.shiptrack_pro.entity.Route;
import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.repository.ETAPredictionRepository;
import com.shiptrack.shiptrack_pro.repository.RouteRepository;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ETACalculationService {

    private final ETAPredictionRepository etaPredictionRepository;
    private final RouteRepository routeRepository;
    private final ShipmentRepository shipmentRepository;

    public ETAPrediction calculateETA(Long shipmentId) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new RuntimeException("Shipment not found"));

        Route route = routeRepository.findByShipmentId(shipmentId)
                .orElseGet(() -> {
                    Route newRoute = Route.builder()
                            .shipmentId(shipmentId)
                            .originAddress(shipment.getPickupAddress() != null ? shipment.getPickupAddress() : shipment.getSenderAddress())
                            .destinationAddress(shipment.getDeliveryAddress() != null ? shipment.getDeliveryAddress() : shipment.getReceiverAddress())
                            .distanceKm(250.0)
                            .estimatedTimeMinutes(240)
                            .status("ACTIVE")
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    return routeRepository.save(newRoute);
                });

        boolean isDelivered = "DELIVERED".equalsIgnoreCase(shipment.getStatus());

        // Calculate ETA based on route data
        LocalDateTime predictedDeliveryTime = isDelivered ?
                (shipment.getActualDeliveryDate() != null ? shipment.getActualDeliveryDate() : LocalDateTime.now()) :
                calculatePredictedDeliveryTime(route, shipment);
        
        // Calculate delay risk score (0-10)
        int delayRiskScore = isDelivered ? 0 : calculateDelayRiskScore(route, shipment);
        
        // Calculate confidence score (0-100)
        int confidenceScore = isDelivered ? 100 : calculateConfidenceScore(route, shipment);
        
        // Identify factors
        Map<String, Object> factors = identifyFactors(route, shipment, delayRiskScore);
        if (isDelivered) {
            factors.put("message", "This item has already been delivered.");
        }

        // Save or update prediction
        ETAPrediction prediction = etaPredictionRepository.findByShipmentId(shipmentId)
                .orElse(ETAPrediction.builder().shipmentId(shipmentId).build());

        prediction.setPredictedDeliveryTime(predictedDeliveryTime);
        prediction.setDelayRiskScore(delayRiskScore);
        prediction.setConfidenceScore(confidenceScore);
        
        // Serialize factors map to JSON string (simple approach)
        StringBuilder factorsJson = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> entry : factors.entrySet()) {
            if (!first) {
                factorsJson.append(", ");
            }
            factorsJson.append("\"").append(entry.getKey()).append("\": ");
            Object value = entry.getValue();
            if (value instanceof String) {
                factorsJson.append("\"").append(value).append("\"");
            } else {
                factorsJson.append(value);
            }
            first = false;
        }
        factorsJson.append("}");
        prediction.setFactors(factorsJson.toString());

        return etaPredictionRepository.save(prediction);
    }

    private LocalDateTime calculatePredictedDeliveryTime(Route route, Shipment shipment) {
        // Base calculation: estimated_time_minutes from route
        int estimatedMinutes = route.getEstimatedTimeMinutes() != null ? 
                route.getEstimatedTimeMinutes() : 0;

        // Adjust based on traffic condition
        if (route.getTrafficCondition() != null) {
            switch (route.getTrafficCondition().toUpperCase()) {
                case "HEAVY":
                    estimatedMinutes = (int) (estimatedMinutes * 1.5); // 50% delay
                    break;
                case "MODERATE":
                    estimatedMinutes = (int) (estimatedMinutes * 1.2); // 20% delay
                    break;
                case "LIGHT":
                    estimatedMinutes = (int) (estimatedMinutes * 1.05); // 5% delay
                    break;
                default:
                    // No adjustment for unknown/normal traffic
                    break;
            }
        }

        // Calculate from shipment creation time
        LocalDateTime baseTime = shipment.getCreatedAt() != null ? 
                shipment.getCreatedAt() : LocalDateTime.now();
        
        return baseTime.plusMinutes(estimatedMinutes);
    }

    private int calculateDelayRiskScore(Route route, Shipment shipment) {
        int riskScore = 0;

        // Factor 1: Traffic condition (0-3 points)
        if (route.getTrafficCondition() != null) {
            switch (route.getTrafficCondition().toUpperCase()) {
                case "HEAVY":
                    riskScore += 3;
                    break;
                case "MODERATE":
                    riskScore += 2;
                    break;
                case "LIGHT":
                    riskScore += 0;
                    break;
                default:
                    riskScore += 1;
            }
        }

        // Factor 2: Distance (0-2 points)
        if (route.getDistanceKm() != null) {
            if (route.getDistanceKm() > 500) {
                riskScore += 2;
            } else if (route.getDistanceKm() > 200) {
                riskScore += 1;
            }
        }

        // Factor 3: Shipment age (0-2 points)
        if (shipment.getCreatedAt() != null) {
            long hoursSinceCreation = java.time.Duration.between(
                    shipment.getCreatedAt(), LocalDateTime.now()).toHours();
            if (hoursSinceCreation > 48) {
                riskScore += 2;
            } else if (hoursSinceCreation > 24) {
                riskScore += 1;
            }
        }

        // Factor 4: Current location progress (0-3 points)
        if (route.getCurrentLatitude() != null && route.getCurrentLongitude() != null &&
            route.getDestinationLatitude() != null && route.getDestinationLongitude() != null) {
            
            // Simple distance calculation (not precise but sufficient for risk scoring)
            double distanceToDestination = calculateDistance(
                    route.getCurrentLatitude(), route.getCurrentLongitude(),
                    route.getDestinationLatitude(), route.getDestinationLongitude()
            );
            
            double totalDistance = route.getDistanceKm() != null ? route.getDistanceKm() : 1;
            double progress = 1 - (distanceToDestination / totalDistance);
            
            // If progress is less than expected based on time, increase risk
            long hoursSinceCreation = java.time.Duration.between(
                    shipment.getCreatedAt(), LocalDateTime.now()).toHours();
            int estimatedHours = route.getEstimatedTimeMinutes() != null ? 
                    route.getEstimatedTimeMinutes() / 60 : 1;
            
            if (hoursSinceCreation > 0 && progress < (hoursSinceCreation / (double) estimatedHours)) {
                riskScore += 3;
            }
        }

        // Cap at 10
        return Math.min(riskScore, 10);
    }

    private int calculateConfidenceScore(Route route, Shipment shipment) {
        int confidence = 100;

        // Reduce confidence based on missing data
        if (route.getTrafficCondition() == null) {
            confidence -= 20;
        }
        if (route.getDistanceKm() == null) {
            confidence -= 15;
        }
        if (route.getEstimatedTimeMinutes() == null) {
            confidence -= 15;
        }
        if (route.getCurrentLatitude() == null || route.getCurrentLongitude() == null) {
            confidence -= 25;
        }
        if (route.getDestinationLatitude() == null || route.getDestinationLongitude() == null) {
            confidence -= 15;
        }

        // Reduce confidence for new shipments (less tracking history)
        if (shipment.getCreatedAt() != null) {
            long hoursSinceCreation = java.time.Duration.between(
                    shipment.getCreatedAt(), LocalDateTime.now()).toHours();
            if (hoursSinceCreation < 2) {
                confidence -= 10;
            }
        }

        // Ensure minimum confidence of 20
        return Math.max(confidence, 20);
    }

    private Map<String, Object> identifyFactors(Route route, Shipment shipment, int delayRiskScore) {
        Map<String, Object> factors = new HashMap<>();

        factors.put("traffic_condition", route.getTrafficCondition() != null ? 
                route.getTrafficCondition() : "UNKNOWN");
        factors.put("distance_km", route.getDistanceKm() != null ? 
                route.getDistanceKm() : 0);
        factors.put("estimated_time_minutes", route.getEstimatedTimeMinutes() != null ? 
                route.getEstimatedTimeMinutes() : 0);
        factors.put("has_current_location", 
                route.getCurrentLatitude() != null && route.getCurrentLongitude() != null);
        factors.put("shipment_status", shipment.getStatus());
        factors.put("hours_since_creation", shipment.getCreatedAt() != null ? 
                java.time.Duration.between(shipment.getCreatedAt(), LocalDateTime.now()).toHours() : 0);

        // Risk level classification
        String riskLevel;
        if (delayRiskScore <= 3) {
            riskLevel = "LOW";
        } else if (delayRiskScore <= 6) {
            riskLevel = "MEDIUM";
        } else if (delayRiskScore <= 8) {
            riskLevel = "HIGH";
        } else {
            riskLevel = "CRITICAL";
        }
        factors.put("risk_level", riskLevel);

        return factors;
    }

    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        // Haversine formula for distance calculation
        final int R = 6371; // Radius of the earth in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    public List<Map<String, Object>> getAtRiskShipments(int threshold) {
        List<Shipment> activeShipments = shipmentRepository.findAll().stream()
                .filter(s -> !"DELIVERED".equalsIgnoreCase(s.getStatus()) && !"CANCELLED".equalsIgnoreCase(s.getStatus()))
                .toList();

        List<Map<String, Object>> atRiskList = new ArrayList<>();

        for (Shipment shipment : activeShipments) {
            try {
                ETAPrediction prediction;
                try {
                    prediction = calculateETA(shipment.getId());
                } catch (Exception e) {
                    prediction = etaPredictionRepository.findByShipmentId(shipment.getId()).orElse(null);
                }

                if (prediction != null && prediction.getDelayRiskScore() != null && prediction.getDelayRiskScore() >= threshold) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("shipmentId", shipment.getId());
                    item.put("trackingNumber", shipment.getTrackingNumber());
                    item.put("status", shipment.getStatus());
                    item.put("priority", shipment.getPriority());
                    item.put("senderName", shipment.getSenderName());
                    item.put("receiverName", shipment.getReceiverName());
                    item.put("deliveryAddress", shipment.getDeliveryAddress());
                    item.put("delayRiskScore", prediction.getDelayRiskScore());
                    item.put("confidenceScore", prediction.getConfidenceScore());
                    item.put("predictedDeliveryTime", prediction.getPredictedDeliveryTime());
                    item.put("factors", prediction.getFactors());

                    int riskScore = prediction.getDelayRiskScore();
                    String riskLevel = riskScore >= 8 ? "CRITICAL" : (riskScore >= 6 ? "HIGH" : (riskScore >= 4 ? "MEDIUM" : "LOW"));
                    item.put("riskLevel", riskLevel);

                    atRiskList.add(item);
                }
            } catch (Exception e) {
                log.warn("Error assessing risk for shipment {}: {}", shipment.getId(), e.getMessage());
            }
        }

        return atRiskList;
    }
}
