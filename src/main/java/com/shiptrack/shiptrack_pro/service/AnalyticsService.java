package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.dto.AdminAnalyticsResponse;
import com.shiptrack.shiptrack_pro.dto.BusinessAnalyticsResponse;
import com.shiptrack.shiptrack_pro.dto.CustomerAnalyticsResponse;

public interface AnalyticsService {
    CustomerAnalyticsResponse getCustomerAnalytics(String email);
    BusinessAnalyticsResponse getBusinessAnalytics(String email);
    AdminAnalyticsResponse getAdminAnalytics();
}
