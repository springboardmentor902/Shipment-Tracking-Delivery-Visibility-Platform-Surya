import React, { useState } from 'react';
import { Package, Plus, MapPin, Clock, FileCheck, X, Image, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight, Search, XCircle, RotateCcw, History } from 'lucide-react';
import { apiService } from '../services/apiService.js';
import { RouteHistory } from './RouteHistory.jsx';

export function ShipmentsTab({ shipments, onTrack, onETA, onPOD, onCreateNew, currentUser, token }) {
  const [selectedPodShipment, setSelectedPodShipment] = useState(null);
  const [routeHistoryShipment, setRouteHistoryShipment] = useState(null);
  const [podData, setPodData] = useState(null);
  const [loadingPod, setLoadingPod] = useState(false);
  const [podError, setPodError] = useState(null);

  // Completed Shipments Search, Filter & Pagination States
  const [completedSearchTerm, setCompletedSearchTerm] = useState('');
  const [completedStatusFilter, setCompletedStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const handleOpenPODModal = async (shipment) => {
    setSelectedPodShipment(shipment);
    setLoadingPod(true);
    setPodError(null);
    setPodData(null);
    try {
      const data = await apiService.getPOD(shipment.id, token);
      setPodData(data);
    } catch (err) {
      setPodError(err.message || 'Proof of Delivery not found for this shipment.');
    } finally {
      setLoadingPod(false);
    }
  };

  const handleClosePODModal = () => {
    setSelectedPodShipment(null);
    setPodData(null);
    setPodError(null);
  };

  // Status Counts
  const totalCount = shipments.length;
  const pendingCount = shipments.filter(s => s.status === 'PENDING').length;
  const inTransitCount = shipments.filter(s => s.status === 'IN_TRANSIT').length;
  const deliveredCount = shipments.filter(s => s.status === 'DELIVERED').length;
  const failedReturnedCount = shipments.filter(s => s.status === 'FAILED' || s.status === 'RETURNED').length;
  const cancelledCount = shipments.filter(s => s.status === 'CANCELLED').length;

  // 1. Sort by Newest Created At top
  const sortedShipments = [...shipments].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : Number(a.id || 0);
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : Number(b.id || 0);
    return timeB - timeA;
  });

  // Active / Pending Shipments (PENDING, IN_TRANSIT)
  const activeShipments = sortedShipments.filter(s => s.status === 'PENDING' || s.status === 'IN_TRANSIT');

  // Completed / Delivered / Exception Shipments (DELIVERED, FAILED, RETURNED, CANCELLED)
  const completedShipments = sortedShipments.filter(s =>
    s.status === 'DELIVERED' || s.status === 'FAILED' || s.status === 'RETURNED' || s.status === 'CANCELLED'
  );

  // Filter Completed Shipments
  const filteredCompletedShipments = completedShipments.filter(s => {
    const matchesSearch = !completedSearchTerm || (
      (s.trackingNumber && s.trackingNumber.toLowerCase().includes(completedSearchTerm.toLowerCase())) ||
      (s.senderName && s.senderName.toLowerCase().includes(completedSearchTerm.toLowerCase())) ||
      (s.receiverName && s.receiverName.toLowerCase().includes(completedSearchTerm.toLowerCase())) ||
      (s.deliveryAddress && s.deliveryAddress.toLowerCase().includes(completedSearchTerm.toLowerCase()))
    );

    let matchesStatus = true;
    if (completedStatusFilter === 'DELIVERED') matchesStatus = s.status === 'DELIVERED';
    else if (completedStatusFilter === 'FAILED_RETURNED') matchesStatus = s.status === 'FAILED' || s.status === 'RETURNED';
    else if (completedStatusFilter === 'CANCELLED') matchesStatus = s.status === 'CANCELLED';

    return matchesSearch && matchesStatus;
  });

  // Paginate Completed Shipments
  const totalItems = filteredCompletedShipments.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const validCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const currentCompletedShipments = filteredCompletedShipments.slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <section className="tab-content active">
      <div className="content-header">
        <div>
          <h2><Package size={22} /> Shipments Dashboard</h2>
          <p className="subtitle">View and monitor shipment statuses, receivers, and route details</p>
        </div>
        <button className="btn btn-primary" onClick={onCreateNew}>
          <Plus size={16} /> New Shipment
        </button>
      </div>

      {/* Row 1: Primary Overview KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Total Shipments */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '1.25rem',
            borderRadius: '10px',
            border: '2px solid #2563eb',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div style={{ backgroundColor: '#eff6ff', padding: '0.75rem', borderRadius: '8px', color: '#2563eb' }}>
            <Package size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Total Shipments</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{totalCount}</div>
          </div>
        </div>

        {/* Pending Shipments */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '1.25rem',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div style={{ backgroundColor: '#fffbeb', padding: '0.75rem', borderRadius: '8px', color: '#d97706' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Pending Left</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309' }}>{pendingCount}</div>
          </div>
        </div>

        {/* In Transit */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '1.25rem',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}
        >
          <div style={{ backgroundColor: '#e0e7ff', padding: '0.75rem', borderRadius: '8px', color: '#4338ca' }}>
            <MapPin size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>In Transit</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#3730a3' }}>{inTransitCount}</div>
          </div>
        </div>

        {/* Total Delivered */}
        <div
          style={{
            backgroundColor: '#ffffff',
            padding: '1.25rem',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
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
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Delivered</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#065f46' }}>{deliveredCount}</div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Active / Pending Shipments Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '2.5rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Tracking #</th>
                <th>Sender</th>
                <th>Receiver & Address</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Packages</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeShipments.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No active or pending shipments found.</td></tr>
              ) : (
                activeShipments.map(s => {
                  const statusClass = s.status === 'IN_TRANSIT' ? 'badge-intransit' : 'badge-pending';
                  const createdDate = s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A';
                  const pkgDesc = s.packages && s.packages.length > 0 ? s.packages[0].description : 'Standard Package';

                  return (
                    <tr key={s.id}>
                      <td><strong>{s.trackingNumber}</strong></td>
                      <td>{s.senderName}</td>
                      <td>
                        {s.receiverName}<br />
                        <span className="text-muted text-sm">{s.deliveryAddress}</span>
                      </td>
                      <td><span className={`badge ${statusClass}`}>{s.status}</span></td>
                      <td><span className="badge badge-role">{s.priority || 'STANDARD'}</span></td>
                      <td>{pkgDesc}</td>
                      <td>{createdDate}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <button className="btn btn-sm btn-primary" onClick={() => onTrack(s.id)}>
                            <MapPin size={12} /> Track
                          </button>
                          <button className="btn btn-sm btn-outline" onClick={() => setRouteHistoryShipment(s)} title="View Route History & Re-route">
                            <History size={12} /> History
                          </button>
                          <button className="btn btn-sm btn-outline" onClick={() => onETA(s.id)}>
                            <Clock size={12} /> ETA
                          </button>
                          {onPOD && (
                            <button className="btn btn-sm btn-outline" onClick={() => onPOD(s.id)}>
                              <FileCheck size={12} /> POD
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: DELIVERY BREAKDOWN & EXCEPTION BREAKDOWN Header */}
      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
          DELIVERY BREAKDOWN & EXCEPTION BREAKDOWN
        </h4>

        {/* Breakdown Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          {/* Successfully Completed */}
          <div
            onClick={() => { setCompletedStatusFilter(completedStatusFilter === 'DELIVERED' ? 'ALL' : 'DELIVERED'); setCurrentPage(1); }}
            style={{
              backgroundColor: '#ffffff',
              padding: '1rem 1.25rem',
              borderRadius: '8px',
              border: completedStatusFilter === 'DELIVERED' ? '2px solid #10b981' : '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle size={20} color="#10b981" />
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>Successfully Completed</span>
            </div>
            <span className="badge badge-delivered" style={{ fontSize: '0.9rem', padding: '0.2rem 0.6rem' }}>{deliveredCount}</span>
          </div>

          {/* Failed & Returned */}
          <div
            onClick={() => { setCompletedStatusFilter(completedStatusFilter === 'FAILED_RETURNED' ? 'ALL' : 'FAILED_RETURNED'); setCurrentPage(1); }}
            style={{
              backgroundColor: '#ffffff',
              padding: '1rem 1.25rem',
              borderRadius: '8px',
              border: completedStatusFilter === 'FAILED_RETURNED' ? '2px solid #f59e0b' : '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <RotateCcw size={20} color="#f59e0b" />
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>Failed & Returned</span>
            </div>
            <span className="badge badge-warning" style={{ fontSize: '0.9rem', padding: '0.2rem 0.6rem' }}>{failedReturnedCount}</span>
          </div>

          {/* Cancelled */}
          <div
            onClick={() => { setCompletedStatusFilter(completedStatusFilter === 'CANCELLED' ? 'ALL' : 'CANCELLED'); setCurrentPage(1); }}
            style={{
              backgroundColor: '#ffffff',
              padding: '1rem 1.25rem',
              borderRadius: '8px',
              border: completedStatusFilter === 'CANCELLED' ? '2px solid #ef4444' : '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <XCircle size={20} color="#ef4444" />
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>Cancelled</span>
            </div>
            <span className="badge badge-danger" style={{ fontSize: '0.9rem', padding: '0.2rem 0.6rem' }}>{cancelledCount}</span>
          </div>
        </div>
      </div>

      {/* Completed & Exception Shipments Table Card */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Tracking #</th>
                <th>Sender</th>
                <th>Receiver & Address</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Packages</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentCompletedShipments.length === 0 ? (
                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No completed or exception shipments found.</td></tr>
              ) : (
                currentCompletedShipments.map(s => {
                  const statusClass = s.status === 'DELIVERED' ? 'badge-delivered' :
                                     s.status === 'CANCELLED' ? 'badge-danger' : 'badge-warning';
                  const createdDate = s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A';
                  const pkgDesc = s.packages && s.packages.length > 0 ? s.packages[0].description : 'Standard Package';

                  return (
                    <tr key={s.id}>
                      <td><strong>{s.trackingNumber}</strong></td>
                      <td>{s.senderName}</td>
                      <td>
                        {s.receiverName}<br />
                        <span className="text-muted text-sm">{s.deliveryAddress}</span>
                      </td>
                      <td><span className={`badge ${statusClass}`}>{s.status}</span></td>
                      <td><span className="badge badge-role">{s.priority || 'STANDARD'}</span></td>
                      <td>{pkgDesc}</td>
                      <td>{createdDate}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <button className="btn btn-sm btn-primary" onClick={() => onTrack(s.id)}>
                            <MapPin size={12} /> Track
                          </button>
                          <button className="btn btn-sm btn-outline" onClick={() => onETA(s.id)}>
                            <Clock size={12} /> ETA
                          </button>
                          {s.status === 'DELIVERED' && (
                            <button className="btn btn-sm btn-outline" style={{ borderColor: '#10b981', color: '#047857' }} onClick={() => handleOpenPODModal(s)}>
                              <FileCheck size={12} /> View Proof
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls for Completed Table */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1.25rem', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Showing <strong>{totalItems > 0 ? startIndex + 1 : 0}</strong> to <strong>{endIndex}</strong> of <strong>{totalItems}</strong> shipments
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: '#ffffff' }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <button
                className="btn btn-sm btn-outline"
                onClick={() => handlePageChange(validCurrentPage - 1)}
                disabled={validCurrentPage === 1}
                style={{ opacity: validCurrentPage === 1 ? 0.5 : 1, cursor: validCurrentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                <ChevronLeft size={14} /> Prev
              </button>

              <span style={{ padding: '0 0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                Page {validCurrentPage} of {totalPages}
              </span>

              <button
                className="btn btn-sm btn-outline"
                onClick={() => handlePageChange(validCurrentPage + 1)}
                disabled={validCurrentPage >= totalPages}
                style={{ opacity: validCurrentPage >= totalPages ? 0.5 : 1, cursor: validCurrentPage >= totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Proof of Delivery Modal */}
      {selectedPodShipment && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '550px', width: '90%' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={20} color="#2563eb" /> Proof of Delivery - {selectedPodShipment.trackingNumber}
              </h3>
              <button onClick={handleClosePODModal} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {loadingPod ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>Loading Proof of Delivery...</div>
            ) : podError ? (
              <div style={{ backgroundColor: '#eff6ff', border: '1px solid #3b82f6', color: '#1e40af', padding: '1.25rem', borderRadius: '8px', textAlign: 'center' }}>
                <FileCheck size={28} style={{ marginBottom: '0.5rem', color: '#2563eb' }} />
                <div style={{ fontWeight: 700, fontSize: '1rem' }}>Proof of Delivery Not Submitted Yet</div>
                <div style={{ fontSize: '0.875rem', marginTop: '4px', color: '#1e3a8a' }}>
                  No digital proof has been submitted for this shipment yet. The Logistics Operator will upload recipient signature and photo proof upon delivery.
                </div>
              </div>
            ) : podData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                  padding: '0.75rem 1rem',
                  borderRadius: '6px',
                  backgroundColor: podData.verificationStatus === 'VERIFIED' ? '#ecfdf5' : podData.verificationStatus === 'REJECTED' ? '#fef2f2' : '#fffbeb',
                  border: `1px solid ${podData.verificationStatus === 'VERIFIED' ? '#10b981' : podData.verificationStatus === 'REJECTED' ? '#ef4444' : '#f59e0b'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  {podData.verificationStatus === 'VERIFIED' ? <CheckCircle size={20} color="#10b981" /> : <AlertTriangle size={20} color="#f59e0b" />}
                  <div>
                    <strong style={{ color: podData.verificationStatus === 'VERIFIED' ? '#065f46' : podData.verificationStatus === 'REJECTED' ? '#991b1b' : '#92400e' }}>
                      Status: {podData.verificationStatus || 'PENDING VERIFICATION'}
                    </strong>
                    {podData.verifiedAt && (
                      <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                        Verified on {new Date(podData.verifiedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#64748b' }}>RECIPIENT NAME</strong>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700 }}>{podData.recipientName}</div>
                </div>

                {podData.signatureData && (
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: '#64748b' }}>DIGITAL SIGNATURE</strong>
                    <div style={{ border: '1px solid #e2e8f0', padding: '8px', borderRadius: '6px', marginTop: '4px', backgroundColor: '#f8fafc', textAlign: 'center' }}>
                      <img src={podData.signatureData} alt="Recipient Signature" style={{ maxHeight: '120px', maxWidth: '100%' }} />
                    </div>
                  </div>
                )}

                {podData.photoUrl && (
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Image size={14} /> PROOF PHOTO
                    </strong>
                    <div style={{ border: '1px solid #e2e8f0', padding: '8px', borderRadius: '6px', marginTop: '4px', textAlign: 'center' }}>
                      <img src={podData.photoUrl} alt="Delivery Photo" style={{ maxHeight: '180px', maxWidth: '100%', objectFit: 'contain' }} />
                    </div>
                  </div>
                )}

                {podData.notes && (
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: '#64748b' }}>DELIVERY NOTES</strong>
                    <div style={{ backgroundColor: '#f8fafc', padding: '8px 12px', borderRadius: '6px', marginTop: '4px', fontSize: '0.9rem' }}>
                      {podData.notes}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button className="btn btn-outline" onClick={handleClosePODModal}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Route History & Re-route Modal */}
      {routeHistoryShipment && (
        <RouteHistory
          shipment={routeHistoryShipment}
          token={token}
          onClose={() => setRouteHistoryShipment(null)}
          onRouteUpdated={() => {}}
        />
      )}
    </section>
  );
}
