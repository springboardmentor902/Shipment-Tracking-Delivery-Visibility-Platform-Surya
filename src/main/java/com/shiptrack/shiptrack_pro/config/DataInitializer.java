package com.shiptrack.shiptrack_pro.config;

import com.shiptrack.shiptrack_pro.entity.Package;
import com.shiptrack.shiptrack_pro.entity.Route;
import com.shiptrack.shiptrack_pro.entity.Shipment;
import com.shiptrack.shiptrack_pro.entity.User;
import com.shiptrack.shiptrack_pro.entity.ProofOfDelivery;
import com.shiptrack.shiptrack_pro.repository.PODRepository;
import com.shiptrack.shiptrack_pro.repository.PackageRepository;
import com.shiptrack.shiptrack_pro.repository.RouteRepository;
import com.shiptrack.shiptrack_pro.repository.ShipmentRepository;
import com.shiptrack.shiptrack_pro.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ShipmentRepository shipmentRepository;
    private final PackageRepository packageRepository;
    private final RouteRepository routeRepository;
    private final PODRepository podRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {

        log.info("Initializing test data...");

        // Create test users
        createTestUsers();

        // Create test shipments and packages
        createTestShipments();

        // Create test routes
        createTestRoutes();

        // Create test proof of deliveries
        createTestPODs();

        log.info("Test data initialization completed.");
    }

    // ============================================================
    // TEST USERS
    // ============================================================

    private void createTestUsers() {
        createOrUpdateUser("admin@shiptrack.com", "Test Admin", "Admin@123", "+1234567890", "ADMINISTRATOR");
        createOrUpdateUser("customer@test.com", "Test Customer", "Customer@123", "+1234567891", "CUSTOMER");
        createOrUpdateUser("operator@test.com", "Test Operator", "Operator@123", "+1234567892", "LOGISTICS_OPERATOR");
        createOrUpdateUser("business@test.com", "Test Business Client", "Business@123", "+1234567893", "BUSINESS_CLIENT");
        createOrUpdateUser("support@test.com", "Test Support Agent", "Support@123", "+1234567894", "SUPPORT_AGENT");

        log.info("Verified and updated test users: admin, customer, operator, business, support");
    }

    private void createOrUpdateUser(String email, String fullName, String rawPassword, String phone, String role) {
        User user = userRepository.findByEmail(email).orElseGet(() ->
                User.builder()
                        .email(email)
                        .createdAt(LocalDateTime.now())
                        .build()
        );
        user.setFullName(fullName);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setPhone(phone);
        user.setRole(role);
        user.setStatus("ACTIVE");
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    // ============================================================
    // TEST SHIPMENTS
    // ============================================================

    private void createTestShipments() {

        if (shipmentRepository.count() > 0) {
            log.info("Shipments already exist, skipping shipment creation.");
            return;
        }

        User customer = userRepository
                .findByEmail("customer@test.com")
                .orElse(null);

        if (customer == null) {
            log.warn("Customer not found, skipping shipment creation.");
            return;
        }

        // -------------------------
        // Shipment 1
        // -------------------------

        Shipment shipment1 = Shipment.builder()
                .trackingNumber("TEST001")
                .senderName("John Smith")
                .senderEmail("suryalbrcem9@gmail.com")
                .senderAddress("123 Main St, New York, NY 10001")
                .receiverName("Jane Doe")
                .receiverEmail("suryalbrcem9@gmail.com")
                .receiverAddress("456 Oak Ave, Boston, MA 02101")
                .pickupAddress("123 Main St, New York, NY 10001")
                .deliveryAddress("456 Oak Ave, Boston, MA 02101")
                .createdBy(customer.getId())
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // -------------------------
        // Shipment 2
        // -------------------------

        Shipment shipment2 = Shipment.builder()
                .trackingNumber("TEST002")
                .senderName("Alice Johnson")
                .senderEmail("suryalbrcem9@gmail.com")
                .senderAddress("789 Pine Rd, Los Angeles, CA 90001")
                .receiverName("Bob Wilson")
                .receiverEmail("suryalbrcem9@gmail.com")
                .receiverAddress("321 Elm St, Chicago, IL 60601")
                .pickupAddress("789 Pine Rd, Los Angeles, CA 90001")
                .deliveryAddress("321 Elm St, Chicago, IL 60601")
                .createdBy(customer.getId())
                .status("IN_TRANSIT")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // -------------------------
        // Shipment 3
        // -------------------------

        Shipment shipment3 = Shipment.builder()
                .trackingNumber("TEST003")
                .senderName("Charlie Brown")
                .senderEmail("suryalbrcem9@gmail.com")
                .senderAddress("555 Cedar Ln, Houston, TX 77001")
                .receiverName("Diana Prince")
                .receiverEmail("suryalbrcem9@gmail.com")
                .receiverAddress("999 Birch Blvd, Miami, FL 33101")
                .pickupAddress("555 Cedar Ln, Houston, TX 77001")
                .deliveryAddress("999 Birch Blvd, Miami, FL 33101")
                .createdBy(customer.getId())
                .status("DELIVERED")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        shipmentRepository.save(shipment1);
        shipmentRepository.save(shipment2);
        shipmentRepository.save(shipment3);

        log.info("Created test shipments: TEST001, TEST002, TEST003");

        // Create packages
        createTestPackages(shipment1, shipment2, shipment3);
    }

    // ============================================================
    // TEST PACKAGES
    // ============================================================

    private void createTestPackages(
            Shipment shipment1,
            Shipment shipment2,
            Shipment shipment3) {

        // -------------------------
        // Package 1
        // -------------------------

        Package package1 = Package.builder()
                .shipmentId(shipment1.getId())
                .description("Electronics - Laptop")
                .weight(BigDecimal.valueOf(2.5))
                .length(BigDecimal.valueOf(35))
                .width(BigDecimal.valueOf(25))
                .height(BigDecimal.valueOf(5))
                .quantity(1)
                .declaredValue(BigDecimal.valueOf(1500.00))
                .fragile(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // -------------------------
        // Package 2
        // -------------------------

        Package package2 = Package.builder()
                .shipmentId(shipment2.getId())
                .description("Books - Box Set")
                .weight(BigDecimal.valueOf(5.0))
                .length(BigDecimal.valueOf(30))
                .width(BigDecimal.valueOf(20))
                .height(BigDecimal.valueOf(15))
                .quantity(1)
                .declaredValue(BigDecimal.valueOf(100.00))
                .fragile(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        // -------------------------
        // Package 3
        // -------------------------

        Package package3 = Package.builder()
                .shipmentId(shipment3.getId())
                .description("Furniture - Chair")
                .weight(BigDecimal.valueOf(15.0))
                .length(BigDecimal.valueOf(60))
                .width(BigDecimal.valueOf(60))
                .height(BigDecimal.valueOf(80))
                .quantity(1)
                .declaredValue(BigDecimal.valueOf(300.00))
                .fragile(false)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        packageRepository.save(package1);
        packageRepository.save(package2);
        packageRepository.save(package3);

        log.info("Created test packages for shipments");
    }

    // ============================================================
    // TEST ROUTES
    // ============================================================

    private void createTestRoutes() {

        if (routeRepository.count() > 0) {
            log.info("Routes already exist, skipping route creation.");
            return;
        }

        Shipment shipment1 = shipmentRepository
                .findByTrackingNumber("TEST001")
                .orElse(null);

        Shipment shipment2 = shipmentRepository
                .findByTrackingNumber("TEST002")
                .orElse(null);

        Shipment shipment3 = shipmentRepository
                .findByTrackingNumber("TEST003")
                .orElse(null);

        // ========================================================
        // ROUTE 1
        // ========================================================

        if (shipment1 != null) {

            Route route1 = Route.builder()
                    .shipmentId(shipment1.getId())
                    .originAddress(shipment1.getPickupAddress())
                    .originLatitude(40.7128)
                    .originLongitude(-74.0060)
                    .destinationAddress(shipment1.getDeliveryAddress())
                    .destinationLatitude(42.3601)
                    .destinationLongitude(-71.0589)
                    .distanceKm(344.5)
                    .estimatedTimeMinutes(240)
                    .driverId(null)
                    .currentLatitude(null)
                    .currentLongitude(null)
                    .locationUpdatedAt(null)
                    .status("ACTIVE")
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            routeRepository.save(route1);
        }

        // ========================================================
        // ROUTE 2
        // ========================================================

        if (shipment2 != null) {

            Route route2 = Route.builder()
                    .shipmentId(shipment2.getId())
                    .originAddress(shipment2.getPickupAddress())
                    .originLatitude(34.0522)
                    .originLongitude(-118.2437)
                    .destinationAddress(shipment2.getDeliveryAddress())
                    .destinationLatitude(41.8781)
                    .destinationLongitude(-87.6298)
                    .distanceKm(2805.0)
                    .estimatedTimeMinutes(1680)
                    .driverId(1L)
                    .currentLatitude(38.0000)
                    .currentLongitude(-110.0000)
                    .locationUpdatedAt(LocalDateTime.now())
                    .status("IN_TRANSIT")
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            routeRepository.save(route2);
        }

        // ========================================================
        // ROUTE 3
        // ========================================================

        if (shipment3 != null) {

            Route route3 = Route.builder()
                    .shipmentId(shipment3.getId())
                    .originAddress(shipment3.getPickupAddress())
                    .originLatitude(29.7604)
                    .originLongitude(-95.3698)
                    .destinationAddress(shipment3.getDeliveryAddress())
                    .destinationLatitude(25.7617)
                    .destinationLongitude(-80.1918)
                    .distanceKm(1770.0)
                    .estimatedTimeMinutes(1080)
                    .driverId(1L)
                    .currentLatitude(25.7617)
                    .currentLongitude(-80.1918)
                    .locationUpdatedAt(LocalDateTime.now())
                    .status("COMPLETED")
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            routeRepository.save(route3);
        }

        log.info("Created test routes for shipments");
    }

    private void createTestPODs() {
        if (podRepository.count() > 0) {
            log.info("PODs already exist, skipping POD creation.");
            return;
        }

        Shipment shipment3 = shipmentRepository.findByTrackingNumber("TEST003").orElse(null);
        if (shipment3 != null) {
            ProofOfDelivery pod = ProofOfDelivery.builder()
                    .shipmentId(shipment3.getId())
                    .recipientName("Diana Prince")
                    .signatureData("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")
                    .photoUrl("https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=500")
                    .notes("Package handed directly to recipient at front entrance.")
                    .verificationStatus("PENDING")
                    .createdAt(LocalDateTime.now())
                    .build();

            podRepository.save(pod);
            log.info("Created test Proof of Delivery for shipment TEST003");
        }
    }
}