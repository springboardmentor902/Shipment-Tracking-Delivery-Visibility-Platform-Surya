# 🚚 Shipment Tracking & Delivery Visibility Platform (TrackShip Pro)

An enterprise-grade, real-time logistics monitoring, route optimization, and delivery visibility platform. Built with **Spring Boot** on the backend and **React (Vite)** on the frontend, this platform offers end-to-end visibility for logistics operators, business clients, drivers, and customers.

---

## 🌟 Why This System is Great ("How This is Good")

TrackShip Pro addresses key challenges in modern supply chain operations by providing real-time intelligence, automated route optimization, and complete delivery transparency:

* **⚡ Smart Route Optimization & Live Traffic Adjustment**:
  Integrated with Google Maps Directions API to fetch alternative travel paths (`alternatives=true`). It automatically selects the optimal path with the lowest traffic-adjusted transit time and documents the exact optimization reasoning.

* **🔄 Seamless Re-Routing with Historic Audit Trail**:
  Supports mid-transit re-routing without data loss. When a shipment is re-routed, the platform marks previous paths as historic (`isCurrent = false`) while promoting the newly optimized route to active status (`isCurrent = true`), preserving a complete history for audits.

* **📡 Real-Time Telemetry & WebSocket Tracking**:
  Broadcasts live driver GPS coordinates instantly via WebSockets (`STOMP/SockJS`) to subscribed tracking screens.

* **⏱️ Dynamic ETA Recalculation**:
  Recalculates estimated time of arrival dynamically every time a location update is received, keeping dispatchers and receivers informed of delays.

* **📊 Executive Admin Route Analytics**:
  Provides system-wide operational insights on Average Route Distance (km), Time-Estimate Accuracy (%), Best Performing Routes (lowest variance), and Worst Performing Routes (heavy traffic/delays).

* **🔐 Enterprise-Grade Role-Based Access Control (RBAC)**:
  Granular security scoping tailored for `ADMINISTRATOR`, `LOGISTICS_OPERATOR`, `BUSINESS_CLIENT`, and `CUSTOMER`.

* **📸 Verified Proof of Delivery (POD)**:
  Supports recipient digital signature collection and photo uploads with instant verification status updates.

---

## 🔄 How It Works (System Architecture & Operational Workflow)

```
┌─────────────────┐       ┌────────────────────────┐       ┌─────────────────────────┐
│ Shipment        │ ────> │ Geocoding & Route      │ ────> │ Live Telemetry &        │
│ Creation        │       │ Optimization Service   │       │ WebSocket Broadcast     │
└─────────────────┘       └────────────────────────┘       └─────────────────────────┘
                                                                        │
┌─────────────────┐       ┌────────────────────────┐                    ▼
│ Verified POD    │ <──── │ Dynamic ETA            │ <──────────────────┘
│ & Completion    │       │ Recalculation          │
└─────────────────┘       └────────────────────────┘
```

1. **Shipment Booking**: Dispatcher or client creates a new shipment with origin and destination addresses.
2. **Automated Route Optimization**: The backend geocodes both locations and queries Google Maps API for route alternatives. The `RouteOptimizationService` compares traffic durations, selects the fastest route, and logs the selection rationale.
3. **Live Driver Tracking**: As drivers send GPS updates, the backend updates the current location, broadcasts location frames via `/topic/shipment/{id}/location`, and triggers ETA recalculations.
4. **Re-Routing Support**: If traffic jams or detours occur, dispatchers generate an optimized re-route. The system archives the previous route and activates the new route seamlessly.
5. **Delivery Completion**: Receiver signs and uploads proof of delivery; status updates to `DELIVERED`.

---

## 🛠️ Implementation Process

The platform was built following clean architecture and domain-driven design principles:

### Phase 1: Core Domain & Data Layer (`Backend`)
- Designed JPA Entities: `Route`, `Shipment`, `ProofOfDelivery`, `ETAPrediction`, and `User`.
- Added the `isCurrent` boolean flag to `Route` entity to differentiate active routes from historic re-route paths.
- Built indexed repository queries in `RouteRepository`:
  - `findByShipmentIdAndIsCurrentTrue(Long shipmentId)`
  - `findByShipmentIdOrderByCreatedAtDesc(Long shipmentId)`

### Phase 2: Route Optimization & Google Maps Integration
- Created DTOs (`RouteAlternativeDTO`, `RouteOptimizationResultDTO`, `RouteResponse`).
- Updated `GoogleMapsService` to fetch alternative routes using `alternatives=true&departure_time=now` with fallback simulation routines for unconfigured environments.
- Implemented `RouteOptimizationService` to select routes based on minimum traffic-adjusted duration and generate natural language optimization summaries.

### Phase 3: Route Service & Controller Implementation
- Refactored `RouteServiceImpl.createRoute` to clear active status on prior routes (`isCurrent = false`), run route optimization, and set the new route to `isCurrent = true`.
- Implemented `GET /api/routes/{shipmentId}` (returns current active route) and `GET /api/routes/{shipmentId}/history` (returns complete chronological route history).

### Phase 4: Platform Analytics & Reporting Engine
- Added route performance metrics to `AnalyticsServiceImpl`: Average Distance, Time-Estimate Accuracy (%), Best Performing Route, and Worst Performing Route.
- Exposed metrics through `AdminAnalyticsResponse`.

### Phase 5: Frontend Development (`React + Vite`)
- Created `apiService.js` integrations for route history and analytics endpoints.
- Developed `RouteHistory.jsx` component to present a visual timeline of shipment routes with active/historic status badges and re-route simulation controls.
- Created **Admin Route Analytics & Optimization Insights** section in `AnalyticsDashboardTab.jsx`.

---

## 🚀 Getting Started & Setup Guide

### Prerequisites
- **Java 17+** & Maven
- **Node.js 18+** & npm
- **MySQL / H2 Database**

### 1. Backend Setup
```bash
# From the project root directory
mvn clean install
mvn spring-boot:run
```
*Backend API runs at:* `http://localhost:8080`

### 2. Frontend Setup
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
*Frontend runs at:* `http://localhost:5173`

---

## 🧪 Testing Re-Routing & Route History

1. Navigate to the **Shipments Dashboard**.
2. Click **History** on any active shipment.
3. In the Route History modal, click **Simulate Re-route**.
4. Enter a new origin or destination and submit.
5. Notice that the new route is marked **`CURRENT ACTIVE ROUTE`** in blue while the previous route is automatically moved to **`PREVIOUS ROUTE (RE-ROUTED)`**.
6. Check the **Admin Analytics Dashboard** to view updated Average Distance, Time-Estimate Accuracy %, Best Performing Route, and Worst Performing Route.
