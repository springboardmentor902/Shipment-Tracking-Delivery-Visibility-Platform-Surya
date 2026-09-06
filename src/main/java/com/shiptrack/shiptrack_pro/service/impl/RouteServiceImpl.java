package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.dto.LocationUpdate;
import com.shiptrack.shiptrack_pro.dto.RouteRequest;
import com.shiptrack.shiptrack_pro.dto.RouteResponse;
import com.shiptrack.shiptrack_pro.entity.Route;
import com.shiptrack.shiptrack_pro.repository.RouteRepository;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.service.ETACalculationService;
import com.shiptrack.shiptrack_pro.service.GoogleMapsService;
import com.shiptrack.shiptrack_pro.service.RouteService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

import com.shiptrack.shiptrack_pro.dto.RouteOptimizationResultDTO;
import com.shiptrack.shiptrack_pro.service.RouteOptimizationService;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RouteServiceImpl implements RouteService {

    private final RouteRepository routeRepository;
    private final ShipmentRepository shipmentRepository;
    private final GoogleMapsService googleMapsService;
    private final RouteOptimizationService routeOptimizationService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ETACalculationService etaCalculationService;

    @Override
    public RouteResponse createRoute(Long shipmentId, RouteRequest request) {

        // Check whether shipment exists
        if (!shipmentRepository.existsById(shipmentId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Shipment not found with id: " + shipmentId
            );
        }

        // When creating a new route for an existing shipment (re-route simulation),
        // mark all previous routes for this shipment as isCurrent = false.
        List<Route> existingRoutes = routeRepository.findByShipmentIdOrderByCreatedAtAsc(shipmentId);
        for (Route existing : existingRoutes) {
            existing.setIsCurrent(false);
            routeRepository.save(existing);
        }

        // Create route builder
        Route.RouteBuilder routeBuilder = Route.builder()
                .shipmentId(shipmentId)
                .originAddress(request.getOriginAddress())
                .destinationAddress(request.getDestinationAddress())
                .driverId(request.getDriverId())
                .status("ACTIVE")
                .isCurrent(true);

        String selectionReason = "Default route created";

        try {
            // Geocode Origin Address
            Map<String, Double> originCoords = googleMapsService.geocodeAddress(request.getOriginAddress());
            if (originCoords != null) {
                if (originCoords.containsKey("latitude")) {
                    routeBuilder.originLatitude(originCoords.get("latitude"));
                }
                if (originCoords.containsKey("longitude")) {
                    routeBuilder.originLongitude(originCoords.get("longitude"));
                }
            }

            // Geocode Destination Address
            Map<String, Double> destinationCoords = googleMapsService.geocodeAddress(request.getDestinationAddress());
            if (destinationCoords != null) {
                if (destinationCoords.containsKey("latitude")) {
                    routeBuilder.destinationLatitude(destinationCoords.get("latitude"));
                }
                if (destinationCoords.containsKey("longitude")) {
                    routeBuilder.destinationLongitude(destinationCoords.get("longitude"));
                }
            }

            // -----------------------------
            // Route Optimization Service Call
            // -----------------------------
            RouteOptimizationResultDTO optResult = routeOptimizationService.optimizeRoute(
                    request.getOriginAddress(),
                    request.getDestinationAddress()
            );

            if (optResult != null && optResult.getSelectedRoute() != null) {
                var selected = optResult.getSelectedRoute();
                routeBuilder.distanceKm(selected.getDistanceKm());
                routeBuilder.estimatedTimeMinutes(selected.getTrafficDurationMinutes());
                routeBuilder.trafficCondition(selected.getTrafficCondition());
                routeBuilder.waypoints(selected.getSummary());
                selectionReason = optResult.getSelectionReason();
            }

        } catch (Exception e) {
            log.warn("Google Maps / Route Optimization integration warning: {}. Saving basic route.", e.getMessage());
        }

        // Save route
        Route savedRoute = routeRepository.save(routeBuilder.build());

        log.info("Route created/updated for shipment {}: routeId={}, isCurrent=true", shipmentId, savedRoute.getId());

        RouteResponse response = mapToResponse(savedRoute);
        response.setSelectionReason(selectionReason);
        return response;
    }

    // --------------------------------------------------
    // Get Current Active Route By Shipment ID
    // --------------------------------------------------

    @Override
    public Optional<RouteResponse> getRouteByShipmentId(Long shipmentId) {
        Optional<Route> currentRoute = routeRepository.findByShipmentIdAndIsCurrentTrue(shipmentId);
        if (currentRoute.isPresent()) {
            return currentRoute.map(this::mapToResponse);
        }
        // Fallback to latest route if none explicitly marked current
        return routeRepository.findByShipmentIdOrderByCreatedAtDesc(shipmentId)
                .stream()
                .findFirst()
                .map(this::mapToResponse);
    }

    // --------------------------------------------------
    // Get Complete Route History By Shipment ID
    // --------------------------------------------------

    @Override
    public List<RouteResponse> getRouteHistoryByShipmentId(Long shipmentId) {
        if (!shipmentRepository.existsById(shipmentId)) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Shipment not found with id: " + shipmentId
            );
        }

        return routeRepository.findByShipmentIdOrderByCreatedAtDesc(shipmentId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // --------------------------------------------------
    // Update Route Driver
    // --------------------------------------------------

    @Override
    public RouteResponse updateRouteDriver(
            Long routeId,
            Long driverId
    ) {

        Route route =
                routeRepository.findById(routeId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Route not found with id: "
                                                + routeId
                                )
                        );

        route.setDriverId(driverId);

        Route updatedRoute =
                routeRepository.save(route);

        log.info(
                "Driver updated for route {}: driverId={}",
                routeId,
                driverId
        );

        return mapToResponse(updatedRoute);
    }

    // --------------------------------------------------
    // Update Route Location
    // --------------------------------------------------

    @Override
    public RouteResponse updateRouteLocation(
            Long routeId,
            LocationUpdate locationUpdate
    ) {

        // Find route
        Route route =
                routeRepository.findById(routeId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        HttpStatus.NOT_FOUND,
                                        "Route not found with id: "
                                                + routeId
                                )
                        );

        // Update latitude
        route.setCurrentLatitude(
                locationUpdate.getLatitude()
        );

        // Update longitude
        route.setCurrentLongitude(
                locationUpdate.getLongitude()
        );

        // Update timestamp
        route.setLocationUpdatedAt(
                LocalDateTime.now()
        );

        // Save route
        Route updatedRoute =
                routeRepository.save(route);

        log.info(
                "Location updated for route {}: lat={}, lng={}",
                routeId,
                locationUpdate.getLatitude(),
                locationUpdate.getLongitude()
        );

        // --------------------------------------------------
        // Create WebSocket Message
        // --------------------------------------------------

        Map<String, Object> locationMessage =
                Map.of(
                        "routeId",
                        routeId,

                        "shipmentId",
                        route.getShipmentId(),

                        "latitude",
                        locationUpdate.getLatitude(),

                        "longitude",
                        locationUpdate.getLongitude(),

                        "timestamp",
                        route.getLocationUpdatedAt().toString()
                );

        // WebSocket destination
        String destination =
                "/topic/shipment/"
                        + route.getShipmentId()
                        + "/location";

        // Explicit Object cast fixes
        // "convertAndSend(String, Object) is ambiguous"
        messagingTemplate.convertAndSend(
                destination,
                (Object) locationMessage
        );

        log.info(
                "Location broadcasted to {}",
                destination
        );

        // Recalculate ETA on location update
        try {
            etaCalculationService.calculateETA(route.getShipmentId());
            log.info("ETA recalculated for shipment {}", route.getShipmentId());
        } catch (Exception e) {
            log.warn("Failed to recalculate ETA for shipment {}: {}", route.getShipmentId(), e.getMessage());
        }

        return mapToResponse(updatedRoute);
    }

    // --------------------------------------------------
    // Map Route Entity -> RouteResponse
    // --------------------------------------------------

    private RouteResponse mapToResponse(Route route) {

        return RouteResponse.builder()

                .id(route.getId())

                .shipmentId(
                        route.getShipmentId()
                )

                .originAddress(
                        route.getOriginAddress()
                )

                .originLatitude(
                        route.getOriginLatitude()
                )

                .originLongitude(
                        route.getOriginLongitude()
                )

                .destinationAddress(
                        route.getDestinationAddress()
                )

                .destinationLatitude(
                        route.getDestinationLatitude()
                )

                .destinationLongitude(
                        route.getDestinationLongitude()
                )

                .distanceKm(
                        route.getDistanceKm()
                )

                .estimatedTimeMinutes(
                        route.getEstimatedTimeMinutes()
                )

                .actualTimeMinutes(
                        route.getActualTimeMinutes()
                )

                .trafficCondition(
                        route.getTrafficCondition()
                )

                .waypoints(
                        route.getWaypoints()
                )

                .driverId(
                        route.getDriverId()
                )

                .currentLatitude(
                        route.getCurrentLatitude()
                )

                .currentLongitude(
                        route.getCurrentLongitude()
                )

                .locationUpdatedAt(
                        route.getLocationUpdatedAt()
                )

                .status(
                        route.getStatus()
                )

                .isCurrent(
                        route.getIsCurrent() != null ? route.getIsCurrent() : true
                )

                .createdAt(
                        route.getCreatedAt()
                )

                .updatedAt(
                        route.getUpdatedAt()
                )

                .build();
    }
}