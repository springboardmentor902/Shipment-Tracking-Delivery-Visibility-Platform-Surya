package com.shiptrack.shiptrack_pro.controller;

import com.shiptrack.shiptrack_pro.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/shipments")
    public ResponseEntity<byte[]> getShipmentReport(@RequestParam(defaultValue = "pdf") String format,
                                                     Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        byte[] data = reportService.generateShipmentReport(format, email);
        return buildFileResponse(data, "shipments_report", format);
    }

    @GetMapping("/delivery")
    public ResponseEntity<byte[]> getDeliveryReport(@RequestParam(defaultValue = "pdf") String format,
                                                     Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        byte[] data = reportService.generateDeliveryReport(format, email);
        return buildFileResponse(data, "delivery_report", format);
    }

    @GetMapping("/routes")
    public ResponseEntity<byte[]> getRoutePerformanceReport(@RequestParam(defaultValue = "pdf") String format,
                                                             Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        byte[] data = reportService.generateRoutePerformanceReport(format, email);
        return buildFileResponse(data, "route_performance_report", format);
    }

    @GetMapping("/delays")
    public ResponseEntity<byte[]> getDelayAnalysisReport(@RequestParam(defaultValue = "pdf") String format,
                                                          Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        byte[] data = reportService.generateDelayAnalysisReport(format, email);
        return buildFileResponse(data, "delay_analysis_report", format);
    }

    // --- Legacy Endpoints for Compatibility ---
    @GetMapping("/shipments/csv")
    public ResponseEntity<byte[]> exportShipmentsCSV() {
        byte[] csvData = reportService.generateShipmentsCSVReport();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=shipments_report.csv")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvData);
    }

    @GetMapping("/shipments/excel")
    public ResponseEntity<byte[]> exportShipmentsExcel(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        byte[] excelData = reportService.generateShipmentReport("excel", email);
        return buildFileResponse(excelData, "shipments_report", "excel");
    }

    @GetMapping("/shipments/pdf")
    public ResponseEntity<byte[]> exportShipmentsPDF(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        byte[] pdfData = reportService.generateShipmentReport("pdf", email);
        return buildFileResponse(pdfData, "shipments_report", "pdf");
    }

    @GetMapping("/performance")
    public ResponseEntity<Map<String, Object>> getDeliveryPerformanceMetrics() {
        return ResponseEntity.ok(reportService.getDeliveryPerformanceMetrics());
    }

    private ResponseEntity<byte[]> buildFileResponse(byte[] data, String filenamePrefix, String format) {
        boolean isExcel = "excel".equalsIgnoreCase(format) || "xlsx".equalsIgnoreCase(format);
        String extension = isExcel ? ".xlsx" : ".pdf";
        MediaType mediaType = isExcel
                ? MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                : MediaType.APPLICATION_PDF;

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filenamePrefix + extension)
                .contentType(mediaType)
                .body(data);
    }
}
