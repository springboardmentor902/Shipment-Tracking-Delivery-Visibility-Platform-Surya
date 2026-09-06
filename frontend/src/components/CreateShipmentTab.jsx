import React, { useState } from 'react';
import { Box, User, Send, Package } from 'lucide-react';

export function CreateShipmentTab({ onSubmitShipment }) {
  const [formData, setFormData] = useState({
    senderName: 'Venkat Rao',
    senderPhone: '+919876543210',
    senderEmail: 'suryalbrcem9@gmail.com',
    senderAddress: '12/4 MG Road, Indiranagar, Bengaluru, KA 560038',
    receiverName: 'Lakshmi Narayana',
    receiverPhone: '+919876543211',
    receiverEmail: 'suryalbrcem9@gmail.com',
    receiverAddress: '45-2-1 Main Road, Surya Rao Peta, Kakinada, AP 533001',
    pickupAddress: '12/4 MG Road, Indiranagar, Bengaluru, KA 560038',
    deliveryAddress: '45-2-1 Main Road, Surya Rao Peta, Kakinada, AP 533001',
    priority: 'EXPRESS',
    description: 'Traditional Sarees & Sweets',
    weight: 2.5,
    quantity: 1,
    declaredValue: 1500.00,
    length: 35,
    width: 25,
    height: 5,
    fragile: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      senderName: formData.senderName,
      senderPhone: formData.senderPhone,
      senderEmail: formData.senderEmail || 'suryalbrcem9@gmail.com',
      senderAddress: formData.senderAddress,
      receiverName: formData.receiverName,
      receiverPhone: formData.receiverPhone,
      receiverEmail: formData.receiverEmail || 'suryalbrcem9@gmail.com',
      receiverAddress: formData.receiverAddress,
      pickupAddress: formData.pickupAddress,
      deliveryAddress: formData.deliveryAddress,
      priority: formData.priority,
      packages: [
        {
          description: formData.description,
          weight: parseFloat(formData.weight),
          quantity: parseInt(formData.quantity),
          declaredValue: parseFloat(formData.declaredValue),
          length: parseFloat(formData.length),
          width: parseFloat(formData.width),
          height: parseFloat(formData.height),
          fragile: formData.fragile
        }
      ]
    };
    onSubmitShipment(payload);
  };

  return (
    <section className="tab-content active">
      <div className="content-header">
        <div>
          <h2><Box size={22} /> Create New Shipment</h2>
          <p className="subtitle">Register a package pickup and delivery dispatch request</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid-2">
          <div className="card">
            <h3><User size={18} /> Sender & Receiver Details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Sender Name *</label>
                <input type="text" name="senderName" value={formData.senderName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Sender Phone</label>
                <input type="text" name="senderPhone" value={formData.senderPhone} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label>Sender Email (Notification Address)</label>
              <input type="email" name="senderEmail" value={formData.senderEmail} onChange={handleChange} placeholder="suryalbrcem9@gmail.com" />
            </div>

            <div className="form-group">
              <label>Sender Address *</label>
              <input type="text" name="senderAddress" value={formData.senderAddress} onChange={handleChange} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Receiver Name *</label>
                <input type="text" name="receiverName" value={formData.receiverName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Receiver Phone</label>
                <input type="text" name="receiverPhone" value={formData.receiverPhone} onChange={handleChange} />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Receiver Email (Notification Address)</label>
                <input type="email" name="receiverEmail" value={formData.receiverEmail} onChange={handleChange} placeholder="suryalbrcem9@gmail.com" />
              </div>
              <div className="form-group">
                <label>Priority Level</label>
                <select name="priority" value={formData.priority} onChange={handleChange}>
                  <option value="STANDARD">STANDARD</option>
                  <option value="EXPRESS">EXPRESS</option>
                  <option value="OVERNIGHT">OVERNIGHT</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Pickup Address *</label>
              <input type="text" name="pickupAddress" value={formData.pickupAddress} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Delivery Address *</label>
              <input type="text" name="deliveryAddress" value={formData.deliveryAddress} onChange={handleChange} required />
            </div>
          </div>

          <div className="card">
            <h3><Package size={18} /> Package Specification</h3>
            <div className="form-group">
              <label>Description</label>
              <input type="text" name="description" value={formData.description} onChange={handleChange} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Weight (kg)</label>
                <input type="number" step="0.1" name="weight" value={formData.weight} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Declared Value ($)</label>
                <input type="number" step="0.01" name="declaredValue" value={formData.declaredValue} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Length (cm)</label>
                <input type="number" name="length" value={formData.length} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Width (cm)</label>
                <input type="number" name="width" value={formData.width} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label>Height (cm)</label>
                <input type="number" name="height" value={formData.height} onChange={handleChange} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
              <input type="checkbox" id="fragile" name="fragile" checked={formData.fragile} onChange={handleChange} />
              <label htmlFor="fragile">Fragile Item</label>
            </div>

            <button type="submit" className="btn btn-success btn-block" style={{ marginTop: '1.5rem' }}>
              <Send size={16} /> Submit Shipment Request
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
