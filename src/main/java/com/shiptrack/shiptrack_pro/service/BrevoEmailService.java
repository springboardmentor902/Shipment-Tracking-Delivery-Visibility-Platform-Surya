package com.shiptrack.shiptrack_pro.service;

import com.shiptrack.shiptrack_pro.entity.Shipment;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class BrevoEmailService {

    private final JavaMailSender mailSender;

    @Value("${brevo.sender.email:'suryalbrcem9@gmail.com'}")
    private String senderEmail;

    @Value("${brevo.sender.name:'ShipTrack Pro'}")
    private String senderName;

    private static final String DEFAULT_EMAIL = "suryalbrcem9@gmail.com";

    /**
     * Send email notifications on successful shipment creation to BOTH Sender and Receiver.
     */
    public void sendShipmentConfirmation(Shipment shipment) {
        if (shipment == null) return;

        String sEmail = (shipment.getSenderEmail() != null && !shipment.getSenderEmail().trim().isEmpty())
                ? shipment.getSenderEmail().trim() : DEFAULT_EMAIL;
        String rEmail = (shipment.getReceiverEmail() != null && !shipment.getReceiverEmail().trim().isEmpty())
                ? shipment.getReceiverEmail().trim() : DEFAULT_EMAIL;

        // 1. Send Creation Email to Sender
        sendSmtpEmail(
                sEmail,
                "Shipment Dispatch Created - Tracking #" + shipment.getTrackingNumber(),
                buildSenderCreationHtml(shipment)
        );

        // 2. Send Creation Email to Receiver
        sendSmtpEmail(
                rEmail,
                "Shipment Scheduled for Delivery - Tracking #" + shipment.getTrackingNumber(),
                buildReceiverCreationHtml(shipment)
        );

        log.info("Brevo creation email dispatched for tracking #: {} to Sender ({}) and Receiver ({})",
                shipment.getTrackingNumber(), sEmail, rEmail);
    }

    /**
     * Send email notifications on successful shipment delivery to BOTH Sender and Receiver.
     */
    public void sendDeliveryNotification(Shipment shipment) {
        if (shipment == null) return;

        String sEmail = (shipment.getSenderEmail() != null && !shipment.getSenderEmail().trim().isEmpty())
                ? shipment.getSenderEmail().trim() : DEFAULT_EMAIL;
        String rEmail = (shipment.getReceiverEmail() != null && !shipment.getReceiverEmail().trim().isEmpty())
                ? shipment.getReceiverEmail().trim() : DEFAULT_EMAIL;

        // 1. Send Successful Delivery Email to Sender
        sendSmtpEmail(
                sEmail,
                "Shipment Delivered Successfully - Tracking #" + shipment.getTrackingNumber(),
                buildSenderDeliveryHtml(shipment)
        );

        // 2. Send Successful Delivery Email to Receiver
        sendSmtpEmail(
                rEmail,
                "Package Delivered - Tracking #" + shipment.getTrackingNumber(),
                buildReceiverDeliveryHtml(shipment)
        );

        log.info("Brevo delivery email dispatched for tracking #: {} to Sender ({}) and Receiver ({})",
                shipment.getTrackingNumber(), sEmail, rEmail);
    }

    private void sendSmtpEmail(String recipientEmail, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(senderEmail, senderName);
            helper.setTo(recipientEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Successfully dispatched Brevo SMTP email to {} for subject: {}", recipientEmail, subject);

        } catch (Exception e) {
            log.error("Failed to send Brevo SMTP email to {}: {}", recipientEmail, e.getMessage());
        }
    }

    private String buildSenderCreationHtml(Shipment shipment) {
        return """
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #2563eb;">📦 ShipTrack Pro - Shipment Created</h2>
                <p>Hello <strong>%s</strong> (Sender),</p>
                <p>Your shipment has been successfully registered and queued for pickup/delivery.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #2563eb;">
                    <p><strong>Tracking Number:</strong> <span style="font-size: 1.1em; color: #2563eb;">%s</span></p>
                    <p><strong>Receiver Name:</strong> %s</p>
                    <p><strong>Pickup Address:</strong> %s</p>
                    <p><strong>Delivery Address:</strong> %s</p>
                    <p><strong>Priority:</strong> %s</p>
                </div>
                <p>Thank you for shipping with ShipTrack Pro!</p>
            </div>
            """.formatted(
                shipment.getSenderName(),
                shipment.getTrackingNumber(),
                shipment.getReceiverName(),
                shipment.getPickupAddress(),
                shipment.getDeliveryAddress(),
                shipment.getPriority() != null ? shipment.getPriority() : "STANDARD"
        );
    }

    private String buildReceiverCreationHtml(Shipment shipment) {
        return """
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #e0e0e0; border-radius: 8px;">
                <h2 style="color: #2563eb;">🚚 ShipTrack Pro - Delivery Scheduled</h2>
                <p>Hello <strong>%s</strong> (Receiver),</p>
                <p>A new package sent by <strong>%s</strong> is scheduled for delivery to your address.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #2563eb;">
                    <p><strong>Tracking Number:</strong> <span style="font-size: 1.1em; color: #2563eb;">%s</span></p>
                    <p><strong>Sender:</strong> %s</p>
                    <p><strong>Pickup Address:</strong> %s</p>
                    <p><strong>Delivery Address:</strong> %s</p>
                    <p><strong>Priority:</strong> %s</p>
                </div>
                <p>Track your shipment status in real-time on ShipTrack Pro!</p>
            </div>
            """.formatted(
                shipment.getReceiverName(),
                shipment.getSenderName(),
                shipment.getTrackingNumber(),
                shipment.getSenderName(),
                shipment.getPickupAddress(),
                shipment.getDeliveryAddress(),
                shipment.getPriority() != null ? shipment.getPriority() : "STANDARD"
        );
    }

    private String buildSenderDeliveryHtml(Shipment shipment) {
        return """
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #10b981; border-radius: 8px;">
                <h2 style="color: #059669;">✅ ShipTrack Pro - Shipment Delivered</h2>
                <p>Hello <strong>%s</strong> (Sender),</p>
                <p>Great news! Your shipment <strong>#%s</strong> has been successfully delivered to <strong>%s</strong>.</p>
                <div style="background-color: #ecfdf5; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #10b981;">
                    <p><strong>Tracking Number:</strong> <span style="font-size: 1.1em; color: #047857;">%s</span></p>
                    <p><strong>Recipient Name:</strong> %s</p>
                    <p><strong>Delivery Address:</strong> %s</p>
                    <p><strong>Status:</strong> <span style="color: #047857; font-weight: bold;">DELIVERED</span></p>
                </div>
                <p>Proof of Delivery (Digital Signature & Photo) is available on your dashboard.</p>
            </div>
            """.formatted(
                shipment.getSenderName(),
                shipment.getTrackingNumber(),
                shipment.getReceiverName(),
                shipment.getTrackingNumber(),
                shipment.getReceiverName(),
                shipment.getDeliveryAddress()
        );
    }

    private String buildReceiverDeliveryHtml(Shipment shipment) {
        return """
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; border: 1px solid #10b981; border-radius: 8px;">
                <h2 style="color: #059669;">🎉 ShipTrack Pro - Package Delivered</h2>
                <p>Hello <strong>%s</strong> (Receiver),</p>
                <p>Your package sent by <strong>%s</strong> has been successfully delivered!</p>
                <div style="background-color: #ecfdf5; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #10b981;">
                    <p><strong>Tracking Number:</strong> <span style="font-size: 1.1em; color: #047857;">%s</span></p>
                    <p><strong>Sender:</strong> %s</p>
                    <p><strong>Delivery Address:</strong> %s</p>
                    <p><strong>Status:</strong> <span style="color: #047857; font-weight: bold;">DELIVERED</span></p>
                </div>
                <p>Thank you for receiving your shipment with ShipTrack Pro!</p>
            </div>
            """.formatted(
                shipment.getReceiverName(),
                shipment.getSenderName(),
                shipment.getTrackingNumber(),
                shipment.getSenderName(),
                shipment.getDeliveryAddress()
        );
    }
}
