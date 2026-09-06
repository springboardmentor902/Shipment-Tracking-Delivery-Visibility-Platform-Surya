const API_BASE = '';

const getHeaders = (token) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const apiService = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Login failed');
    }
    return res.json();
  },

  register: async (payload) => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Registration failed');
    return res.json();
  },

  // Shipments
  getShipments: async (token) => {
    const res = await fetch(`${API_BASE}/api/shipments`, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch shipments');
    return res.json();
  },

  createShipment: async (payload, token) => {
    const res = await fetch(`${API_BASE}/api/shipments`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create shipment');
    return res.json();
  },

  // Routes
  getRouteByShipmentId: async (shipmentId, token) => {
    const res = await fetch(`${API_BASE}/api/routes/${shipmentId}`, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Route not found');
    return res.json();
  },

  getRouteHistory: async (shipmentId, token) => {
    const res = await fetch(`${API_BASE}/api/routes/${shipmentId}/history`, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch route history');
    return res.json();
  },

  createRoute: async (shipmentId, payload, token) => {
    const res = await fetch(`${API_BASE}/api/routes/${shipmentId}`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to create route');
    return res.json();
  },

  updateRouteLocation: async (routeId, locationData, token) => {
    const res = await fetch(`${API_BASE}/api/routes/${routeId}/location`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(locationData),
    });
    if (!res.ok) throw new Error('Failed to update location');
    return res.json();
  },

  // ETA
  predictETA: async (shipmentId, token) => {
    const res = await fetch(`${API_BASE}/api/eta/${shipmentId}/predict`, {
      method: 'POST',
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('ETA calculation failed');
    return res.json();
  },

  // Admin
  getAdminUsers: async (token) => {
    const res = await fetch(`${API_BASE}/api/admin/users`, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch admin users');
    return res.json();
  },

  updateUserRole: async (userId, role, token) => {
    const res = await fetch(`${API_BASE}/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: getHeaders(token),
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw new Error('Role update failed');
    return res.json();
  },

  // File Upload
  uploadFile: async (file, token) => {
    const formData = new FormData();
    formData.append('file', file);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/api/files/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error('File upload failed');
    return res.json();
  },

  // POD
  submitPOD: async (shipmentId, payload, token) => {
    const res = await fetch(`${API_BASE}/api/pod/${shipmentId}`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to submit Proof of Delivery');
    return res.json();
  },

  verifyPOD: async (shipmentId, payload, token) => {
    const res = await fetch(`${API_BASE}/api/pod/${shipmentId}/verify`, {
      method: 'PATCH',
      headers: getHeaders(token),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to verify Proof of Delivery');
    return res.json();
  },

  getPendingPODs: async (token) => {
    const res = await fetch(`${API_BASE}/api/pod/pending`, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch pending Proofs of Delivery');
    return res.json();
  },

  getAllPODs: async (token) => {
    const res = await fetch(`${API_BASE}/api/pod/all`, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch Proofs of Delivery');
    return res.json();
  },

  getPOD: async (shipmentId, token) => {
    const res = await fetch(`${API_BASE}/api/pod/${shipmentId}`, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Proof of Delivery not found');
    return res.json();
  },

  // Reports & Analytics
  getCustomerAnalytics: async (token) => {
    const res = await fetch(`${API_BASE}/api/analytics/customer`, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch customer analytics');
    return res.json();
  },

  getBusinessAnalytics: async (token) => {
    const res = await fetch(`${API_BASE}/api/analytics/business`, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch business analytics');
    return res.json();
  },

  getAdminAnalytics: async (token) => {
    const res = await fetch(`${API_BASE}/api/analytics/admin`, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch admin analytics');
    return res.json();
  },

  getPerformanceMetrics: async (token) => {
    const res = await fetch(`${API_BASE}/api/reports/performance`, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error('Failed to fetch performance metrics');
    return res.json();
  },

  downloadReportWithType: async (reportType, format, token) => {
    const res = await fetch(`${API_BASE}/api/reports/${reportType}?format=${format}`, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error(`Failed to download ${reportType} report in ${format.toUpperCase()} format`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ext = format === 'excel' ? 'xlsx' : format;
    a.download = `${reportType}_report.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  downloadReport: async (format, token) => {
    const res = await fetch(`${API_BASE}/api/reports/shipments?format=${format}`, {
      headers: getHeaders(token),
    });
    if (!res.ok) throw new Error(`Failed to download ${format.toUpperCase()} report`);
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ext = format === 'excel' ? 'xlsx' : format;
    a.download = `shipments_report.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
