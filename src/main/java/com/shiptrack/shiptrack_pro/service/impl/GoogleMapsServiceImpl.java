package com.shiptrack.shiptrack_pro.service.impl;

import com.shiptrack.shiptrack_pro.service.GoogleMapsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.shiptrack.shiptrack_pro.dto.RouteAlternativeDTO;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("unchecked")
public class GoogleMapsServiceImpl implements GoogleMapsService {

    @Value("${google.maps.api.key:''}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String GEOCODING_API_URL = "https://maps.googleapis.com/maps/api/geocode/json";
    private static final String DIRECTIONS_API_URL = "https://maps.googleapis.com/maps/api/directions/json";

    @Override
    public Map<String, Double> geocodeAddress(String address) {
        Map<String, Double> result = new HashMap<>();

        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("Google Maps API key not configured. Skipping geocoding for address: {}", address);
            return result;
        }

        try {
            String url = GEOCODING_API_URL + "?address=" + address.replace(" ", "+") + "&key=" + apiKey;
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null && "OK".equals(response.get("status"))) {
                List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");
                if (results != null && !results.isEmpty()) {
                    Map<String, Object> firstResult = results.get(0);
                    Map<String, Object> geometry = (Map<String, Object>) firstResult.get("geometry");
                    Map<String, Object> location = (Map<String, Object>) geometry.get("location");
                    result.put("latitude", ((Number) location.get("lat")).doubleValue());
                    result.put("longitude", ((Number) location.get("lng")).doubleValue());
                    log.info("Successfully geocoded address: {}", address);
                }
            } else {
                log.warn("Geocoding failed for address: {}. Status: {}", address, response != null ? response.get("status") : "null");
            }
        } catch (Exception e) {
            log.error("Error geocoding address: {}", address, e);
        }

        return result;
    }

    @Override
    public Map<String, Object> getDirections(String origin, String destination) {
        Map<String, Object> result = new HashMap<>();

        if (apiKey == null || apiKey.isEmpty()) {
            log.warn("Google Maps API key not configured. Skipping directions calculation.");
            return result;
        }

        try {
            String url = DIRECTIONS_API_URL + "?origin=" + origin.replace(" ", "+") + 
                         "&destination=" + destination.replace(" ", "+") + 
                         "&key=" + apiKey;
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);

            if (response != null && "OK".equals(response.get("status"))) {
                List<Map<String, Object>> routes = (List<Map<String, Object>>) response.get("routes");
                if (routes != null && !routes.isEmpty()) {
                    Map<String, Object> route = routes.get(0);
                    List<Map<String, Object>> legs = (List<Map<String, Object>>) route.get("legs");
                    if (legs != null && !legs.isEmpty()) {
                        Map<String, Object> firstLeg = legs.get(0);
                        Map<String, Object> distance = (Map<String, Object>) firstLeg.get("distance");
                        Map<String, Object> duration = (Map<String, Object>) firstLeg.get("duration");
                        
                        result.put("distanceKm", ((Number) distance.get("value")).doubleValue() / 1000.0);
                        result.put("estimatedTimeMinutes", ((Number) duration.get("value")).intValue() / 60);
                        
                        log.info("Successfully calculated directions from {} to {}", origin, destination);
                    }
                }
            } else {
                log.warn("Directions calculation failed. Status: {}", response != null ? response.get("status") : "null");
            }
        } catch (Exception e) {
            log.error("Error calculating directions from {} to {}", origin, destination, e);
        }

        return result;
    }

    @Override
    public List<RouteAlternativeDTO> getRouteAlternatives(String origin, String destination) {
        List<RouteAlternativeDTO> alternatives = new ArrayList<>();

        if (apiKey != null && !apiKey.isEmpty()) {
            try {
                String url = DIRECTIONS_API_URL + "?origin=" + origin.replace(" ", "+") +
                             "&destination=" + destination.replace(" ", "+") +
                             "&alternatives=true&departure_time=now&key=" + apiKey;
                Map<String, Object> response = restTemplate.getForObject(url, Map.class);

                if (response != null && "OK".equals(response.get("status"))) {
                    List<Map<String, Object>> routes = (List<Map<String, Object>>) response.get("routes");
                    if (routes != null && !routes.isEmpty()) {
                        for (Map<String, Object> route : routes) {
                            String summary = (String) route.getOrDefault("summary", "Standard Highway Route");
                            List<Map<String, Object>> legs = (List<Map<String, Object>>) route.get("legs");
                            if (legs != null && !legs.isEmpty()) {
                                Map<String, Object> leg = legs.get(0);
                                Map<String, Object> distance = (Map<String, Object>) leg.get("distance");
                                Map<String, Object> duration = (Map<String, Object>) leg.get("duration");
                                Map<String, Object> durationInTraffic = (Map<String, Object>) leg.get("duration_in_traffic");

                                double distKm = distance != null ? ((Number) distance.get("value")).doubleValue() / 1000.0 : 50.0;
                                int durMin = duration != null ? ((Number) duration.get("value")).intValue() / 60 : 45;
                                int trafficDurMin = durationInTraffic != null ?
                                        ((Number) durationInTraffic.get("value")).intValue() / 60 : (int)(durMin * 1.15);

                                String trafficCond = "NORMAL";
                                if (trafficDurMin > durMin * 1.3) {
                                    trafficCond = "HEAVY";
                                } else if (trafficDurMin > durMin * 1.1) {
                                    trafficCond = "MODERATE";
                                }

                                alternatives.add(RouteAlternativeDTO.builder()
                                        .summary(summary)
                                        .distanceKm(Math.round(distKm * 10.0) / 10.0)
                                        .durationMinutes(durMin)
                                        .trafficDurationMinutes(trafficDurMin)
                                        .trafficCondition(trafficCond)
                                        .build());
                            }
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to fetch Google Maps route alternatives: {}", e.getMessage());
            }
        }

        // Fallback / simulated alternatives when API key is missing or API returns single/no route
        if (alternatives.size() < 2) {
            log.info("Generating fallback optimized route alternatives for {} -> {}", origin, destination);
            int baseDist = Math.abs((origin + destination).hashCode()) % 80 + 35; // 35 to 115 km
            int baseDuration = (int) (baseDist * 1.2); // ~ 40 to 140 min

            alternatives.clear();
            // Route A: Express Highway (Lowest traffic-adjusted time)
            alternatives.add(RouteAlternativeDTO.builder()
                    .summary("Expressway Route (Via Highway A1)")
                    .distanceKm((double) baseDist)
                    .durationMinutes(baseDuration)
                    .trafficDurationMinutes(baseDuration + 3)
                    .trafficCondition("NORMAL")
                    .build());

            // Route B: City Ring Road (Moderate traffic)
            alternatives.add(RouteAlternativeDTO.builder()
                    .summary("Bypass Ring Road (Via Arterial Corridor)")
                    .distanceKm(Math.round((baseDist * 1.12) * 10.0) / 10.0)
                    .durationMinutes(baseDuration + 12)
                    .trafficDurationMinutes(baseDuration + 18)
                    .trafficCondition("MODERATE")
                    .build());

            // Route C: Inner City Boulevard (Heavy traffic)
            alternatives.add(RouteAlternativeDTO.builder()
                    .summary("Inner City Route (Via Central Blvd)")
                    .distanceKm(Math.round((baseDist * 0.95) * 10.0) / 10.0)
                    .durationMinutes(baseDuration + 8)
                    .trafficDurationMinutes(baseDuration + 35)
                    .trafficCondition("HEAVY")
                    .build());
        }

        return alternatives;
    }
}
