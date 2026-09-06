package com.shiptrack.shiptrack_pro.service.impl;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.shiptrack.shiptrack_pro.entity.ProofOfDelivery;
import com.shiptrack.shiptrack_pro.entity.Route;
import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.entity.User;
import com.shiptrack.shiptrack_pro.repository.PODRepository;
import com.shiptrack.shiptrack_pro.repository.RouteRepository;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.repository.UserRepository;
import com.shiptrack.shiptrack_pro.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportServiceImpl implements ReportService {

    private final ShipmentRepository shipmentRepository;
    private final UserRepository userRepository;
    private final RouteRepository routeRepository;
    private final PODRepository podRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private List<Shipment> filterShipmentsByUserRole(String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            return shipmentRepository.findAll();
        }
        User user = userRepository.findByEmail(userEmail).orElse(null);
        if (user == null) {
            return shipmentRepository.findAll();
        }

        String role = user.getRole() != null ? user.getRole().toUpperCase() : "CUSTOMER";
        Long userId = user.getId();

        if ("CUSTOMER".equals(role)) {
            return shipmentRepository.findAll().stream()
                    .filter(s -> (s.getCreatedBy() != null && s.getCreatedBy().equals(userId)) ||
                                 (s.getSenderEmail() != null && s.getSenderEmail().equalsIgnoreCase(userEmail)) ||
                                 (s.getReceiverEmail() != null && s.getReceiverEmail().equalsIgnoreCase(userEmail)))
                    .collect(Collectors.toList());
        } else if ("BUSINESS_CLIENT".equals(role)) {
            return shipmentRepository.findAll().stream()
                    .filter(s -> (s.getBusinessId() != null && s.getBusinessId().equals(userId)) ||
                                 (s.getCreatedBy() != null && s.getCreatedBy().equals(userId)))
                    .collect(Collectors.toList());
        } else {
            // ADMINISTRATOR, LOGISTICS_OPERATOR, SUPPORT_AGENT, DRIVER
            return shipmentRepository.findAll();
        }
    }

    // --- 1. SHIPMENT REPORT ---
    @Override
    public byte[] generateShipmentReport(String format, String userEmail) {
        List<Shipment> shipments = filterShipmentsByUserRole(userEmail);
        if ("excel".equalsIgnoreCase(format) || "xlsx".equalsIgnoreCase(format)) {
            return generateShipmentsExcel(shipments);
        } else if ("csv".equalsIgnoreCase(format)) {
            return generateShipmentsCSV(shipments);
        }
        return generateShipmentsPDF(shipments);
    }

    // --- 2. DELIVERY REPORT ---
    @Override
    public byte[] generateDeliveryReport(String format, String userEmail) {
        List<Shipment> shipments = filterShipmentsByUserRole(userEmail).stream()
                .filter(s -> "DELIVERED".equalsIgnoreCase(s.getStatus()))
                .collect(Collectors.toList());

        if ("excel".equalsIgnoreCase(format) || "xlsx".equalsIgnoreCase(format)) {
            return generateDeliveryExcel(shipments);
        } else if ("csv".equalsIgnoreCase(format)) {
            return generateDeliveryCSV(shipments);
        }
        return generateDeliveryPDF(shipments);
    }

    // --- 3. ROUTE PERFORMANCE REPORT ---
    @Override
    public byte[] generateRoutePerformanceReport(String format, String userEmail) {
        List<Shipment> shipments = filterShipmentsByUserRole(userEmail);
        List<RouteReportItem> routeItems = new ArrayList<>();

        for (Shipment s : shipments) {
            Optional<Route> routeOpt = routeRepository.findByShipmentId(s.getId());
            double dist = routeOpt.map(Route::getDistanceKm).orElse(0.0);
            int estMin = routeOpt.map(Route::getEstimatedTimeMinutes).orElse(0);
            int actMin = routeOpt.map(Route::getActualTimeMinutes).orElse(0);
            String routeStatus = routeOpt.map(Route::getStatus).orElse(s.getStatus());

            String origin = routeOpt.map(Route::getOriginAddress)
                    .filter(o -> o != null && !o.isBlank())
                    .orElse(s.getPickupAddress());
            String destination = routeOpt.map(Route::getDestinationAddress)
                    .filter(d -> d != null && !d.isBlank())
                    .orElse(s.getDeliveryAddress());

            routeItems.add(new RouteReportItem(s.getId(), s.getTrackingNumber(), origin,
                    destination, dist, estMin, actMin, routeStatus));
        }

        if ("excel".equalsIgnoreCase(format) || "xlsx".equalsIgnoreCase(format)) {
            return generateRouteExcel(routeItems);
        } else if ("csv".equalsIgnoreCase(format)) {
            return generateRouteCSV(routeItems);
        }
        return generateRoutePDF(routeItems);
    }

    // --- 4. DELAY ANALYSIS REPORT ---
    @Override
    public byte[] generateDelayAnalysisReport(String format, String userEmail) {
        List<Shipment> shipments = filterShipmentsByUserRole(userEmail);
        List<DelayReportItem> delayItems = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now();

        for (Shipment s : shipments) {
            boolean isDelayedStatus = "DELAYED".equalsIgnoreCase(s.getStatus());
            boolean isDeliveredOverdue = s.getActualDeliveryDate() != null && s.getEstimatedDeliveryDate() != null &&
                                         s.getActualDeliveryDate().isAfter(s.getEstimatedDeliveryDate());
            boolean isInTransitOverdue = s.getActualDeliveryDate() == null && s.getEstimatedDeliveryDate() != null &&
                                         now.isAfter(s.getEstimatedDeliveryDate()) &&
                                         !"DELIVERED".equalsIgnoreCase(s.getStatus()) && !"CANCELLED".equalsIgnoreCase(s.getStatus());

            if (isDelayedStatus || isDeliveredOverdue || isInTransitOverdue) {
                long delayMinutes = 0;
                if (s.getEstimatedDeliveryDate() != null) {
                    LocalDateTime compareDate = s.getActualDeliveryDate() != null ? s.getActualDeliveryDate() : now;
                    if (compareDate.isAfter(s.getEstimatedDeliveryDate())) {
                        delayMinutes = Duration.between(s.getEstimatedDeliveryDate(), compareDate).toMinutes();
                    }
                }
                String reason = (s.getCancellationReason() != null && !s.getCancellationReason().isBlank())
                        ? s.getCancellationReason() : "Traffic / Weather Delay";
                delayItems.add(new DelayReportItem(s.getId(), s.getTrackingNumber(), s.getSenderName(),
                        s.getReceiverName(), s.getStatus(),
                        s.getEstimatedDeliveryDate() != null ? s.getEstimatedDeliveryDate().format(DATE_FORMATTER) : "N/A",
                        s.getActualDeliveryDate() != null ? s.getActualDeliveryDate().format(DATE_FORMATTER) : "In-Transit Overdue",
                        delayMinutes, reason));
            }
        }

        if ("excel".equalsIgnoreCase(format) || "xlsx".equalsIgnoreCase(format)) {
            return generateDelayExcel(delayItems);
        } else if ("csv".equalsIgnoreCase(format)) {
            return generateDelayCSV(delayItems);
        }
        return generateDelayPDF(delayItems);
    }

    // ==========================================
    // CSV GENERATORS
    // ==========================================
    private byte[] generateShipmentsCSV(List<Shipment> shipments) {
        StringBuilder sb = new StringBuilder();
        sb.append("ID,Tracking Number,Status,Priority,Sender Name,Receiver Name,Pickup Address,Delivery Address,Created At\n");
        for (Shipment s : shipments) {
            sb.append(s.getId() != null ? s.getId() : "").append(",")
              .append(escapeCsv(s.getTrackingNumber())).append(",")
              .append(escapeCsv(s.getStatus())).append(",")
              .append(escapeCsv(s.getPriority())).append(",")
              .append(escapeCsv(s.getSenderName())).append(",")
              .append(escapeCsv(s.getReceiverName())).append(",")
              .append(escapeCsv(s.getPickupAddress())).append(",")
              .append(escapeCsv(s.getDeliveryAddress())).append(",")
              .append(s.getCreatedAt() != null ? s.getCreatedAt().format(DATE_FORMATTER) : "").append("\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private byte[] generateDeliveryCSV(List<Shipment> shipments) {
        StringBuilder sb = new StringBuilder();
        sb.append("Shipment ID,Tracking #,Receiver Name,Delivery Address,Actual Delivery Date,POD Verification Status\n");
        for (Shipment s : shipments) {
            Optional<ProofOfDelivery> pod = podRepository.findByShipmentId(s.getId());
            String podStatus = pod.map(ProofOfDelivery::getVerificationStatus).orElse("N/A");
            sb.append(s.getId() != null ? s.getId() : "").append(",")
              .append(escapeCsv(s.getTrackingNumber())).append(",")
              .append(escapeCsv(s.getReceiverName())).append(",")
              .append(escapeCsv(s.getDeliveryAddress())).append(",")
              .append(s.getActualDeliveryDate() != null ? s.getActualDeliveryDate().format(DATE_FORMATTER) : "N/A").append(",")
              .append(escapeCsv(podStatus)).append("\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private byte[] generateRouteCSV(List<RouteReportItem> items) {
        StringBuilder sb = new StringBuilder();
        sb.append("Shipment ID,Tracking #,Origin,Destination,Distance (km),Est. Time (min),Actual Time (min),Status\n");
        for (RouteReportItem r : items) {
            sb.append(r.shipmentId != null ? r.shipmentId : "").append(",")
              .append(escapeCsv(r.trackingNumber)).append(",")
              .append(escapeCsv(r.origin)).append(",")
              .append(escapeCsv(r.destination)).append(",")
              .append(r.distanceKm).append(",")
              .append(r.estTimeMin).append(",")
              .append(r.actTimeMin).append(",")
              .append(escapeCsv(r.status)).append("\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private byte[] generateDelayCSV(List<DelayReportItem> items) {
        StringBuilder sb = new StringBuilder();
        sb.append("Shipment ID,Tracking #,Sender,Receiver,Status,Est. Delivery,Actual Delivery,Delay (Mins),Reason\n");
        for (DelayReportItem d : items) {
            sb.append(d.shipmentId != null ? d.shipmentId : "").append(",")
              .append(escapeCsv(d.trackingNumber)).append(",")
              .append(escapeCsv(d.sender)).append(",")
              .append(escapeCsv(d.receiver)).append(",")
              .append(escapeCsv(d.status)).append(",")
              .append(escapeCsv(d.estDelivery)).append(",")
              .append(escapeCsv(d.actDelivery)).append(",")
              .append(d.delayMinutes).append(",")
              .append(escapeCsv(d.reason)).append("\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    // ==========================================
    // EXCEL GENERATORS
    // ==========================================
    private byte[] generateShipmentsExcel(List<Shipment> shipments) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Shipments Report");
            CellStyle headerStyle = createHeaderStyle(workbook);

            Row headerRow = sheet.createRow(0);
            String[] headers = {"ID", "Tracking Number", "Status", "Priority", "Sender Name", "Receiver Name", "Pickup Address", "Delivery Address", "Created At"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Shipment s : shipments) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(s.getId() != null ? s.getId() : 0);
                row.createCell(1).setCellValue(s.getTrackingNumber() != null ? s.getTrackingNumber() : "");
                row.createCell(2).setCellValue(s.getStatus() != null ? s.getStatus() : "");
                row.createCell(3).setCellValue(s.getPriority() != null ? s.getPriority() : "");
                row.createCell(4).setCellValue(s.getSenderName() != null ? s.getSenderName() : "");
                row.createCell(5).setCellValue(s.getReceiverName() != null ? s.getReceiverName() : "");
                row.createCell(6).setCellValue(s.getPickupAddress() != null ? s.getPickupAddress() : "");
                row.createCell(7).setCellValue(s.getDeliveryAddress() != null ? s.getDeliveryAddress() : "");
                row.createCell(8).setCellValue(s.getCreatedAt() != null ? s.getCreatedAt().format(DATE_FORMATTER) : "");
            }

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate Shipments Excel", e);
            throw new RuntimeException("Excel generation failed", e);
        }
    }

    private byte[] generateDeliveryExcel(List<Shipment> shipments) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Delivery Report");
            CellStyle headerStyle = createHeaderStyle(workbook);

            Row headerRow = sheet.createRow(0);
            String[] headers = {"Shipment ID", "Tracking #", "Receiver Name", "Delivery Address", "Actual Delivery Date", "POD Verification Status"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Shipment s : shipments) {
                Optional<ProofOfDelivery> pod = podRepository.findByShipmentId(s.getId());
                String podStatus = pod.map(ProofOfDelivery::getVerificationStatus).orElse("N/A");

                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(s.getId() != null ? s.getId() : 0);
                row.createCell(1).setCellValue(s.getTrackingNumber() != null ? s.getTrackingNumber() : "");
                row.createCell(2).setCellValue(s.getReceiverName() != null ? s.getReceiverName() : "");
                row.createCell(3).setCellValue(s.getDeliveryAddress() != null ? s.getDeliveryAddress() : "");
                row.createCell(4).setCellValue(s.getActualDeliveryDate() != null ? s.getActualDeliveryDate().format(DATE_FORMATTER) : "N/A");
                row.createCell(5).setCellValue(podStatus != null ? podStatus : "N/A");
            }

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate Delivery Excel", e);
            throw new RuntimeException("Delivery Excel failed", e);
        }
    }

    private byte[] generateRouteExcel(List<RouteReportItem> items) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Route Performance");
            CellStyle headerStyle = createHeaderStyle(workbook);

            Row headerRow = sheet.createRow(0);
            String[] headers = {"Shipment ID", "Tracking #", "Origin", "Destination", "Distance (km)", "Est. Time (min)", "Actual Time (min)", "Status"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (RouteReportItem r : items) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(r.shipmentId != null ? r.shipmentId : 0);
                row.createCell(1).setCellValue(r.trackingNumber != null ? r.trackingNumber : "");
                row.createCell(2).setCellValue(r.origin != null ? r.origin : "");
                row.createCell(3).setCellValue(r.destination != null ? r.destination : "");
                row.createCell(4).setCellValue(r.distanceKm);
                row.createCell(5).setCellValue(r.estTimeMin);
                row.createCell(6).setCellValue(r.actTimeMin);
                row.createCell(7).setCellValue(r.status != null ? r.status : "");
            }

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate Route Excel", e);
            throw new RuntimeException("Route Excel failed", e);
        }
    }

    private byte[] generateDelayExcel(List<DelayReportItem> items) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Delay Analysis");
            CellStyle headerStyle = createHeaderStyle(workbook);

            Row headerRow = sheet.createRow(0);
            String[] headers = {"Shipment ID", "Tracking #", "Sender", "Receiver", "Status", "Est. Delivery", "Actual Delivery", "Delay (Mins)", "Reason"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (DelayReportItem d : items) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(d.shipmentId != null ? d.shipmentId : 0);
                row.createCell(1).setCellValue(d.trackingNumber != null ? d.trackingNumber : "");
                row.createCell(2).setCellValue(d.sender != null ? d.sender : "");
                row.createCell(3).setCellValue(d.receiver != null ? d.receiver : "");
                row.createCell(4).setCellValue(d.status != null ? d.status : "");
                row.createCell(5).setCellValue(d.estDelivery != null ? d.estDelivery : "");
                row.createCell(6).setCellValue(d.actDelivery != null ? d.actDelivery : "");
                row.createCell(7).setCellValue(d.delayMinutes);
                row.createCell(8).setCellValue(d.reason != null ? d.reason : "");
            }

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate Delay Excel", e);
            throw new RuntimeException("Delay Excel failed", e);
        }
    }

    // ==========================================
    // PDF GENERATORS
    // ==========================================
    private byte[] generateShipmentsPDF(List<Shipment> shipments) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, out);
            document.open();

            addPDFTitle(document, "ShipTrack Pro - Shipment Summary Report");

            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1, 3, 2, 2, 3, 3, 3});
            addTableHeader(table, new String[]{"ID", "Tracking #", "Status", "Priority", "Sender", "Receiver", "Created At"});

            com.lowagie.text.Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            for (Shipment s : shipments) {
                table.addCell(new Phrase(String.valueOf(s.getId() != null ? s.getId() : ""), bodyFont));
                table.addCell(new Phrase(s.getTrackingNumber() != null ? s.getTrackingNumber() : "", bodyFont));
                table.addCell(new Phrase(s.getStatus() != null ? s.getStatus() : "", bodyFont));
                table.addCell(new Phrase(s.getPriority() != null ? s.getPriority() : "", bodyFont));
                table.addCell(new Phrase(s.getSenderName() != null ? s.getSenderName() : "", bodyFont));
                table.addCell(new Phrase(s.getReceiverName() != null ? s.getReceiverName() : "", bodyFont));
                table.addCell(new Phrase(s.getCreatedAt() != null ? s.getCreatedAt().format(DATE_FORMATTER) : "", bodyFont));
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate Shipments PDF", e);
            throw new RuntimeException("PDF generation failed", e);
        }
    }

    private byte[] generateDeliveryPDF(List<Shipment> shipments) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, out);
            document.open();

            addPDFTitle(document, "ShipTrack Pro - Delivery & Proof of Delivery Report");

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1, 3, 3, 4, 3, 2});
            addTableHeader(table, new String[]{"ID", "Tracking #", "Receiver", "Delivery Address", "Delivered At", "POD Status"});

            com.lowagie.text.Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            for (Shipment s : shipments) {
                Optional<ProofOfDelivery> pod = podRepository.findByShipmentId(s.getId());
                String podStatus = pod.map(ProofOfDelivery::getVerificationStatus).orElse("N/A");

                table.addCell(new Phrase(String.valueOf(s.getId() != null ? s.getId() : ""), bodyFont));
                table.addCell(new Phrase(s.getTrackingNumber() != null ? s.getTrackingNumber() : "", bodyFont));
                table.addCell(new Phrase(s.getReceiverName() != null ? s.getReceiverName() : "", bodyFont));
                table.addCell(new Phrase(s.getDeliveryAddress() != null ? s.getDeliveryAddress() : "", bodyFont));
                table.addCell(new Phrase(s.getActualDeliveryDate() != null ? s.getActualDeliveryDate().format(DATE_FORMATTER) : "N/A", bodyFont));
                table.addCell(new Phrase(podStatus != null ? podStatus : "N/A", bodyFont));
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate Delivery PDF", e);
            throw new RuntimeException("Delivery PDF failed", e);
        }
    }

    private byte[] generateRoutePDF(List<RouteReportItem> items) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, out);
            document.open();

            addPDFTitle(document, "ShipTrack Pro - Route Performance Report");

            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1, 3, 3, 3, 2, 2, 2});
            addTableHeader(table, new String[]{"ID", "Tracking #", "Origin", "Destination", "Distance (km)", "Est. (min)", "Actual (min)"});

            com.lowagie.text.Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            for (RouteReportItem r : items) {
                table.addCell(new Phrase(String.valueOf(r.shipmentId != null ? r.shipmentId : ""), bodyFont));
                table.addCell(new Phrase(r.trackingNumber != null ? r.trackingNumber : "", bodyFont));
                table.addCell(new Phrase(r.origin != null ? r.origin : "", bodyFont));
                table.addCell(new Phrase(r.destination != null ? r.destination : "", bodyFont));
                table.addCell(new Phrase(String.valueOf(r.distanceKm), bodyFont));
                table.addCell(new Phrase(String.valueOf(r.estTimeMin), bodyFont));
                table.addCell(new Phrase(String.valueOf(r.actTimeMin), bodyFont));
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate Route PDF", e);
            throw new RuntimeException("Route PDF failed", e);
        }
    }

    private byte[] generateDelayPDF(List<DelayReportItem> items) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, out);
            document.open();

            addPDFTitle(document, "ShipTrack Pro - Delay Analysis Report");

            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1, 3, 3, 3, 3, 2, 3});
            addTableHeader(table, new String[]{"ID", "Tracking #", "Sender", "Receiver", "Est. Delivery", "Delay (m)", "Reason"});

            com.lowagie.text.Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9);
            for (DelayReportItem d : items) {
                table.addCell(new Phrase(String.valueOf(d.shipmentId != null ? d.shipmentId : ""), bodyFont));
                table.addCell(new Phrase(d.trackingNumber != null ? d.trackingNumber : "", bodyFont));
                table.addCell(new Phrase(d.sender != null ? d.sender : "", bodyFont));
                table.addCell(new Phrase(d.receiver != null ? d.receiver : "", bodyFont));
                table.addCell(new Phrase(d.estDelivery != null ? d.estDelivery : "N/A", bodyFont));
                table.addCell(new Phrase(String.valueOf(d.delayMinutes), bodyFont));
                table.addCell(new Phrase(d.reason != null ? d.reason : "", bodyFont));
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate Delay PDF", e);
            throw new RuntimeException("Delay PDF failed", e);
        }
    }

    // --- Helpers ---
    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle headerStyle = workbook.createCellStyle();
        org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
        headerFont.setBold(true);
        headerStyle.setFont(headerFont);
        return headerStyle;
    }

    private void addPDFTitle(Document document, String titleStr) throws DocumentException {
        com.lowagie.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.BLUE);
        Paragraph title = new Paragraph(titleStr, titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        document.add(title);
        document.add(new Paragraph(" "));
    }

    private void addTableHeader(PdfPTable table, String[] headers) {
        com.lowagie.text.Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE);
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, headFont));
            cell.setBackgroundColor(Color.GRAY);
            cell.setPadding(5);
            table.addCell(cell);
        }
    }

    // --- Legacy / Helper Methods ---
    @Override
    public byte[] generateShipmentsCSVReport() {
        return generateShipmentReport("csv", null);
    }

    @Override
    public byte[] generateShipmentsExcelReport() {
        return generateShipmentReport("excel", null);
    }

    @Override
    public byte[] generateShipmentsPDFReport() {
        return generateShipmentReport("pdf", null);
    }

    @Override
    public Map<String, Object> getDeliveryPerformanceMetrics() {
        List<Shipment> shipments = shipmentRepository.findAll();
        long total = shipments.size();
        long delivered = shipments.stream().filter(s -> "DELIVERED".equalsIgnoreCase(s.getStatus())).count();
        long inTransit = shipments.stream().filter(s -> "IN_TRANSIT".equalsIgnoreCase(s.getStatus())).count();
        long pending = shipments.stream().filter(s -> "PENDING".equalsIgnoreCase(s.getStatus())).count();
        long cancelled = shipments.stream().filter(s -> "CANCELLED".equalsIgnoreCase(s.getStatus())).count();

        double deliverySuccessRate = total > 0 ? ((double) delivered / total) * 100 : 0.0;

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalShipments", total);
        metrics.put("deliveredCount", delivered);
        metrics.put("inTransitCount", inTransit);
        metrics.put("pendingCount", pending);
        metrics.put("cancelledCount", cancelled);
        metrics.put("deliverySuccessRatePercent", Math.round(deliverySuccessRate * 100.0) / 100.0);
        return metrics;
    }

    private static class RouteReportItem {
        Long shipmentId;
        String trackingNumber;
        String origin;
        String destination;
        double distanceKm;
        int estTimeMin;
        int actTimeMin;
        String status;

        RouteReportItem(Long shipmentId, String trackingNumber, String origin, String destination, double distanceKm, int estTimeMin, int actTimeMin, String status) {
            this.shipmentId = shipmentId;
            this.trackingNumber = trackingNumber != null ? trackingNumber : "";
            this.origin = origin != null ? origin : "";
            this.destination = destination != null ? destination : "";
            this.distanceKm = distanceKm;
            this.estTimeMin = estTimeMin;
            this.actTimeMin = actTimeMin;
            this.status = status != null ? status : "";
        }
    }

    private static class DelayReportItem {
        Long shipmentId;
        String trackingNumber;
        String sender;
        String receiver;
        String status;
        String estDelivery;
        String actDelivery;
        long delayMinutes;
        String reason;

        DelayReportItem(Long shipmentId, String trackingNumber, String sender, String receiver, String status, String estDelivery, String actDelivery, long delayMinutes, String reason) {
            this.shipmentId = shipmentId;
            this.trackingNumber = trackingNumber != null ? trackingNumber : "";
            this.sender = sender != null ? sender : "";
            this.receiver = receiver != null ? receiver : "";
            this.status = status != null ? status : "";
            this.estDelivery = estDelivery != null ? estDelivery : "N/A";
            this.actDelivery = actDelivery != null ? actDelivery : "N/A";
            this.delayMinutes = delayMinutes;
            this.reason = reason != null ? reason : "";
        }
    }
}
