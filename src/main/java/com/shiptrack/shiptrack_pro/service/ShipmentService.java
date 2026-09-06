package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.dto.ShipmentRequest;
import com.shiptrack.shiptrack_pro.dto.ShipmentResponse;

import java.util.List;

public interface ShipmentService {
    ShipmentResponse createShipment(ShipmentRequest request, Long userId);
    List<ShipmentResponse> getShipmentsByUser(Long userId, String userRole);
    ShipmentResponse getShipmentById(Long id);
}
