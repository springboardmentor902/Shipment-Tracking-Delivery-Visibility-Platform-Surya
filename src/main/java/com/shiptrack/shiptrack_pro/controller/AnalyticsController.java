package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.dto.AdminAnalyticsResponse;
import com.shiptrack.shiptrack_pro.dto.BusinessAnalyticsResponse;
import com.shiptrack.shiptrack_pro.dto.CustomerAnalyticsResponse;
import com.shiptrack.shiptrack_pro.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/customer")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CustomerAnalyticsResponse> getCustomerAnalytics(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(analyticsService.getCustomerAnalytics(email));
    }

    @GetMapping("/business")
    @PreAuthorize("hasAnyRole('BUSINESS_CLIENT', 'ADMINISTRATOR')")
    public ResponseEntity<BusinessAnalyticsResponse> getBusinessAnalytics(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(analyticsService.getBusinessAnalytics(email));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMINISTRATOR')")
    public ResponseEntity<AdminAnalyticsResponse> getAdminAnalytics() {
        return ResponseEntity.ok(analyticsService.getAdminAnalytics());
    }
}
