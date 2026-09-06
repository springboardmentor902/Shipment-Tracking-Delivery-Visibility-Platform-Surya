# Frontend WebSocket Integration Guide

## Overview

This guide explains how to integrate the WebSocket real-time tracking feature into the frontend React application for ShipTrack Pro.

## Prerequisites

### Required Libraries

Install the following dependencies in your React project:

```bash
npm install sockjs-client @stomp/stompjs
```

Or with yarn:

```bash
yarn add sockjs-client @stomp/stompjs
```

---

## WebSocket Client Implementation

### 1. Create WebSocket Service

Create a new service file: `src/services/websocketService.js`

```javascript
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

class WebSocketService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.subscriptions = new Map();
  }

  connect(onConnect, onError) {
    const socket = new SockJS('http://localhost:1022/api/ws/tracking');
    
    this.client = new Client({
      webSocketFactory: () => socket,
      debug: true,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      this.connected = true;
      console.log('WebSocket connected');
      if (onConnect) onConnect();
    };

    this.client.onStompError = (frame) => {
      console.error('STOMP error:', frame);
      if (onError) onError(frame);
    };

    this.client.onDisconnect = () => {
      this.connected = false;
      console.log('WebSocket disconnected');
    };

    this.client.activate();
  }

  disconnect() {
    if (this.client && this.connected) {
      this.client.deactivate();
      this.connected = false;
      this.subscriptions.clear();
    }
  }

  subscribeToShipmentLocation(shipmentId, callback) {
    if (!this.connected) {
      console.error('WebSocket not connected');
      return null;
    }

    const destination = `/topic/shipment/${shipmentId}/location`;
    
    if (this.subscriptions.has(destination)) {
      console.log('Already subscribed to:', destination);
      return this.subscriptions.get(destination);
    }

    const subscription = this.client.subscribe(destination, (message) => {
      const locationData = JSON.parse(message.body);
      console.log('Location update received:', locationData);
      if (callback) callback(locationData);
    });

    this.subscriptions.set(destination, subscription);
    console.log('Subscribed to:', destination);
    return subscription;
  }

  unsubscribeFromShipmentLocation(shipmentId) {
    const destination = `/topic/shipment/${shipmentId}/location`;
    const subscription = this.subscriptions.get(destination);
    
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(destination);
      console.log('Unsubscribed from:', destination);
    }
  }

  isConnected() {
    return this.connected;
  }
}

export default new WebSocketService();
```

---

### 2. Create Tracking Page Component

Create: `src/pages/TrackingPage.jsx`

