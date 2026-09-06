package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.entity.ETAPrediction;
import com.shiptrack.shiptrack_pro.service.ETACalculationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/eta")
@RequiredArgsConstructor
public class ETAController {

    private final ETACalculationService etaCalculationService;

    @PostMapping("/{shipmentId}/predict")
    public ResponseEntity<ETAPrediction> predictETA(@PathVariable Long shipmentId) {
        try {
            ETAPrediction prediction = etaCalculationService.calculateETA(shipmentId);
            return ResponseEntity.ok(prediction);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/{shipmentId}")
    public ResponseEntity<ETAPrediction> getETAPrediction(@PathVariable Long shipmentId) {
        try {
            ETAPrediction prediction = etaCalculationService.calculateETA(shipmentId);
            return ResponseEntity.ok(prediction);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/at-risk")
    public ResponseEntity<List<Map<String, Object>>> getAtRiskShipments(
            @RequestParam(defaultValue = "7") int threshold) {
        List<Map<String, Object>> atRiskShipments = etaCalculationService.getAtRiskShipments(threshold);
        return ResponseEntity.ok(atRiskShipments);
    }
}
