-- Test Data for ShipTrack Pro
-- This script inserts test data for testing without Google Maps API

-- Clear existing test data (optional - uncomment if needed)
-- DELETE FROM package WHERE shipment_id IN (SELECT id FROM shipment WHERE tracking_number LIKE 'TEST%');
-- DELETE FROM route WHERE shipment_id IN (SELECT id FROM shipment WHERE tracking_number LIKE 'TEST%');
-- DELETE FROM shipment WHERE tracking_number LIKE 'TEST%';
-- DELETE FROM users WHERE email LIKE '%test%';

-- Insert Test Users
INSERT INTO users (full_name, email, password, phone, role, status, created_at, updated_at) VALUES
('Test Admin', 'admin@shiptrack.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '+1234567890', 'ADMINISTRATOR', 'ACTIVE', NOW(), NOW()),
('Test Customer', 'customer@test.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '+1234567891', 'CUSTOMER', 'ACTIVE', NOW(), NOW()),
('Test Operator', 'operator@test.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', '+1234567892', 'LOGISTICS_OPERATOR', 'ACTIVE', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Get user IDs for reference (these will be used in subsequent inserts)
-- Note: In a real scenario, you would query these IDs. For this script, we'll assume IDs 1, 2, 3.

-- Insert Test Shipments
INSERT INTO shipment (tracking_number, sender_name, sender_address, receiver_name, receiver_address, pickup_address, delivery_address, user_id, status, created_at, updated_at) VALUES
('TEST001', 'John Smith', '123 Main St, New York, NY 10001', 'Jane Doe', '456 Oak Ave, Boston, MA 02101', '123 Main St, New York, NY 10001', '456 Oak Ave, Boston, MA 02101', 2, 'PENDING', NOW(), NOW()),
('TEST002', 'Alice Johnson', '789 Pine Rd, Los Angeles, CA 90001', 'Bob Wilson', '321 Elm St, Chicago, IL 60601', '789 Pine Rd, Los Angeles, CA 90001', '321 Elm St, Chicago, IL 60601', 2, 'IN_TRANSIT', NOW(), NOW()),
('TEST003', 'Charlie Brown', '555 Cedar Ln, Houston, TX 77001', 'Diana Prince', '999 Birch Blvd, Miami, FL 33101', '555 Cedar Ln, Houston, TX 77001', '999 Birch Blvd, Miami, FL 33101', 2, 'DELIVERED', NOW(), NOW())
ON CONFLICT (tracking_number) DO NOTHING;

-- Insert Test Packages
INSERT INTO package (shipment_id, description, weight, length, width, height, quantity, declared_value, fragile, created_at, updated_at) VALUES
(1, 'Electronics - Laptop', 2.5, 35, 25, 5, 1, 1500.00, true, NOW(), NOW()),
(2, 'Books - Box Set', 5.0, 30, 20, 15, 1, 100.00, false, NOW(), NOW()),
(3, 'Furniture - Chair', 15.0, 60, 60, 80, 1, 300.00, false, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert Test Routes (with hardcoded coordinates since Google Maps API is not configured)
INSERT INTO route (shipment_id, origin_address, origin_latitude, origin_longitude, destination_address, destination_latitude, destination_longitude, distance_km, estimated_time_minutes, driver_id, current_latitude, current_longitude, location_updated_at, status, created_at, updated_at) VALUES
-- Route for TEST001 (New York to Boston)
(1, '123 Main St, New York, NY 10001', 40.7128, -74.0060, '456 Oak Ave, Boston, MA 02101', 42.3601, -71.0589, 344.5, 240, NULL, NULL, NULL, NULL, 'ACTIVE', NOW(), NOW()),
-- Route for TEST002 (Los Angeles to Chicago) - with current location
(2, '789 Pine Rd, Los Angeles, CA 90001', 34.0522, -118.2437, '321 Elm St, Chicago, IL 60601', 41.8781, -87.6298, 2805.0, 1680, 1, 38.0000, -110.0000, NOW(), 'IN_TRANSIT', NOW(), NOW()),
-- Route for TEST003 (Houston to Miami) - delivered
(3, '555 Cedar Ln, Houston, TX 77001', 29.7604, -95.3698, '999 Birch Blvd, Miami, FL 33101', 25.7617, -80.1918, 1770.0, 1080, 1, 25.7617, -80.1918, NOW(), 'COMPLETED', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Verify the data
SELECT 'Users:' as info;
SELECT id, full_name, email, role, status FROM users WHERE email LIKE '%test%' OR email LIKE '%admin%';

SELECT 'Shipments:' as info;
SELECT id, tracking_number, sender_name, receiver_address, status FROM shipment WHERE tracking_number LIKE 'TEST%';

SELECT 'Packages:' as info;
SELECT p.id, p.description, p.weight, s.tracking_number FROM package p JOIN shipment s ON p.shipment_id = s.id WHERE s.tracking_number LIKE 'TEST%';

SELECT 'Routes:' as info;
SELECT r.id, r.shipment_id, r.origin_address, r.destination_address, r.distance_km, r.status, r.current_latitude, r.current_longitude FROM route r JOIN shipment s ON r.shipment_id = s.id WHERE s.tracking_number LIKE 'TEST%';
