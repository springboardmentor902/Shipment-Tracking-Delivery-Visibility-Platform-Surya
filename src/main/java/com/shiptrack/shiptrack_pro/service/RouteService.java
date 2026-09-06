package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.dto.LocationUpdate;
import com.shiptrack.shiptrack_pro.dto.RouteRequest;
import com.shiptrack.shiptrack_pro.dto.RouteResponse;

import java.util.List;
import java.util.Optional;

public interface RouteService {
    RouteResponse createRoute(Long shipmentId, RouteRequest request);
    Optional<RouteResponse> getRouteByShipmentId(Long shipmentId);
    List<RouteResponse> getRouteHistoryByShipmentId(Long shipmentId);
    RouteResponse updateRouteDriver(Long routeId, Long driverId);
    RouteResponse updateRouteLocation(Long routeId, LocationUpdate locationUpdate);
}
