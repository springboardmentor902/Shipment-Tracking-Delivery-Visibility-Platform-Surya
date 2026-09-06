import React, { useState, useEffect } from 'react';
import { Route as RouteIcon, MapPin, Clock, ArrowRight, CheckCircle2, History, AlertCircle, RefreshCw, PlusCircle, ShieldAlert } from 'lucide-react';
import { apiService } from '../services/apiService.js';

export function RouteHistory({ shipment, token, onClose, onRouteUpdated }) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Re-route form state
  const [showRerouteForm, setShowRerouteForm] = useState(false);
  const [origin, setOrigin] = useState(shipment?.senderAddress || shipment?.pickupAddress || 'Chicago, IL');
  const [destination, setDestination] = useState(shipment?.deliveryAddress || 'New York, NY');
  const [submittingReroute, setSubmittingReroute] = useState(false);
  const [rerouteSuccess, setRerouteSuccess] = useState(null);

  useEffect(() => {
    if (shipment?.id) {
      fetchHistory();
    }
  }, [shipment?.id]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getRouteHistory(shipment.id, token);
      setRoutes(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load route history.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewRoute = async (e) => {
    e.preventDefault();
    setSubmittingReroute(true);
    setRerouteSuccess(null);
    setError(null);

    try {
      const payload = {
        originAddress: origin,
        destinationAddress: destination,
      };

      const newRoute = await apiService.createRoute(shipment.id, payload, token);
      setRerouteSuccess(`New optimized route created successfully! (Reason: ${newRoute.selectionReason || 'Optimization completed'})`);
      setShowRerouteForm(false);
      await fetchHistory();
      if (onRouteUpdated) onRouteUpdated();
    } catch (err) {
      setError(err.message || 'Failed to create route / re-route.');
    } finally {
      setSubmittingReroute(false);
    }
  };

  return (
    <div className="modal-backdrop" style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '1rem'
    }}>
      <div className="modal-content" style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        maxWidth: '750px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#f8fafc'
        }}>
          <div>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1e293b', fontSize: '1.2rem' }}>
              <History size={20} color="#2563eb" /> Route History & Re-routing
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Shipment Tracking: <strong>{shipment?.trackingNumber || `#${shipment?.id}`}</strong>
            </span>
          </div>
          <button className="btn btn-sm btn-outline" onClick={onClose} style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0 }}>
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {rerouteSuccess && (
            <div className="alert-banner success" style={{ marginBottom: '1rem', backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.75rem 1rem', borderRadius: '6px' }}>
              <CheckCircle2 size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
              {rerouteSuccess}
            </div>
          )}

          {error && (
            <div className="alert-banner danger" style={{ marginBottom: '1rem', backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '0.75rem 1rem', borderRadius: '6px' }}>
              <AlertCircle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
              {error}
            </div>
          )}

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#475569', fontWeight: 600 }}>
              Total Recorded Routes: {routes.length}
            </span>
            <button
              className="btn btn-sm btn-primary"
              onClick={() => setShowRerouteForm(!showRerouteForm)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              {showRerouteForm ? 'Cancel Re-route' : <><PlusCircle size={15} /> Simulate Re-route</>}
            </button>
          </div>

          {/* Re-route Form */}
          {showRerouteForm && (
            <form onSubmit={handleCreateNewRoute} style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#1e40af', fontSize: '0.95rem' }}>
                Create New Route (Simulate Re-route & Optimization)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>Origin Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>Destination Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-sm btn-primary" disabled={submittingReroute}>
                  {submittingReroute ? <><RefreshCw size={14} className="spin" /> Optimizing & Saving...</> : 'Generate Optimized Re-Route'}
                </button>
              </div>
            </form>
          )}

          {/* Route History Timeline */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <div className="spinner" style={{ margin: '0 auto 0.5rem' }}></div>
              <p style={{ color: '#64748b' }}>Fetching complete route audit log...</p>
            </div>
          ) : routes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <RouteIcon size={36} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
              <p style={{ color: '#64748b', margin: 0 }}>No routes have been created for this shipment yet.</p>
              <button className="btn btn-sm btn-primary" onClick={() => setShowRerouteForm(true)} style={{ marginTop: '0.75rem' }}>
                Create Initial Route
              </button>
            </div>
          ) : (
            <div className="timeline" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {routes.map((route, idx) => {
                const isCurrent = route.isCurrent !== false;
                const createdDate = route.createdAt ? new Date(route.createdAt).toLocaleString() : 'Just now';

                return (
                  <div
                    key={route.id || idx}
                    style={{
                      border: isCurrent ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      backgroundColor: isCurrent ? '#f0f9ff' : '#ffffff',
                      borderRadius: '10px',
                      padding: '1.25rem',
                      boxShadow: isCurrent ? '0 4px 12px rgba(37, 99, 235, 0.12)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
                      position: 'relative'
                    }}
                  >
                    {/* Header line */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isCurrent ? (
                          <span className="badge" style={{ backgroundColor: '#2563eb', color: '#ffffff', fontWeight: 700, padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                            <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} /> CURRENT ACTIVE ROUTE
                          </span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: '#94a3b8', color: '#ffffff', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem' }}>
                            PREVIOUS ROUTE (RE-ROUTED)
                          </span>
                        )}
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Route ID: #{route.id}</span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                        <Clock size={13} style={{ display: 'inline', marginRight: '4px' }} /> {createdDate}
                      </span>
                    </div>

                    {/* Origin -> Destination display */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', backgroundColor: isCurrent ? '#ffffff' : '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>ORIGIN</div>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}><MapPin size={14} color="#16a34a" inline="true" /> {route.originAddress}</div>
                      </div>
                      <ArrowRight size={18} color="#94a3b8" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>DESTINATION</div>
                        <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}><MapPin size={14} color="#dc2626" inline="true" /> {route.destinationAddress}</div>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
                      <div>
                        <span style={{ color: '#64748b' }}>Distance: </span>
                        <strong>{route.distanceKm ? `${route.distanceKm} km` : 'N/A'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Est. Duration: </span>
                        <strong>{route.estimatedTimeMinutes ? `${route.estimatedTimeMinutes} mins` : 'N/A'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Traffic Condition: </span>
                        <span className={`badge ${route.trafficCondition === 'HEAVY' ? 'badge-danger' : route.trafficCondition === 'MODERATE' ? 'badge-pending' : 'badge-delivered'}`} style={{ fontSize: '0.75rem' }}>
                          {route.trafficCondition || 'NORMAL'}
                        </span>
                      </div>
                    </div>

                    {/* Optimization Reason if present */}
                    {(route.selectionReason || route.waypoints) && (
                      <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #e2e8f0', fontSize: '0.8rem', color: '#475569' }}>
                        <strong>Optimization Notes: </strong>
                        <span>{route.selectionReason || `Selected route: ${route.waypoints}`}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f8fafc' }}>
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
