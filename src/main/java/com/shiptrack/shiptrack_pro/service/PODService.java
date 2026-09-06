package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.dto.PODRequest;
import com.shiptrack.shiptrack_pro.dto.PODResponse;
import com.shiptrack.shiptrack_pro.dto.PODVerifyRequest;
import com.shiptrack.shiptrack_pro.entity.User;

import java.util.List;

public interface PODService {
    PODResponse submitPOD(Long shipmentId, PODRequest request, Long userId);
    PODResponse verifyPOD(Long shipmentId, PODVerifyRequest request, Long verifiedByUserId);
    List<PODResponse> getPendingPODs();
    List<PODResponse> getAllPODs();
    PODResponse getPODByShipmentId(Long shipmentId, User currentUser);
}
