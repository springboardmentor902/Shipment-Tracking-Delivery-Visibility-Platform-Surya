package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.dto.LocationUpdate;
import com.shiptrack.shiptrack_pro.dto.RouteRequest;
import com.shiptrack.shiptrack_pro.dto.RouteResponse;
import com.shiptrack.shiptrack_pro.service.RouteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
public class RouteController {

    private final RouteService routeService;

    @PostMapping("/{shipmentId}")
    @PreAuthorize("hasAnyRole('LOGISTICS_OPERATOR', 'ADMINISTRATOR')")
    public ResponseEntity<RouteResponse> createRoute(@PathVariable Long shipmentId,
                                                     @Valid @RequestBody RouteRequest request) {
        return ResponseEntity.ok(routeService.createRoute(shipmentId, request));
    }

    @GetMapping("/{shipmentId}")
    public ResponseEntity<RouteResponse> getRouteByShipmentId(@PathVariable Long shipmentId) {
        Optional<RouteResponse> route = routeService.getRouteByShipmentId(shipmentId);
        return route.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{shipmentId}/history")
    public ResponseEntity<List<RouteResponse>> getRouteHistory(@PathVariable Long shipmentId) {
        return ResponseEntity.ok(routeService.getRouteHistoryByShipmentId(shipmentId));
    }

    @PutMapping("/{routeId}/driver/{driverId}")
    @PreAuthorize("hasAnyRole('LOGISTICS_OPERATOR', 'ADMINISTRATOR')")
    public ResponseEntity<RouteResponse> updateRouteDriver(@PathVariable Long routeId,
                                                           @PathVariable Long driverId) {
        return ResponseEntity.ok(routeService.updateRouteDriver(routeId, driverId));
    }

    @PostMapping("/{routeId}/location")
    @PreAuthorize("hasAnyRole('LOGISTICS_OPERATOR', 'ADMINISTRATOR')")
    public ResponseEntity<RouteResponse> updateRouteLocation(@PathVariable Long routeId,
                                                             @Valid @RequestBody LocationUpdate locationUpdate) {
        return ResponseEntity.ok(routeService.updateRouteLocation(routeId, locationUpdate));
    }
}