```javascript
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import webSocketService from '../services/websocketService';

const TrackingPage = () => {
  const { shipmentId } = useParams();
  const [route, setRoute] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    // Fetch initial route data
    fetchRouteData();

    // Connect to WebSocket
    webSocketService.connect(
      () => {
        console.log('Connected to WebSocket');
        // Subscribe to shipment location updates
        webSocketService.subscribeToShipmentLocation(
          shipmentId,
          handleLocationUpdate
        );
      },
      (error) => {
        console.error('WebSocket connection error:', error);
        setError('Failed to connect to real-time tracking');
      }
    );

    // Cleanup on unmount
    return () => {
      webSocketService.unsubscribeFromShipmentLocation(shipmentId);
      webSocketService.disconnect();
    };
  }, [shipmentId]);

  const fetchRouteData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:1022/api/routes/${shipmentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch route data');
      }

      const data = await response.json();
      setRoute(data);
      
      if (data.currentLatitude && data.currentLongitude) {
        setCurrentLocation({
          latitude: data.currentLatitude,
          longitude: data.currentLongitude,
          timestamp: data.locationUpdatedAt,
        });
      }
      
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleLocationUpdate = (locationData) => {
    console.log('Received location update:', locationData);
    setCurrentLocation({
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      timestamp: locationData.timestamp,
    });

    // Update map marker
    updateMapMarker(locationData.latitude, locationData.longitude);
  };

  const updateMapMarker = (lat, lng) => {
    // Implement map marker update based on your map library
    // Example with Google Maps:
    if (mapRef.current) {
      const position = { lat, lng };
      mapRef.current.marker.setPosition(position);
    }
  };

  const initializeMap = () => {
    // Initialize your map (Google Maps, Leaflet, etc.)
    // Example with Google Maps:
    if (window.google && window.google.maps && route) {
      const map = new window.google.maps.Map(document.getElementById('map'), {
        center: {
          lat: route.currentLatitude || route.originLatitude,
          lng: route.currentLongitude || route.originLongitude,
        },
        zoom: 12,
      });

      // Add origin marker
      new window.google.maps.Marker({
        position: { lat: route.originLatitude, lng: route.originLongitude },
        map: map,
        title: 'Origin',
        icon: 'https://maps.google.com/mapfiles/ms/icons/green.png',
      });

      // Add destination marker
      new window.google.maps.Marker({
        position: { lat: route.destinationLatitude, lng: route.destinationLongitude },
        map: map,
        title: 'Destination',
        icon: 'https://maps.google.com/mapfiles/ms/icons/red.png',
      });

      // Add current location marker (driver)
      if (route.currentLatitude && route.currentLongitude) {
        const driverMarker = new window.google.maps.Marker({
          position: { lat: route.currentLatitude, lng: route.currentLongitude },
          map: map,
          title: 'Driver Location',
          icon: 'https://maps.google.com/mapfiles/ms/icons/blue.png',
        });
        mapRef.current = { map, marker: driverMarker };
      }

      // Draw route line
      if (route.originLatitude && route.destinationLatitude) {
        const routePath = new window.google.maps.Polyline({
          path: [
            { lat: route.originLatitude, lng: route.originLongitude },
            { lat: route.destinationLatitude, lng: route.destinationLongitude },
          ],
          geodesic: true,
          strokeColor: '#FF0000',
          strokeOpacity: 1.0,
          strokeWeight: 2,
        });
        routePath.setMap(map);
      }
    }
  };

  useEffect(() => {
    if (route && !loading) {
      initializeMap();
    }
  }, [route, loading]);

  if (loading) {
    return <div>Loading tracking data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="tracking-page">
      <h1>Shipment Tracking</h1>
      
      <div className="tracking-info">
        <div className="info-card">
          <h3>Shipment ID</h3>
          <p>{shipmentId}</p>
        </div>
        
        <div className="info-card">
          <h3>Origin</h3>
          <p>{route?.originAddress}</p>
        </div>
        
        <div className="info-card">
          <h3>Destination</h3>
          <p>{route?.destinationAddress}</p>
        </div>
        
        <div className="info-card">
          <h3>Status</h3>
          <p>{route?.status}</p>
        </div>
      </div>

      {currentLocation && (
        <div className="current-location">
          <h3>Driver Current Location</h3>
          <p>Latitude: {currentLocation.latitude}</p>
          <p>Longitude: {currentLocation.longitude}</p>
          <p>Last Updated: {new Date(currentLocation.timestamp).toLocaleString()}</p>
        </div>
      )}

      <div id="map" style={{ width: '100%', height: '500px', marginTop: '20px' }}></div>

      {!webSocketService.isConnected() && (
        <div className="connection-warning">
          ⚠️ Real-time tracking disconnected. Reconnecting...
        </div>
      )}
    </div>
  );
};

export default TrackingPage;
```

---

### 3. Add Route to App.jsx

```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TrackingPage from './pages/TrackingPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Other routes */}
        <Route path="/tracking/:shipmentId" element={<TrackingPage />} />
      </Routes>
    </Router>
  );
}

export default App;
```

---

## Driver Location Update (Mobile App/Driver Portal)

### API Endpoint

**POST** `/api/routes/{routeId}/location`

**Headers:**
```
Authorization: Bearer {operator_token}
Content-Type: application/json
```

