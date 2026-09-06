package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.dto.PODRequest;
import com.shiptrack.shiptrack_pro.dto.PODResponse;
import com.shiptrack.shiptrack_pro.dto.PODVerifyRequest;
import com.shiptrack.shiptrack_pro.entity.User;
import com.shiptrack.shiptrack_pro.repository.UserRepository;
import com.shiptrack.shiptrack_pro.service.PODService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pod")
@RequiredArgsConstructor
public class PODController {

    private final PODService podService;
    private final UserRepository userRepository;

    @PostMapping("/{shipmentId}")
    @PreAuthorize("hasAnyRole('LOGISTICS_OPERATOR', 'ADMINISTRATOR')")
    public ResponseEntity<PODResponse> submitPOD(@PathVariable Long shipmentId,
                                                 @Valid @RequestBody PODRequest request,
                                                 @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(podService.submitPOD(shipmentId, request, user.getId()));
    }

    @PatchMapping("/{shipmentId}/verify")
    @PreAuthorize("hasAnyRole('SUPPORT_AGENT', 'ADMINISTRATOR')")
    public ResponseEntity<PODResponse> verifyPOD(@PathVariable Long shipmentId,
                                                 @Valid @RequestBody PODVerifyRequest request,
                                                 @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails.getUsername();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(podService.verifyPOD(shipmentId, request, user.getId()));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasAnyRole('SUPPORT_AGENT', 'ADMINISTRATOR')")
    public ResponseEntity<List<PODResponse>> getPendingPODs() {
        return ResponseEntity.ok(podService.getPendingPODs());
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('SUPPORT_AGENT', 'ADMINISTRATOR')")
    public ResponseEntity<List<PODResponse>> getAllPODs() {
        return ResponseEntity.ok(podService.getAllPODs());
    }

    @GetMapping("/{shipmentId}")
    public ResponseEntity<PODResponse> getPODByShipmentId(@PathVariable Long shipmentId,
                                                         @AuthenticationPrincipal UserDetails userDetails) {
        User user = null;
        if (userDetails != null) {
            user = userRepository.findByEmail(userDetails.getUsername()).orElse(null);
        }
        return ResponseEntity.ok(podService.getPODByShipmentId(shipmentId, user));
    }
}
