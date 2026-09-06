import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Route as RouteIcon, Clock, Radio, Navigation } from 'lucide-react';
import L from 'leaflet';

export function LiveTrackingTab({ shipments, selectedShipmentId, onSelectShipment, routeData, onUpdateLocation, wsLogs, isWsConnected }) {
  const mapRef = useRef(null);
  const leafletInstance = useRef(null);
  const driverMarkerRef = useRef(null);
  const originMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);

  const [simLat, setSimLat] = useState(38.0000);
  const [simLng, setSimLng] = useState(-110.0000);

  // Initialize Map
  useEffect(() => {
    if (!leafletInstance.current) {
      leafletInstance.current = L.map(mapRef.current).setView([39.8283, -98.5795], 4);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(leafletInstance.current);
    }
  }, []);

  // Update Route and Markers
  useEffect(() => {
    const map = leafletInstance.current;
    if (!map || !routeData) return;

    if (originMarkerRef.current) map.removeLayer(originMarkerRef.current);
    if (destMarkerRef.current) map.removeLayer(destMarkerRef.current);
    if (driverMarkerRef.current) map.removeLayer(driverMarkerRef.current);

    const points = [];

    if (routeData.originLatitude && routeData.originLongitude) {
      const pos = [routeData.originLatitude, routeData.originLongitude];
      originMarkerRef.current = L.marker(pos).addTo(map).bindPopup(`Origin: ${routeData.originAddress}`);
      points.push(pos);
    }

    if (routeData.destinationLatitude && routeData.destinationLongitude) {
      const pos = [routeData.destinationLatitude, routeData.destinationLongitude];
      destMarkerRef.current = L.marker(pos).addTo(map).bindPopup(`Destination: ${routeData.destinationAddress}`);
      points.push(pos);
    }

    const curLat = routeData.currentLatitude || routeData.originLatitude || 39.8283;
    const curLng = routeData.currentLongitude || routeData.originLongitude || -98.5795;
    const curPos = [curLat, curLng];

    driverMarkerRef.current = L.circleMarker(curPos, {
      radius: 10,
      fillColor: '#ef4444',
      color: '#ffffff',
      weight: 3,
      fillOpacity: 0.9
    }).addTo(map).bindPopup(`Live Vehicle Position<br>Lat: ${curLat}, Lng: ${curLng}`);

    points.push(curPos);
    setSimLat(curLat);
    setSimLng(curLng);

    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [50, 50] });
    }
  }, [routeData]);

  const handleBroadcast = () => {
    if (!routeData) return;
    onUpdateLocation(routeData.id, parseFloat(simLat), parseFloat(simLng));
  };

  return (
    <section className="tab-content active">
      <div className="content-header">
        <div>
          <h2><MapPin size={22} /> Live GPS Tracking & Visual Route</h2>
          <p className="subtitle">Stream live driver coordinates via WebSocket STOMP</p>
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', padding: '0.3rem 0.75rem', background: 'white', borderRadius: '9999px', border: '1px solid #e2e8f0' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: isWsConnected ? '#10b981' : '#ef4444' }}></span>
          WebSocket: {isWsConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="grid-3-1">
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold' }}>
            <span>{selectedShipmentId ? `Tracking Shipment #${selectedShipmentId}` : 'Select a shipment to track'}</span>
            <div>
              <span className="badge badge-role" style={{ marginRight: '0.5rem' }}><RouteIcon size={12} /> Distance: {routeData?.distanceKm || '--'} km</span>
              <span className="badge badge-role"><Clock size={12} /> Est: {routeData?.estimatedTimeMinutes || '--'} min</span>
            </div>
          </div>
          <div ref={mapRef} className="map-viewport"></div>
        </div>

        <div className="card">
          <h3><Radio size={18} /> Live GPS Stream</h3>
          <p className="text-muted text-sm">Select an active shipment route below</p>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Target Shipment</label>
            <select value={selectedShipmentId || ''} onChange={(e) => onSelectShipment(e.target.value)}>
              <option value="">-- Choose Shipment --</option>
              {shipments.map(s => (
                <option key={s.id} value={s.id}>{s.trackingNumber} ({s.senderName} → {s.receiverName})</option>
              ))}
            </select>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '6px', border: '1px solid #e2e8f0', marginTop: '1rem' }}>
            <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}><Navigation size={14} /> Driver GPS Simulator</h4>
            <div className="form-group">
              <label>Latitude</label>
              <input type="number" step="0.0001" value={simLat} onChange={(e) => setSimLat(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Longitude</label>
              <input type="number" step="0.0001" value={simLng} onChange={(e) => setSimLng(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-block" onClick={handleBroadcast}>
              Broadcast Update
            </button>
          </div>

          {/* Hidden for now via comments:
          <div style={{ backgroundColor: '#0f172a', color: '#38bdf8', borderRadius: '6px', overflow: 'hidden', fontSize: '0.75rem', marginTop: '1rem', fontFamily: 'monospace' }}>
            <div style={{ backgroundColor: '#1e293b', padding: '0.4rem 0.75rem', color: '#94a3b8', fontWeight: 'bold' }}>WebSocket Stream Logs</div>
            <div style={{ padding: '0.75rem', maxHeight: '120px', overflowY: 'auto' }}>
              {wsLogs.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))}
            </div>
          </div>
          */}
        </div>
      </div>
    </section>
  );
}
