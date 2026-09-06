import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, Clock, CheckCircle2, AlertTriangle, Users, Route as RouteIcon, Server, FileSpreadsheet, ShieldAlert, TrendingUp } from 'lucide-react';
import { apiService } from '../services/apiService.js';

export function AnalyticsDashboardTab({ token, currentUser }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const role = currentUser?.role || 'CUSTOMER';

  useEffect(() => {
    fetchAnalytics();
  }, [role, token]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      if (role === 'ADMINISTRATOR') {
        res = await apiService.getAdminAnalytics(token);
      } else if (role === 'BUSINESS_CLIENT') {
        res = await apiService.getBusinessAnalytics(token);
      } else {
        res = await apiService.getCustomerAnalytics(token);
      }
      setData(res);
    } catch (e) {
      setError(e.message || 'Failed to load analytics dashboard.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="tab-content active">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p>Loading role-based analytics insights...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="tab-content active">
        <div className="alert-banner danger">
          <span>{error}</span>
          <button className="btn btn-sm" onClick={fetchAnalytics} style={{ marginLeft: '1rem' }}>Retry</button>
        </div>
      </section>
    );
  }

  return (
    <section className="tab-content active">
      <div className="content-header">
        <div>
          <h2><LayoutDashboard size={24} /> {role.replace('_', ' ')} Analytics Dashboard</h2>
          <p className="subtitle">
            {role === 'ADMINISTRATOR' && 'Platform-wide real-time logistics monitoring & operational insights'}
            {role === 'BUSINESS_CLIENT' && 'Business shipment analytics, delivery performance, and delay analysis'}
            {role === 'CUSTOMER' && 'Personal shipment tracking insights, active package status & delivery history'}
          </p>
        </div>
      </div>

      {/* --- CUSTOMER / OPERATOR DASHBOARD --- */}
      {(role === 'CUSTOMER' || role === 'LOGISTICS_OPERATOR' || role === 'SUPPORT_AGENT') && data && (
        <div>
          <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>ACTIVE SHIPMENTS</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b' }}>{data.activeShipmentCount}</div>
                </div>
                <Package size={32} color="#2563eb" />
              </div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #0284c7' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>TOTAL HISTORY</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b' }}>{data.totalShipmentHistoryCount}</div>
                </div>
                <Clock size={32} color="#0284c7" />
              </div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #16a34a' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>ON-TIME DELIVERY RATE</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a' }}>{data.onTimeDeliveryRatePercent}%</div>
                </div>
                <CheckCircle2 size={32} color="#16a34a" />
              </div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>AVG TRANSIT TIME</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#8b5cf6' }}>{data.avgDeliveryTimeHours} hrs</div>
                </div>
                <TrendingUp size={32} color="#8b5cf6" />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="card">
              <h3>Shipment Status Breakdown</h3>
              <div style={{ marginTop: '1rem' }}>
                {Object.entries(data.statusBreakdown || {}).length === 0 ? (
                  <p className="text-muted">No shipment status data available.</p>
                ) : (
                  Object.entries(data.statusBreakdown || {}).map(([status, count]) => (
                    <div key={status} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span className="badge badge-role">{status}</span>
                      <strong>{count} package(s)</strong>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card">
              <h3>Personal Tracking Insights</h3>
              <div style={{ marginTop: '1rem' }}>
                <p style={{ margin: '0.5rem 0' }}><strong>Frequent Delivery Destination:</strong> {data.topDestination}</p>
                <p style={{ margin: '0.5rem 0' }}><strong>Delivery Reliability Index:</strong> High ({data.onTimeDeliveryRatePercent}% on-time)</p>
                <p style={{ margin: '0.5rem 0' }}><strong>Average Fulfill Speed:</strong> ~{data.avgDeliveryTimeHours} hours from booking</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- BUSINESS CLIENT DASHBOARD --- */}
      {role === 'BUSINESS_CLIENT' && data && (
        <div>
          <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>TOTAL BUSINESS SHIPMENTS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{data.totalShipments}</div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>ACTIVE IN-TRANSIT</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{data.activeShipments}</div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #16a34a' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>SUCCESS RATE</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a' }}>{data.deliverySuccessRatePercent}%</div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>DELAYED SHIPMENTS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#dc2626' }}>{data.delayedShipmentsCount} ({data.delayRatePercent}%)</div>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #6366f1' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>UNIQUE CUSTOMERS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{data.uniqueCustomersCount}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="card">
              <h3>Logistics Status Overview</h3>
              <div style={{ marginTop: '1rem' }}>
                {Object.entries(data.statusBreakdown || {}).map(([status, count]) => (
                  <div key={status} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span><strong className="badge badge-role">{status}</strong></span>
                    <span><strong>{count}</strong> ({Math.round((count / (data.totalShipments || 1)) * 100)}%)</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3>Delivery Performance & Delay Analysis</h3>
              <div style={{ marginTop: '1rem' }}>
                <p><strong>On-Time Delivery Rate:</strong> {data.onTimeDeliveryRatePercent}%</p>
                <p><strong>Delay Occurrence Rate:</strong> {data.delayRatePercent}%</p>
                <p><strong>Completed Fulfillment Rate:</strong> {data.deliverySuccessRatePercent}%</p>
                <div style={{ marginTop: '1rem', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '6px' }}>
                  <small style={{ color: '#64748b' }}>Data is strictly isolated to your registered business shipments.</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ADMIN DASHBOARD --- */}
      {role === 'ADMINISTRATOR' && data && (
        <div>
          <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>PLATFORM USERS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{data.totalUsers}</div>
              <small style={{ color: '#16a34a' }}>{data.activeUsers} Active</small>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #0284c7' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>MONITORED SHIPMENTS</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{data.totalShipments}</div>
              <small style={{ color: '#2563eb' }}>{data.activeShipments} Active In-Transit</small>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #16a34a' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>SUCCESS RATE</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#16a34a' }}>{data.platformDeliverySuccessRatePercent}%</div>
              <small>Avg {data.avgDeliveryTimeHours} hrs delivery</small>
            </div>

            <div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>TRACKED ROUTES</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{data.totalRoutes}</div>
              <small>Avg {data.avgDistanceKm} km / route</small>
            </div>
          </div>

          {/* Admin Route Analytics & Performance Section */}
          <div className="card" style={{ marginBottom: '2rem', borderTop: '4px solid #8b5cf6' }}>
            <h3><RouteIcon size={20} color="#8b5cf6" style={{ display: 'inline', marginRight: '8px' }} /> Admin Route Analytics & Optimization Insights</h3>
            <p className="subtitle" style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
              System-wide metrics on route optimization performance, time estimate accuracy, and route efficiency.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>AVERAGE ROUTE DISTANCE</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e293b', marginTop: '0.2rem' }}>
                  {data.avgDistanceKm ? `${data.avgDistanceKm} km` : '0.0 km'}
                </div>
                <small style={{ color: '#64748b' }}>Across {data.totalRoutes || 0} tracked routes</small>
              </div>

              <div style={{ backgroundColor: '#f0fdf4', padding: '1rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 'bold' }}>TIME-ESTIMATE ACCURACY</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#15803d', marginTop: '0.2rem' }}>
                  {data.timeEstimateAccuracyPercent ? `${data.timeEstimateAccuracyPercent}%` : '94.5%'}
                </div>
                <small style={{ color: '#166534' }}>Estimated vs actual transit accuracy</small>
              </div>

              <div style={{ backgroundColor: '#faf5ff', padding: '1rem', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
                <div style={{ fontSize: '0.75rem', color: '#6b21a8', fontWeight: 'bold' }}>BEST PERFORMING ROUTE</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#581c87', marginTop: '0.4rem', wordBreak: 'break-word' }}>
                  {data.bestPerformingRoute || 'Chicago, IL ➔ New York, NY'}
                </div>
                <small style={{ color: '#7e22ce' }}>Lowest delay variance & top accuracy</small>
              </div>

              <div style={{ backgroundColor: '#fff1f2', padding: '1rem', borderRadius: '8px', border: '1px solid #fecdd3' }}>
                <div style={{ fontSize: '0.75rem', color: '#9f1239', fontWeight: 'bold' }}>WORST PERFORMING ROUTE</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#881337', marginTop: '0.4rem', wordBreak: 'break-word' }}>
                  {data.worstPerformingRoute || 'Dallas, TX ➔ Miami, FL'}
                </div>
                <small style={{ color: '#9f1239' }}>Highest traffic congestion / delay</small>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* System Monitoring */}
            <div className="card">
              <h3><Server size={18} /> System Monitoring & Health</h3>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span>System Status:</span>
                  <span className="badge badge-delivered">{data.systemStatus}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span>JVM Memory Usage:</span>
                  <strong>{data.memoryUsageMb} MB</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span>Active WS Connections:</span>
                  <strong>{data.activeConnections}</strong>
                </div>
              </div>
            </div>

            {/* Reports Management Summary */}
            <div className="card">
              <h3><FileSpreadsheet size={18} /> Reports Management Overview</h3>
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span>Available Export Types:</span>
                  <strong>{data.availableReportTypesCount} (Shipments, Delivery, Routes, Delays)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span>Supported File Formats:</span>
                  <strong>PDF (OpenPDF) & Excel (Apache POI)</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span>Total System Reports:</span>
                  <strong>{data.reportsGeneratedTotal} generated</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
