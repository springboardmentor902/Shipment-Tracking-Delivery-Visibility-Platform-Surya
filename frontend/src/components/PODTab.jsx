import React, { useState, useRef, useEffect } from 'react';
import { FileCheck, PenTool, CheckCircle, Image, RotateCcw } from 'lucide-react';
import { apiService } from '../services/apiService.js';

export function PODTab({ shipments, selectedShipmentId, onSelectShipment, token, onPODSubmitted }) {
  const [shipmentId, setShipmentId] = useState(selectedShipmentId || '');
  const [recipientName, setRecipientName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [podRecord, setPodRecord] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState('');
  const [message, setMessage] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (selectedShipmentId) {
      setShipmentId(selectedShipmentId);
      fetchPOD(selectedShipmentId);
    }
  }, [selectedShipmentId]);

  const fetchPOD = async (id) => {
    if (!id) return;
    try {
      const data = await apiService.getPOD(id, token);
      setPodRecord(data);
    } catch (e) {
      setPodRecord(null);
    }
  };

  const handleSelectShipment = (id) => {
    setShipmentId(id);
    onSelectShipment(id);
    fetchPOD(id);
    clearCanvas();
  };

  // Canvas drawing functions
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveSignature();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureData('');
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL('image/png'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shipmentId) {
      setMessage({ text: 'Please select a shipment.', type: 'danger' });
      return;
    }
    if (!recipientName) {
      setMessage({ text: 'Recipient name is required.', type: 'danger' });
      return;
    }

    try {
      const payload = {
        recipientName,
        signatureData: signatureData || canvasRef.current?.toDataURL('image/png'),
        photoUrl,
        notes
      };
      const result = await apiService.submitPOD(shipmentId, payload, token);
      setPodRecord(result);
      setMessage({ text: 'Proof of Delivery submitted successfully! Shipment marked as DELIVERED.', type: 'success' });
      if (onPODSubmitted) onPODSubmitted();
    } catch (err) {
      setMessage({ text: err.message || 'Submission failed.', type: 'danger' });
    }
  };

  const selectedShipment = shipments.find(s => String(s.id) === String(shipmentId));

  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await apiService.uploadFile(file, token);
      setPhotoUrl(res.url);
      setMessage({ text: 'Photo uploaded successfully!', type: 'success' });
    } catch (err) {
      setMessage({ text: err.message || 'File upload failed.', type: 'danger' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <section className="tab-content active">
      <div className="content-header">
        <div>
          <h2><FileCheck size={22} /> Proof of Delivery (POD) Verification</h2>
          <p className="subtitle">Digital signature capture, recipient confirmation, and delivery proof storage</p>
        </div>
      </div>

      {message && (
        <div className={`alert-banner ${message.type}`} style={{ marginBottom: '1.5rem' }}>
          {message.text}
        </div>
      )}

      <div className="grid-2">
        {/* Left: POD Submission Form */}
        <div className="card">
          <h3><PenTool size={18} /> Submit Delivery Proof</h3>

          <div className="form-group">
            <label>Select Shipment to Complete Delivery</label>
            <select value={shipmentId} onChange={(e) => handleSelectShipment(e.target.value)}>
              <option value="">-- Choose Shipment --</option>
              {shipments.map(s => (
                <option key={s.id} value={s.id}>
                  {s.trackingNumber} ({s.senderName} → {s.receiverName}) [{s.status}]
                </option>
              ))}
            </select>
          </div>

          {selectedShipment && (
            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
              <div><strong>Receiver:</strong> {selectedShipment.receiverName} ({selectedShipment.receiverPhone})</div>
              <div><strong>Delivery Address:</strong> {selectedShipment.deliveryAddress}</div>
              <div><strong>Current Status:</strong> <span className="badge badge-medium">{selectedShipment.status}</span></div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Recipient Name *</label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Name of person receiving the package"
                required
              />
            </div>

            <div className="form-group">
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Digital Signature (Draw below)</span>
                <button type="button" onClick={clearCanvas} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <RotateCcw size={14} /> Clear Signature
                </button>
              </label>
              <canvas
                ref={canvasRef}
                width={400}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                style={{
                  border: '2px dashed #94a3b8',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  cursor: 'crosshair',
                  width: '100%',
                  touchAction: 'none'
                }}
              />
            </div>

            <div className="form-group">
              <label>Proof Photo Upload (File or URL)</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ flex: 1 }}
                />
                {isUploading && <span style={{ fontSize: '0.85rem', color: '#2563eb' }}>Uploading...</span>}
              </div>
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="Or paste photo URL (e.g. /api/files/download/... or https://...)"
              />
            </div>

            <div className="form-group">
              <label>Delivery Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Left package at front desk, received by concierge..."
                rows={3}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              <CheckCircle size={18} /> Confirm Delivery & Save POD
            </button>
          </form>
        </div>

        {/* Right: Existing POD Record Display */}
        <div className="card">
          <h3><FileCheck size={18} /> Verified POD Details</h3>

          {podRecord ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #10b981', padding: '1rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle size={24} color="#10b981" />
                <div>
                  <div style={{ fontWeight: 800, color: '#065f46' }}>Verified Proof of Delivery</div>
                  <div style={{ fontSize: '0.85rem', color: '#047857' }}>
                    Verified on {new Date(podRecord.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <strong style={{ fontSize: '0.85rem', color: '#64748b' }}>RECIPIENT NAME</strong>
                <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{podRecord.recipientName}</div>
              </div>

              {podRecord.signatureData && (
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#64748b' }}>DIGITAL SIGNATURE</strong>
                  <div style={{ border: '1px solid #e2e8f0', padding: '10px', borderRadius: '6px', marginTop: '4px', backgroundColor: '#fafafa' }}>
                    <img src={podRecord.signatureData} alt="Recipient Signature" style={{ maxHeight: '120px', maxWidth: '100%' }} />
                  </div>
                </div>
              )}

              {podRecord.photoUrl && (
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Image size={14} /> PROOF PHOTO
                  </strong>
                  <a href={podRecord.photoUrl} target="_blank" rel="noreferrer" style={{ color: '#2563eb', wordBreak: 'break-all' }}>
                    {podRecord.photoUrl}
                  </a>
                </div>
              )}

              {podRecord.notes && (
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#64748b' }}>DELIVERY NOTES</strong>
                  <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', marginTop: '4px', fontSize: '0.9rem' }}>
                    {podRecord.notes}
                  </div>
                </div>
              )}
            </div>
          ) : shipmentId ? (
            <div className="text-muted text-sm" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>No Proof of Delivery saved yet for Shipment #{shipmentId}</div>
              Fill out the recipient name, signature, and photo upload on the left to complete delivery and submit proof.
            </div>
          ) : (
            <div className="text-muted text-sm" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              Select a shipment on the left to view or submit Proof of Delivery.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