**Body:**
```json
{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Response:**
```json
{
  "id": 1,
  "shipmentId": 1,
  "currentLatitude": 40.7128,
  "currentLongitude": -74.0060,
  "locationUpdatedAt": "2026-08-19T20:45:30",
  ...
}
```

### Driver Portal Implementation Example

```javascript
const updateDriverLocation = async (routeId, latitude, longitude) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `http://localhost:1022/api/routes/${routeId}/location`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude, longitude }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update location');
    }

    const data = await response.json();
    console.log('Location updated:', data);
    return data;
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
};

// Example: Update location every 30 seconds using GPS
const startLocationTracking = (routeId) => {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await updateDriverLocation(routeId, latitude, longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }
};
```

---

## WebSocket Message Format

When a driver updates their location, subscribed clients receive:

```json
{
  "routeId": 1,
  "shipmentId": 1,
  "latitude": 40.7128,
  "longitude": -74.0060,
  "timestamp": "2026-08-19T20:45:30"
}
```

---

## Testing the Integration

### 1. Test WebSocket Connection

Open browser console on tracking page:

```javascript
// Should see: "WebSocket connected"
// Should see: "Subscribed to: /topic/shipment/{shipmentId}/location"
```

### 2. Test Location Updates

Use Postman to send location update:

```bash
POST http://localhost:1022/api/routes/{routeId}/location
Authorization: Bearer {operator_token}
Content-Type: application/json

{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

Check browser console - should see:
```
Location update received: {routeId: 1, shipmentId: 1, latitude: 40.7128, longitude: -74.0060, timestamp: "..."}
```

Map marker should move without page refresh.

### 3. Test Reconnection

1. Close the tracking page tab
2. Open it again
3. Should reconnect automatically
4. Send new location update
5. Should receive update

---

## Troubleshooting

### WebSocket Connection Fails

**Issue**: Connection refused or timeout

**Solutions**:
- Verify backend is running on `http://localhost:1022`
- Check browser console for CORS errors
- Verify WebSocket endpoint: `/api/ws/tracking`

### Location Updates Not Received

**Issue**: Subscribed but no messages

**Solutions**:
- Verify shipmentId matches the route's shipmentId
- Check backend logs for broadcast messages
- Verify operator/admin token is valid
- Check if route exists for the shipment

### Map Not Displaying

**Issue**: Map container empty

**Solutions**:
- Verify Google Maps API key is loaded
- Check if route has origin/destination coordinates
- Verify map container has explicit height
- Check browser console for map library errors

---

## Security Considerations

1. **Authentication**: WebSocket connection doesn't require auth token, but:
   - Location update API requires Operator/Admin token
   - Frontend should verify user has permission to view shipment

2. **Authorization**: Frontend should check:
   - Customer can only view their own shipments
   - Operator can view assigned shipments
   - Admin can view all shipments

3. **Rate Limiting**: Consider implementing rate limiting for:
   - Location updates (e.g., max 1 update per 30 seconds)
   - WebSocket connections per user

---

## Performance Optimization

1. **Debounce Location Updates**: Don't update map on every message if updates are too frequent

```javascript
import { debounce } from 'lodash';

const debouncedUpdateMarker = debounce((lat, lng) => {
  updateMapMarker(lat, lng);
}, 500);

const handleLocationUpdate = (locationData) => {
  setCurrentLocation(locationData);
  debouncedUpdateMarker(locationData.latitude, locationData.longitude);
};
```

2. **Batch Map Updates**: If using a map library that supports it, batch multiple updates

3. **Lazy Loading**: Load map library only when tracking page is accessed

---

## Next Steps

1. Integrate this WebSocket service into your React application
2. Add the tracking page to your routing
3. Implement the driver location update in the driver portal/mobile app
4. Add error handling and loading states
5. Test end-to-end with real GPS data
6. Add analytics for tracking engagement
