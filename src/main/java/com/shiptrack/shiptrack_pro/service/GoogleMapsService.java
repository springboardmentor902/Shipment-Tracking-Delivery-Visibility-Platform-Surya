package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.dto.RouteAlternativeDTO;

import java.util.List;
import java.util.Map;

public interface GoogleMapsService {
    Map<String, Double> geocodeAddress(String address);
    Map<String, Object> getDirections(String origin, String destination);
    List<RouteAlternativeDTO> getRouteAlternatives(String origin, String destination);
}
