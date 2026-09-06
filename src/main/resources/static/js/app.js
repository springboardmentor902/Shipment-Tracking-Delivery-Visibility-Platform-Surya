/* ============================================================
   SHIPTRACK PRO - CORE FRONTEND JAVASCRIPT APPLICATION
   ============================================================ */

class ShipTrackApp {
    constructor() {
        this.apiBase = window.location.origin;
        this.token = localStorage.getItem('shiptrack_token') || null;
        this.currentUser = JSON.parse(localStorage.getItem('shiptrack_user')) || null;
        
        // Map & Tracking state
        this.map = null;
        this.originMarker = null;
        this.destinationMarker = null;
        this.driverMarker = null;
        this.stompClient = null;
        this.activeSubscription = null;
        this.currentTrackedShipmentId = null;
        this.currentTrackedRouteId = null;

        // Cache
        this.shipmentsCache = [];
    }

    init() {
        this.setupTabNavigation();
        this.updateAuthUI();

        if (this.token && this.currentUser) {
            this.fetchShipments();
            if (this.currentUser.role === 'ADMINISTRATOR') {
                this.fetchAdminUsers();
            }
        }
    }

    // ==========================================
    // UI NAVIGATION & TAB SWITCHING
    // ==========================================
    setupTabNavigation() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });
    }

    switchTab(tabId) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        const targetBtn = document.querySelector(`.tab-btn[data-tab="${tabId}"]`);
        const targetContent = document.getElementById(tabId);

        if (targetBtn) targetBtn.classList.add('active');
        if (targetContent) targetContent.classList.add('active');

        // Tab specific actions
        if (tabId === 'trackingTab') {
            this.initLeafletMap();
        } else if (tabId === 'adminTab' && this.currentUser?.role === 'ADMINISTRATOR') {
            this.fetchAdminUsers();
        }
    }

    showAlert(message, type = 'success') {
        const banner = document.getElementById('alertBanner');
        banner.className = `alert-banner ${type}`;
        banner.innerHTML = message;
        banner.classList.remove('hidden');
        setTimeout(() => banner.classList.add('hidden'), 5000);
    }

    showModal(modalId) {
        document.getElementById(modalId)?.classList.remove('hidden');
    }

    hideModal(modalId) {
        document.getElementById(modalId)?.classList.add('hidden');
    }

    // ==========================================
    // AUTHENTICATION & QUICK DEMO LOGINS
    // ==========================================
    async handleLogin(event) {
        event.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        await this.login(email, password);
    }

    async quickLogin(email, password) {
        document.getElementById('loginEmail').value = email;
        document.getElementById('loginPassword').value = password;
        await this.login(email, password);
    }

    async login(email, password) {
        try {
            const response = await fetch(`${this.apiBase}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Login failed');
            }

            const data = await response.json();
            this.token = data.token;
            this.currentUser = data.user;

            localStorage.setItem('shiptrack_token', this.token);
            localStorage.setItem('shiptrack_user', JSON.stringify(this.currentUser));

            this.hideModal('loginModal');
            this.updateAuthUI();
            this.showAlert(`Welcome back, ${this.currentUser.fullName}!`, 'success');
            
            this.fetchShipments();
            if (this.currentUser.role === 'ADMINISTRATOR') {
                this.fetchAdminUsers();
            }

        } catch (error) {
            this.showAlert(error.message, 'danger');
        }
    }

    async handleRegister(event) {
        event.preventDefault();
        const payload = {
            fullName: document.getElementById('regFullName').value,
            email: document.getElementById('regEmail').value,
            password: document.getElementById('regPassword').value,
            phone: document.getElementById('regPhone').value,
            role: document.getElementById('regRole').value
        };

        try {
            const response = await fetch(`${this.apiBase}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Registration failed. Email may already be registered.');

            this.hideModal('registerModal');
            this.showAlert('Registration successful! Please log in with your credentials.', 'success');
            this.showModal('loginModal');

        } catch (error) {
            this.showAlert(error.message, 'danger');
        }
    }

    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('shiptrack_token');
        localStorage.removeItem('shiptrack_user');
        
        if (this.stompClient) {
            this.stompClient.deactivate();
        }

        this.updateAuthUI();
        this.showAlert('You have been logged out.', 'success');
        document.getElementById('shipmentsTableBody').innerHTML = '<tr><td colspan="8" class="text-center">Please login to view shipments.</td></tr>';
    }

    updateAuthUI() {
        const userBadge = document.getElementById('userBadge');
        const authButtons = document.getElementById('authButtons');
        const adminTabBtn = document.getElementById('adminTabBtn');
        const landingSection = document.getElementById('landingSection');
        const dashboardSection = document.getElementById('dashboardSection');

        if (this.token && this.currentUser) {
            userBadge.classList.remove('hidden');
            authButtons.classList.add('hidden');
            if (landingSection) landingSection.classList.add('hidden');
            if (dashboardSection) dashboardSection.classList.remove('hidden');

            document.getElementById('userName').textContent = this.currentUser.fullName;
            document.getElementById('userRole').textContent = this.currentUser.role;

            if (this.currentUser.role === 'ADMINISTRATOR') {
                if (adminTabBtn) adminTabBtn.classList.remove('hidden');
            } else {
                if (adminTabBtn) adminTabBtn.classList.add('hidden');
            }
        } else {
            userBadge.classList.add('hidden');
            authButtons.classList.remove('hidden');
            if (landingSection) landingSection.classList.remove('hidden');
            if (dashboardSection) dashboardSection.classList.add('hidden');
            if (adminTabBtn) adminTabBtn.classList.add('hidden');
        }
    }

    togglePasswordVisibility(inputId, iconId) {
        const input = document.getElementById(inputId);
        const icon = document.getElementById(iconId);
        if (!input || !icon) return;

        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fa-solid fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fa-solid fa-eye';
        }
    }

    // ==========================================
    // SHIPMENTS MANAGEMENT
    // ==========================================
    async fetchShipments() {
        if (!this.token) return;

        try {
            const response = await fetch(`${this.apiBase}/api/shipments`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch shipments');

            const shipments = await response.json();
            this.shipmentsCache = shipments;
            this.renderShipmentsTable(shipments);
            this.populateShipmentDropdowns(shipments);

        } catch (error) {
            console.error('Error loading shipments:', error);
        }
    }

    renderShipmentsTable(shipments) {
        const tbody = document.getElementById('shipmentsTableBody');
        if (!shipments || shipments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center">No shipments found.</td></tr>';
            return;
        }

        tbody.innerHTML = shipments.map(s => {
            const statusClass = s.status === 'DELIVERED' ? 'badge-delivered' :
                               s.status === 'IN_TRANSIT' ? 'badge-intransit' : 'badge-pending';
            const createdDate = s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A';
            const packageDesc = s.packages && s.packages.length > 0 ? s.packages[0].description : 'Standard Package';

            return `
                <tr>
                    <td><strong>${s.trackingNumber}</strong></td>
                    <td>${s.senderName}</td>
                    <td>${s.receiverName}<br><span class="text-muted text-sm">${s.deliveryAddress}</span></td>
                    <td><span class="badge ${statusClass}">${s.status}</span></td>
                    <td><span class="badge badge-role">${s.priority || 'STANDARD'}</span></td>
                    <td>${packageDesc}</td>
                    <td>${createdDate}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="app.trackShipment(${s.id})">
                            <i class="fa-solid fa-map-pin"></i> Track
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="app.quickETA(${s.id})">
                            <i class="fa-solid fa-clock"></i> ETA
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    populateShipmentDropdowns(shipments) {
        const trackingSelect = document.getElementById('trackingShipmentSelect');
        const etaSelect = document.getElementById('etaShipmentSelect');

        const options = '<option value="">-- Choose Shipment --</option>' + 
            shipments.map(s => `<option value="${s.id}">${s.trackingNumber} (${s.senderName} → ${s.receiverName})</option>`).join('');

        if (trackingSelect) trackingSelect.innerHTML = options;
        if (etaSelect) etaSelect.innerHTML = options;
    }

    async handleCreateShipment(event) {
        event.preventDefault();
        if (!this.token) {
            this.showAlert('Please login to create shipments.', 'danger');
            return;
        }

        const payload = {
            senderName: document.getElementById('senderName').value,
            senderPhone: document.getElementById('senderPhone').value,
            senderAddress: document.getElementById('senderAddress').value,
            receiverName: document.getElementById('receiverName').value,
            receiverPhone: document.getElementById('receiverPhone').value,
            receiverEmail: document.getElementById('receiverEmail').value,
            receiverAddress: document.getElementById('receiverAddress').value,
            pickupAddress: document.getElementById('pickupAddress').value,
            deliveryAddress: document.getElementById('deliveryAddress').value,
            priority: document.getElementById('priority').value,
            packages: [
                {
                    description: document.querySelector('.pkg-desc').value,
                    weight: parseFloat(document.querySelector('.pkg-weight').value),
                    quantity: parseInt(document.querySelector('.pkg-qty').value),
                    declaredValue: parseFloat(document.querySelector('.pkg-value').value),
                    length: parseFloat(document.querySelector('.pkg-length').value),
                    width: parseFloat(document.querySelector('.pkg-width').value),
                    height: parseFloat(document.querySelector('.pkg-height').value),
                    fragile: document.querySelector('.pkg-fragile').checked
                }
            ]
        };

        try {
            const response = await fetch(`${this.apiBase}/api/shipments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to create shipment');

            const created = await response.json();
            this.showAlert(`Shipment created successfully! Tracking #: ${created.trackingNumber}`, 'success');
            
            // Auto create route if operator/admin
            if (['LOGISTICS_OPERATOR', 'ADMINISTRATOR'].includes(this.currentUser?.role)) {
                await this.createRouteForShipment(created.id, created.pickupAddress, created.deliveryAddress);
            }

            this.fetchShipments();
            this.switchTab('shipmentsTab');

        } catch (error) {
            this.showAlert(error.message, 'danger');
        }
    }

    async createRouteForShipment(shipmentId, origin, destination) {
        try {
            await fetch(`${this.apiBase}/api/routes/${shipmentId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ originAddress: origin, destinationAddress: destination })
            });
        } catch (e) {
            console.warn('Could not auto-create route:', e);
        }
    }

    // ==========================================
    // MAP & REAL-TIME WEBSOCKET TRACKING
    // ==========================================
    initLeafletMap() {
        if (this.map) return; // already initialized

        // Default map center (US view)
        this.map = L.map('leafletMap').setView([39.8283, -98.5795], 4);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        this.connectWebSocket();
    }

    trackShipment(shipmentId) {
        this.switchTab('trackingTab');
        document.getElementById('trackingShipmentSelect').value = shipmentId;
        this.handleSelectTrackingShipment(shipmentId);
    }

    async handleSelectTrackingShipment(shipmentId) {
        if (!shipmentId) return;
        this.currentTrackedShipmentId = shipmentId;

        const shipment = this.shipmentsCache.find(s => s.id == shipmentId);
        if (shipment) {
            document.getElementById('trackingShipmentTitle').textContent = 
                `Tracking Shipment: ${shipment.trackingNumber} (${shipment.senderName} → ${shipment.receiverName})`;
        }

        // Fetch Route details
        try {
            const response = await fetch(`${this.apiBase}/api/routes/${shipmentId}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (response.ok) {
                const route = await response.json();
                this.currentTrackedRouteId = route.id;
                this.renderRouteOnMap(route);
            } else {
                this.showAlert('No route object registered for this shipment yet.', 'warning');
            }

        } catch (error) {
            console.error('Error fetching route:', error);
        }

        // Subscribe to WebSocket STOMP destination
        this.subscribeToShipmentLocation(shipmentId);
    }

    renderRouteOnMap(route) {
        if (!this.map) this.initLeafletMap();

        // Clear existing markers
        if (this.originMarker) this.map.removeLayer(this.originMarker);
        if (this.destinationMarker) this.map.removeLayer(this.destinationMarker);
        if (this.driverMarker) this.map.removeLayer(this.driverMarker);

        const latLngs = [];

        // Origin Marker (Blue)
        if (route.originLatitude && route.originLongitude) {
            const originPos = [route.originLatitude, route.originLongitude];
            this.originMarker = L.marker(originPos, {
                title: 'Origin: ' + route.originAddress
            }).addTo(this.map).bindPopup(`<b>Pickup Origin</b><br>${route.originAddress}`).openPopup();
            latLngs.push(originPos);
        }

        // Destination Marker (Green)
        if (route.destinationLatitude && route.destinationLongitude) {
            const destPos = [route.destinationLatitude, route.destinationLongitude];
            this.destinationMarker = L.marker(destPos, {
                title: 'Destination: ' + route.destinationAddress
            }).addTo(this.map).bindPopup(`<b>Destination</b><br>${route.destinationAddress}`);
            latLngs.push(destPos);
        }

        // Current Vehicle / Driver Marker (Red / Custom Icon)
        const currentLat = route.currentLatitude || route.originLatitude || 39.8283;
        const currentLng = route.currentLongitude || route.originLongitude || -98.5795;
        const currentPos = [currentLat, currentLng];

        this.driverMarker = L.circleMarker(currentPos, {
            radius: 10,
            fillColor: '#ef4444',
            color: '#ffffff',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.9
        }).addTo(this.map).bindPopup(`<b>Live Driver Position</b><br>Lat: ${currentLat}, Lng: ${currentLng}`);
        
        latLngs.push(currentPos);

        // Update simulator inputs
        document.getElementById('simLat').value = currentLat;
        document.getElementById('simLng').value = currentLng;

        // Update stats
        document.getElementById('routeDistance').innerHTML = `<i class="fa-solid fa-route"></i> Distance: ${route.distanceKm || '--'} km`;
        document.getElementById('routeTime').innerHTML = `<i class="fa-regular fa-clock"></i> Est: ${route.estimatedTimeMinutes || '--'} min`;

        if (latLngs.length > 0) {
            const bounds = L.latLngBounds(latLngs);
            this.map.fitBounds(bounds, { padding: [50, 50] });
        }
    }

    connectWebSocket() {
        const socket = new SockJS(`${this.apiBase}/api/ws/tracking`);
        this.stompClient = new stompjs.Client({
            webSocketFactory: () => socket,
            debug: false,
            reconnectDelay: 5000
        });

        this.stompClient.onConnect = () => {
            this.updateWSStatus(true);
            this.logWS('Connected to WebSocket broker at /api/ws/tracking');

            if (this.currentTrackedShipmentId) {
                this.subscribeToShipmentLocation(this.currentTrackedShipmentId);
            }
        };

        this.stompClient.onStompError = (frame) => {
            this.updateWSStatus(false);
            this.logWS('STOMP Error: ' + frame.headers['message']);
        };

        this.stompClient.activate();
    }

    subscribeToShipmentLocation(shipmentId) {
        if (!this.stompClient || !this.stompClient.connected) {
            this.logWS('WebSocket connecting... Subscription queued for shipment ' + shipmentId);
            return;
        }

        if (this.activeSubscription) {
            this.activeSubscription.unsubscribe();
        }

        const destination = `/topic/shipment/${shipmentId}/location`;
        this.logWS(`Subscribing to STOMP destination: ${destination}`);

        this.activeSubscription = this.stompClient.subscribe(destination, (message) => {
            const locationData = JSON.parse(message.body);
            this.logWS(`[GPS UPDATE] Lat: ${locationData.latitude}, Lng: ${locationData.longitude}`);
            this.onLocationReceived(locationData);
        });
    }

    onLocationReceived(data) {
        if (!this.driverMarker || !this.map) return;

        const newPos = [data.latitude, data.longitude];
        this.driverMarker.setLatLng(newPos);
        this.driverMarker.setPopupContent(`<b>Live Driver Position</b><br>Lat: ${data.latitude}, Lng: ${data.longitude}<br><small>${data.timestamp}</small>`);
        this.map.panTo(newPos);
    }

    async sendLiveLocationUpdate() {
        if (!this.currentTrackedRouteId) {
            this.showAlert('Please select a shipment with an active route first.', 'warning');
            return;
        }

        const lat = parseFloat(document.getElementById('simLat').value);
        const lng = parseFloat(document.getElementById('simLng').value);

        if (isNaN(lat) || isNaN(lng)) {
            this.showAlert('Enter valid numeric Latitude and Longitude values.', 'warning');
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/api/routes/${this.currentTrackedRouteId}/location`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ latitude: lat, longitude: lng })
            });

            if (!response.ok) throw new Error('Failed to update location');

            this.showAlert(`GPS coordinate updated: (${lat}, ${lng})`, 'success');

        } catch (error) {
            this.showAlert(error.message, 'danger');
        }
    }

    updateWSStatus(connected) {
        const badge = document.getElementById('wsStatus');
        if (connected) {
            badge.innerHTML = '<span class="status-dot connected"></span> WebSocket: Connected';
        } else {
            badge.innerHTML = '<span class="status-dot disconnected"></span> WebSocket: Disconnected';
        }
    }

    logWS(text) {
        const logBox = document.getElementById('wsLog');
        if (logBox) {
            const time = new Date().toLocaleTimeString();
            logBox.innerHTML += `<div>[${time}] ${text}</div>`;
            logBox.scrollTop = logBox.scrollHeight;
        }
    }

    // ==========================================
    // ETA & RISK PREDICTION ENGINE
    // ==========================================
    quickETA(shipmentId) {
        this.switchTab('etaTab');
        document.getElementById('etaShipmentSelect').value = shipmentId;
        this.fetchETAPrediction();
    }

    async fetchETAPrediction() {
        const shipmentId = document.getElementById('etaShipmentSelect').value;
        if (!shipmentId) {
            this.showAlert('Please select a shipment for ETA calculation.', 'warning');
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/api/eta/${shipmentId}/predict`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!response.ok) throw new Error('Failed to calculate ETA prediction');

            const prediction = await response.json();
            this.renderETAResults(prediction);

        } catch (error) {
            this.showAlert(error.message, 'danger');
        }
    }

    renderETAResults(pred) {
        document.getElementById('etaPredictionDisplay').classList.remove('hidden');

        // Formatted Time
        const etaDate = pred.predictedDeliveryTime ? new Date(pred.predictedDeliveryTime).toLocaleString() : 'Calculating...';
        document.getElementById('etaTimeValue').textContent = etaDate;

        // Risk Meter
        const riskScore = pred.delayRiskScore || 0;
        document.getElementById('riskScoreVal').textContent = `${riskScore} / 10`;
        document.getElementById('riskBarFill').style.width = `${(riskScore / 10) * 100}%`;

        // Risk Level Badge
        const riskBadge = document.getElementById('riskLevelBadge');
        let riskLevel = 'LOW';
        let badgeClass = 'badge-low';

        if (riskScore >= 8) { riskLevel = 'CRITICAL'; badgeClass = 'badge-critical'; }
        else if (riskScore >= 6) { riskLevel = 'HIGH'; badgeClass = 'badge-high'; }
        else if (riskScore >= 4) { riskLevel = 'MEDIUM'; badgeClass = 'badge-medium'; }

        riskBadge.className = `badge ${badgeClass}`;
        riskBadge.textContent = riskLevel;

        // Confidence
        document.getElementById('confidenceVal').textContent = `${pred.confidenceScore || 100}%`;

        // Parse Factors JSON
        const container = document.getElementById('riskFactorsContainer');
        if (pred.factors) {
            try {
                const factorsObj = typeof pred.factors === 'string' ? JSON.parse(pred.factors) : pred.factors;
                container.innerHTML = Object.entries(factorsObj).map(([key, val]) => `
                    <div class="risk-factor-item">
                        <span class="font-bold">${key.replace(/_/g, ' ').toUpperCase()}</span>
                        <span>${val}</span>
                    </div>
                `).join('');
            } catch (e) {
                container.innerHTML = `<p>${pred.factors}</p>`;
            }
        }
    }

    // ==========================================
    // ADMIN USER MANAGEMENT
    // ==========================================
    async fetchAdminUsers() {
        if (!this.token || this.currentUser?.role !== 'ADMINISTRATOR') return;

        try {
            const response = await fetch(`${this.apiBase}/api/admin/users`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!response.ok) throw new Error('Failed to fetch admin users');

            const users = await response.json();
            this.renderAdminUsersTable(users);

        } catch (error) {
            console.error('Error fetching admin users:', error);
        }
    }

    renderAdminUsersTable(users) {
        const tbody = document.getElementById('adminUsersTableBody');
        tbody.innerHTML = users.map(u => `
            <tr>
                <td>#${u.id}</td>
                <td><strong>${u.fullName}</strong></td>
                <td>${u.email}</td>
                <td>${u.phone || 'N/A'}</td>
                <td><span class="badge badge-role">${u.role}</span></td>
                <td><span class="badge badge-delivered">${u.status}</span></td>
                <td>
                    <select onchange="app.changeUserRole(${u.id}, this.value)" class="btn-sm">
                        <option value="">-- Change Role --</option>
                        <option value="CUSTOMER">CUSTOMER</option>
                        <option value="BUSINESS_CLIENT">BUSINESS_CLIENT</option>
                        <option value="LOGISTICS_OPERATOR">LOGISTICS_OPERATOR</option>
                        <option value="SUPPORT_AGENT">SUPPORT_AGENT</option>
                    </select>
                </td>
            </tr>
        `).join('');
    }

    async changeUserRole(userId, newRole) {
        if (!newRole) return;

        try {
            const response = await fetch(`${this.apiBase}/api/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ role: newRole })
            });

            if (!response.ok) throw new Error('Role update failed.');

            this.showAlert(`User role updated to ${newRole}`, 'success');
            this.fetchAdminUsers();

        } catch (error) {
            this.showAlert(error.message, 'danger');
        }
    }
}

// Global App Instance
const app = new ShipTrackApp();

document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
