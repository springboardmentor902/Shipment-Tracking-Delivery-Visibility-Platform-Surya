package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.dto.RouteOptimizationResultDTO;

public interface RouteOptimizationService {
    RouteOptimizationResultDTO optimizeRoute(String origin, String destination);
}
