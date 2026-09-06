package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.dto.RouteAlternativeDTO;
import com.shiptrack.shiptrack_pro.dto.RouteOptimizationResultDTO;
import com.shiptrack.shiptrack_pro.service.GoogleMapsService;
import com.shiptrack.shiptrack_pro.service.RouteOptimizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RouteOptimizationServiceImpl implements RouteOptimizationService {

    private final GoogleMapsService googleMapsService;

    @Override
    public RouteOptimizationResultDTO optimizeRoute(String origin, String destination) {
        List<RouteAlternativeDTO> alternatives = googleMapsService.getRouteAlternatives(origin, destination);

        RouteAlternativeDTO selectedRoute = alternatives.stream()
                .min(Comparator.comparingInt(RouteAlternativeDTO::getTrafficDurationMinutes))
                .orElse(alternatives.get(0));

        int otherAvgDuration = (int) alternatives.stream()
                .filter(a -> a != selectedRoute)
                .mapToInt(RouteAlternativeDTO::getTrafficDurationMinutes)
                .average()
                .orElse(selectedRoute.getTrafficDurationMinutes());

        int timeSaved = Math.max(0, otherAvgDuration - selectedRoute.getTrafficDurationMinutes());

        String reason = String.format(
                "Selected '%s' with the lowest traffic-adjusted duration (%d mins vs avg %d mins for alternatives, saving ~%d mins under current traffic conditions).",
                selectedRoute.getSummary(),
                selectedRoute.getTrafficDurationMinutes(),
                otherAvgDuration,
                timeSaved
        );

        log.info("Optimized route for {} -> {}: {}. Reason: {}", origin, destination, selectedRoute.getSummary(), reason);

        return RouteOptimizationResultDTO.builder()
                .selectedRoute(selectedRoute)
                .alternatives(alternatives)
                .selectionReason(reason)
                .build();
    }
}
