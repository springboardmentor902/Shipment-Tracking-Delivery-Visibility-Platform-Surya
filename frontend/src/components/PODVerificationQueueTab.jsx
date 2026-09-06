import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle, XCircle, Eye, Image, FileText, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { apiService } from '../services/apiService.js';

export function PODVerificationQueueTab({ token, shipments }) {
  const [allPods, setAllPods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPod, setSelectedPod] = useState(null);
  const [viewOnlyPod, setViewOnlyPod] = useState(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchPODs();
  }, [token]);

  const fetchPODs = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAllPODs(token);
      setAllPods(data || []);
    } catch (err) {
      console.error(err);
      setMessage({ text: err.message || 'Failed to fetch verification queue.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (shipmentId, status) => {
    try {
      await apiService.verifyPOD(shipmentId, {
        status,
        verificationNotes
      }, token);

      setMessage({
        text: `Proof of Delivery for shipment #${shipmentId} was ${status === 'VERIFIED' ? 'Approved' : 'Rejected'}.`,
        type: status === 'VERIFIED' ? 'success' : 'warning'
      });

      setSelectedPod(null);
      setVerificationNotes('');
      fetchPODs();
    } catch (err) {
      setMessage({ text: err.message || 'Action failed.', type: 'danger' });
    }
  };

  const getShipmentDetails = (shipmentId) => {
    return shipments.find(s => String(s.id) === String(shipmentId));
  };

  const pendingPods = allPods.filter(p => !p.verificationStatus || p.verificationStatus === 'PENDING');
  const verifiedPods = allPods.filter(p => p.verificationStatus === 'VERIFIED');
  const rejectedPods = allPods.filter(p => p.verificationStatus === 'REJECTED');

  return (
    <section className="tab-content active">
      <div className="content-header">
        <div>
          <h2><ShieldCheck size={22} /> POD Verification Queue</h2>
          <p className="subtitle">Support Agents & Admin portal to review, inspect full signatures/photos, and approve/reject proof of delivery submissions</p>
        </div>
        <button className="btn btn-outline" onClick={fetchPODs} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh Queue
        </button>
      </div>

      {message && (
        <div className={`alert-banner ${message.type}`} style={{ marginBottom: '1.5rem' }}>
          {message.text}
        </div>
      )}

      {/* Summary KPI Cards for Verification Portal */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Pending Verification */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '1.25rem',
            borderRadius: '10px',
            border: '2px solid #f59e0b',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div style={{ backgroundColor: '#fffbeb', padding: '0.75rem', borderRadius: '8px', color: '#d97706' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Pending Verification</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309' }}>{pendingPods.length}</div>
          </div>
        </div>

        {/* Verified Proofs */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '1.25rem',
            borderRadius: '10px',
            border: '1px solid #10b981',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div style={{ backgroundColor: '#ecfdf5', padding: '0.75rem', borderRadius: '8px', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Verified Proofs</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#065f46' }}>{verifiedPods.length}</div>
          </div>
        </div>

        {/* Rejected Proofs */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '1.25rem',
            borderRadius: '10px',
            border: '1px solid #ef4444',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div style={{ backgroundColor: '#fef2f2', padding: '0.75rem', borderRadius: '8px', color: '#ef4444' }}>
            <XCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Rejected Proofs</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#991b1b' }}>{rejectedPods.length}</div>
          </div>
        </div>
      </div>

      {/* Main Verification Working Area */}
      <div className="grid-2" style={{ marginBottom: '2.5rem' }}>
        {/* Left Column: Pending Queue List */}
        <div className="card">
          <h3>Pending Verification Queue ({pendingPods.length})</h3>

          {loading ? (
            <div className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>Loading pending proofs...</div>
          ) : pendingPods.length === 0 ? (
            <div className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>
              No proofs currently pending verification. All submitted PODs have been processed!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              {pendingPods.map(pod => {
                const s = getShipmentDetails(pod.shipmentId);
                const isSelected = selectedPod?.id === pod.id;

                return (
                  <div
                    key={pod.id}
                    onClick={() => {
                      setSelectedPod(pod);
                      setVerificationNotes('');
                    }}
                    style={{
                      padding: '1rem',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                        Shipment #{pod.shipmentId} {s ? `(${s.trackingNumber})` : ''}
                      </span>
                      <span className="badge badge-pending">PENDING</span>
                    </div>

                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#475569' }}>
                      <strong>Recipient:</strong> {pod.recipientName}
                    </div>
                    {s && (
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        {s.senderName} → {s.receiverName} ({s.deliveryAddress})
                      </div>
                    )}
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '4px' }}>
                      Submitted: {pod.createdAt ? new Date(pod.createdAt).toLocaleString() : 'N/A'}
                    </div>

                    <button
                      className="btn btn-sm btn-primary"
                      style={{ marginTop: '0.5rem', width: '100%' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPod(pod);
                        setVerificationNotes('');
                      }}
                    >
                      <Eye size={14} /> Review Proof Details
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Full Proof Detail View & Action Controls */}
        <div className="card">
          <h3><FileText size={18} /> Proof Verification Inspection</h3>

          {selectedPod ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' }}>
                  Shipment #{selectedPod.shipmentId} Proof
                </div>
                <div style={{ fontSize: '0.9rem', color: '#475569', marginTop: '4px' }}>
                  <strong>Recipient Name:</strong> {selectedPod.recipientName}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                  <strong>Submitted At:</strong> {selectedPod.createdAt ? new Date(selectedPod.createdAt).toLocaleString() : 'N/A'}
                </div>
              </div>

              {/* Signature Display */}
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  DIGITAL SIGNATURE
                </strong>
                {selectedPod.signatureData ? (
                  <div style={{ border: '1px solid #cbd5e1', padding: '12px', borderRadius: '8px', backgroundColor: '#ffffff', textAlign: 'center' }}>
                    <img
                      src={selectedPod.signatureData}
                      alt="Full Signature"
                      style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'contain' }}
                    />
                  </div>
                ) : (
                  <div className="text-muted text-sm" style={{ padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '6px' }}>
                    No digital signature captured.
                  </div>
                )}
              </div>

              {/* Photo Display */}
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                  <Image size={14} /> PROOF PHOTO
                </strong>
                {selectedPod.photoUrl ? (
                  <div style={{ border: '1px solid #cbd5e1', padding: '10px', borderRadius: '8px', backgroundColor: '#ffffff' }}>
                    <img
                      src={selectedPod.photoUrl}
                      alt="Delivery Proof Photo"
                      style={{ maxHeight: '250px', width: '100%', objectFit: 'contain', borderRadius: '4px' }}
                    />
                    <div style={{ marginTop: '6px', textAlign: 'center' }}>
                      <a href={selectedPod.photoUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: '#2563eb' }}>
                        Open original image link
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted text-sm" style={{ padding: '1rem', backgroundColor: '#f1f5f9', borderRadius: '6px' }}>
                    No photo uploaded.
                  </div>
                )}
              </div>

              {/* Notes Display */}
              {selectedPod.notes && (
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#64748b' }}>DELIVERY NOTES</strong>
                  <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', marginTop: '4px', fontSize: '0.9rem', border: '1px solid #e2e8f0' }}>
                    {selectedPod.notes}
                  </div>
                </div>
              )}

              {/* Verification Form */}
              <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <div className="form-group">
                  <label>Verification Notes / Decision Reason</label>
                  <textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="Enter approval comments or rejection reason..."
                    rows={2}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, backgroundColor: '#10b981', borderColor: '#10b981' }}
                    onClick={() => handleVerify(selectedPod.shipmentId, 'VERIFIED')}
                  >
                    <CheckCircle size={18} /> Approve Proof
                  </button>

                  <button
                    className="btn btn-primary"
                    style={{ flex: 1, backgroundColor: '#ef4444', borderColor: '#ef4444' }}
                    onClick={() => handleVerify(selectedPod.shipmentId, 'REJECTED')}
                  >
                    <XCircle size={18} /> Reject Proof
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-muted text-sm" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              Select a pending proof from the list on the left to inspect signature, photo, and complete verification.
            </div>
          )}
        </div>
      </div>

      {/* Verified Proofs Section */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#047857', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={18} color="#10b981" /> Verified Proofs Archive ({verifiedPods.length})
          </h4>
          <span className="badge badge-delivered">{verifiedPods.length} Verified</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Shipment #</th>
                <th>Recipient Name</th>
                <th>Verification Status</th>
                <th>Verified At</th>
                <th>Notes</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {verifiedPods.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No verified proofs yet. Approved proofs will appear here automatically.
                  </td>
                </tr>
              ) : (
                verifiedPods.map(pod => {
                  const s = getShipmentDetails(pod.shipmentId);
                  const verifiedDate = pod.verifiedAt ? new Date(pod.verifiedAt).toLocaleString() : 'N/A';

                  return (
                    <tr key={pod.id}>
                      <td><strong>Shipment #{pod.shipmentId}</strong> {s ? `(${s.trackingNumber})` : ''}</td>
                      <td>{pod.recipientName}</td>
                      <td><span className="badge badge-delivered">VERIFIED</span></td>
                      <td>{verifiedDate}</td>
                      <td>{pod.verificationNotes || pod.notes || 'N/A'}</td>
                      <td>
                        <button className="btn btn-sm btn-outline" onClick={() => setViewOnlyPod(pod)}>
                          <Eye size={12} /> Inspect Proof
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Viewer for Verified Proof */}
      {viewOnlyPod && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px', width: '90%' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#047857' }}>
                <CheckCircle size={20} color="#10b981" /> Verified Proof - Shipment #{viewOnlyPod.shipmentId}
              </h3>
              <button onClick={() => setViewOnlyPod(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: '#ecfdf5', padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #10b981' }}>
                <strong style={{ color: '#065f46' }}>Status: VERIFIED & APPROVED</strong>
                {viewOnlyPod.verifiedAt && (
                  <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px' }}>
                    Verified on {new Date(viewOnlyPod.verifiedAt).toLocaleString()}
                  </div>
                )}
              </div>

              <div>
                <strong style={{ fontSize: '0.85rem', color: '#64748b' }}>RECIPIENT NAME</strong>
                <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>{viewOnlyPod.recipientName}</div>
              </div>

              {viewOnlyPod.signatureData && (
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#64748b' }}>DIGITAL SIGNATURE</strong>
                  <div style={{ border: '1px solid #e2e8f0', padding: '8px', borderRadius: '6px', marginTop: '4px', backgroundColor: '#f8fafc', textAlign: 'center' }}>
                    <img src={viewOnlyPod.signatureData} alt="Recipient Signature" style={{ maxHeight: '140px', maxWidth: '100%' }} />
                  </div>
                </div>
              )}

              {viewOnlyPod.photoUrl && (
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Image size={14} /> PROOF PHOTO
                  </strong>
                  <div style={{ border: '1px solid #e2e8f0', padding: '8px', borderRadius: '6px', marginTop: '4px', textAlign: 'center' }}>
                    <img src={viewOnlyPod.photoUrl} alt="Delivery Photo" style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain' }} />
                  </div>
                </div>
              )}

              {viewOnlyPod.verificationNotes && (
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#64748b' }}>VERIFICATION NOTES</strong>
                  <div style={{ backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '6px', marginTop: '4px', fontSize: '0.9rem' }}>
                    {viewOnlyPod.verificationNotes}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button className="btn btn-outline" onClick={() => setViewOnlyPod(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
