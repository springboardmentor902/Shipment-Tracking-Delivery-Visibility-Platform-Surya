import React, { useState } from 'react';
import { Calculator, Sparkles, Layers, CheckCircle } from 'lucide-react';

export function ETATab({ shipments, selectedShipmentId, onSelectShipment, onCalculateETA, etaData }) {
  const [localShipmentId, setLocalShipmentId] = useState(selectedShipmentId || '');

  const handleCalculate = () => {
    if (!localShipmentId) return;
    onCalculateETA(localShipmentId);
  };

  const selectedShipment = shipments.find(s => String(s.id) === String(localShipmentId));

  const riskScore = etaData?.delayRiskScore || 0;
  let riskLevel = 'LOW';
  let badgeClass = 'badge-low';
  if (riskScore >= 8) { riskLevel = 'CRITICAL'; badgeClass = 'badge-critical'; }
  else if (riskScore >= 6) { riskLevel = 'HIGH'; badgeClass = 'badge-high'; }
  else if (riskScore >= 4) { riskLevel = 'MEDIUM'; badgeClass = 'badge-medium'; }

  let factors = {};
  if (etaData?.factors) {
    try {
      factors = typeof etaData.factors === 'string' ? JSON.parse(etaData.factors) : etaData.factors;
    } catch (e) {
      factors = { info: etaData.factors };
    }
  }

  const isDelivered = selectedShipment?.status === 'DELIVERED' || factors?.shipment_status === 'DELIVERED' || factors?.message?.toLowerCase().includes('delivered');

  return (
    <section className="tab-content active">
      <div className="content-header">
        <div>
          <h2><Calculator size={22} /> AI Estimated Time of Arrival (ETA) & Risk Engine</h2>
          <p className="subtitle">Multi-factor delay risk scoring based on traffic, distance, and progress</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h3><Sparkles size={18} /> Select Shipment for ETA</h3>
          <div className="form-group">
            <label>Select Shipment</label>
            <select value={localShipmentId} onChange={(e) => {
              setLocalShipmentId(e.target.value);
              onSelectShipment(e.target.value);
            }}>
              <option value="">-- Choose Shipment --</option>
              {shipments.map(s => (
                <option key={s.id} value={s.id}>
                  {s.trackingNumber} ({s.senderName} → {s.receiverName}) [{s.status}]
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handleCalculate}>
            <Sparkles size={16} /> Calculate / Refresh ETA
          </button>

          {/* Delivered Status Notice */}
          {isDelivered && (
            <div style={{
              backgroundColor: '#ecfdf5',
              border: '1px solid #10b981',
              color: '#065f46',
              padding: '1.25rem',
              borderRadius: '10px',
              marginTop: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <CheckCircle size={30} color="#10b981" />
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#065f46' }}>Item Already Delivered</div>
                <div style={{ fontSize: '0.875rem', color: '#047857', marginTop: '2px' }}>
                  This item/shipment has already been successfully delivered on {selectedShipment?.actualDeliveryDate ? new Date(selectedShipment.actualDeliveryDate).toLocaleString() : (etaData?.predictedDeliveryTime ? new Date(etaData.predictedDeliveryTime).toLocaleString() : 'the specified delivery date')}.
                </div>
              </div>
            </div>
          )}

          {etaData && (
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ background: isDelivered ? 'linear-gradient(135deg, #059669, #10b981)' : 'linear-gradient(135deg, #1e3a8a, #2563eb)', color: 'white', padding: '1.5rem', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', opacity: 0.85, textTransform: 'uppercase' }}>
                  {isDelivered ? 'Actual Delivery Time' : 'Predicted Delivery Time'}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.5rem' }}>
                  {etaData.predictedDeliveryTime ? new Date(etaData.predictedDeliveryTime).toLocaleString() : 'Calculating...'}
                </div>
              </div>

              <div style={{ backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '6px', marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                  <span>Delay Risk Score</span>
                  <span style={{ fontWeight: 'bold' }}>{riskScore} / 10</span>
                </div>
                <div style={{ height: 12, backgroundColor: '#cbd5e1', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(riskScore / 10) * 100}%`, background: 'linear-gradient(90deg, #10b981, #f59e0b, #ef4444)', transition: 'width 0.4s ease' }}></div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>Risk Level</div>
                  <div className={`badge ${badgeClass}`} style={{ marginTop: '0.25rem' }}>{riskLevel}</div>
                </div>
                <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '6px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>Confidence Score</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.25rem' }}>{etaData.confidenceScore || 100}%</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3><Layers size={18} /> Calculated Risk Factors Breakdown</h3>
          {Object.keys(factors).length === 0 ? (
            <div className="text-muted text-sm">Select a shipment and click "Calculate ETA" to view risk factors.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {Object.entries(factors).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: '#f8fafc', borderRadius: '6px', borderLeft: '4px solid #2563eb', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 'bold' }}>{key.replace(/_/g, ' ').toUpperCase()}</span>
                  <span>{String(val)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
