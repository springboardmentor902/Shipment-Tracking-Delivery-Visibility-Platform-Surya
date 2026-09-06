package com.shiptrack.shiptrack_pro.service;

import java.util.Map;

public interface ReportService {
    byte[] generateShipmentReport(String format, String userEmail);
    byte[] generateDeliveryReport(String format, String userEmail);
    byte[] generateRoutePerformanceReport(String format, String userEmail);
    byte[] generateDelayAnalysisReport(String format, String userEmail);

    byte[] generateShipmentsCSVReport();
    byte[] generateShipmentsExcelReport();
    byte[] generateShipmentsPDFReport();
    Map<String, Object> getDeliveryPerformanceMetrics();
}
