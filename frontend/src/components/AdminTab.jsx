import React from 'react';
import { UserCheck, Server, FileText, ShieldAlert, Cpu } from 'lucide-react';

export function AdminTab({ users, onChangeRole }) {
  return (
    <section className="tab-content active">
      <div className="content-header">
        <div>
          <h2><UserCheck size={22} /> System Administration & User Management</h2>
          <p className="subtitle">Administrator control panel, user role distribution, and system monitoring</p>
        </div>
      </div>

      {/* System Monitoring & Reports Management Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card">
          <h3><Server size={18} /> System Monitoring</h3>
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
              <span>Platform Health:</span>
              <span className="badge badge-delivered">100% OPERATIONAL</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
              <span>Cache Layer (Redis):</span>
              <span className="badge badge-role">ACTIVE (TTL 10m)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
              <span>Active WebSocket Broker:</span>
              <span className="badge badge-delivered">/api/ws/tracking Connected</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3><FileText size={18} /> Reports Management</h3>
          <div style={{ marginTop: '1rem' }}>
            <p><strong>Configured Report Engines:</strong> OpenPDF (PDF) & Apache POI (Excel)</p>
            <p><strong>Available Reports:</strong> Shipment, Delivery, Route Performance, Delay Analysis</p>
            <p><strong>Role Enforcement:</strong> Active (Customer, Business, Admin scope)</p>
          </div>
        </div>
      </div>

      {/* User Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <h3 style={{ margin: 0 }}>Registered User Directory & Role Assignments</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Current Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center' }}>Loading users...</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td><strong>{u.fullName}</strong></td>
                    <td>{u.email}</td>
                    <td>{u.phone || 'N/A'}</td>
                    <td><span className="badge badge-role">{u.role}</span></td>
                    <td><span className="badge badge-delivered">{u.status || 'ACTIVE'}</span></td>
                    <td>
                      <select className="btn-sm" onChange={(e) => onChangeRole(u.id, e.target.value)}>
                        <option value="">-- Change Role --</option>
                        <option value="CUSTOMER">CUSTOMER</option>
                        <option value="BUSINESS_CLIENT">BUSINESS_CLIENT</option>
                        <option value="LOGISTICS_OPERATOR">LOGISTICS_OPERATOR</option>
                        <option value="SUPPORT_AGENT">SUPPORT_AGENT</option>
                        <option value="ADMINISTRATOR">ADMINISTRATOR</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
