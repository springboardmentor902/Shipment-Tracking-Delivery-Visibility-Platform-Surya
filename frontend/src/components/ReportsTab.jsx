import React, { useState, useEffect } from 'react';
import { BarChart3, Download, FileSpreadsheet, FileText, CheckCircle, Package, Truck, Clock, Filter } from 'lucide-react';
import { apiService } from '../services/apiService.js';

export function ReportsTab({ token }) {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [alert, setAlert] = useState(null);

  // Selector state
  const [reportType, setReportType] = useState('shipments');
  const [format, setFormat] = useState('pdf');

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await apiService.getPerformanceMetrics(token);
      setMetrics(data);
    } catch (e) {
      setAlert({ text: 'Failed to load performance metrics.', type: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    setAlert(null);
    try {
      await apiService.downloadReportWithType(reportType, format, token);
      setAlert({ text: `Report successfully downloaded as ${reportType}_report.${format === 'excel' ? 'xlsx' : format}`, type: 'success' });
    } catch (e) {
      setAlert({ text: e.message || 'Failed to download report.', type: 'danger' });
    } finally {
      setDownloading(false);
    }
  };

  const handleQuickDownload = async (quickFormat) => {
    setDownloading(true);
    setAlert(null);
    try {
      await apiService.downloadReport(quickFormat, token);
      setAlert({ text: `Report exported as ${quickFormat.toUpperCase()}!`, type: 'success' });
    } catch (e) {
      setAlert({ text: `Failed to export ${quickFormat.toUpperCase()} report.`, type: 'danger' });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="tab-content active">
      <div className="content-header">
        <div>
          <h2><BarChart3 size={22} /> Reports & Data Export Center</h2>
          <p className="subtitle">Generate & download customized PDF and Excel reports with role-scoped access control</p>
        </div>
      </div>

      {alert && (
        <div className={`alert-banner ${alert.type}`} style={{ marginBottom: '1.5rem' }}>
          {alert.text}
        </div>
      )}

      {/* Metrics Cards */}
      <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #2563eb' }}>
          <div style={{ backgroundColor: '#dbeafe', padding: '0.75rem', borderRadius: '50%', color: '#2563eb' }}>
            <Package size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>TOTAL SHIPMENTS</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{metrics ? metrics.totalShipments : '...'}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #10b981' }}>
          <div style={{ backgroundColor: '#d1fae5', padding: '0.75rem', borderRadius: '50%', color: '#10b981' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>DELIVERED</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{metrics ? metrics.deliveredCount : '...'}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ backgroundColor: '#fef3c7', padding: '0.75rem', borderRadius: '50%', color: '#f59e0b' }}>
            <Truck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>IN TRANSIT</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{metrics ? metrics.inTransitCount : '...'}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #6366f1' }}>
          <div style={{ backgroundColor: '#e0e7ff', padding: '0.75rem', borderRadius: '50%', color: '#6366f1' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>SUCCESS RATE</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{metrics ? `${metrics.deliverySuccessRatePercent}%` : '...'}</div>
          </div>
        </div>
      </div>

      {/* Customized Report Building Control */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3><Filter size={18} /> Report Builder & Downloader</h3>
        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
          Select your required report type and export format. Generated reports strictly contain data belonging to your account role.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.5rem', alignItems: 'end' }}>
          {/* Report Type Selector */}
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Select Report Type</label>
            <select
              className="form-control"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              style={{ width: '100%', padding: '0.65rem' }}
            >
              <option value="shipments">Shipment Report (Details, Status, Sender/Receiver)</option>
              <option value="delivery">Delivery Report (Delivered, Dates, POD Status)</option>
              <option value="routes">Route Performance Report (Distance, Est vs Actual Time)</option>
              <option value="delays">Delay Analysis Report (Delayed Shipments & Analysis)</option>
            </select>
          </div>

          {/* Format Selector */}
          <div>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Export Format</label>
            <div style={{ display: 'flex', gap: '1rem', paddingTop: '0.3rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="exportFormat"
                  value="pdf"
                  checked={format === 'pdf'}
                  onChange={() => setFormat('pdf')}
                />
                <FileText size={18} color="#dc2626" /> PDF Document (.pdf)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="exportFormat"
                  value="excel"
                  checked={format === 'excel'}
                  onChange={() => setFormat('excel')}
                />
                <FileSpreadsheet size={18} color="#16a34a" /> Excel Spreadsheet (.xlsx)
              </label>
            </div>
          </div>

          {/* Download Action */}
          <div>
            <button
              className="btn btn-primary"
              onClick={handleDownload}
              disabled={downloading}
              style={{ width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Download size={18} />
              {downloading ? 'Generating Report...' : `Download ${reportType.toUpperCase()} (${format.toUpperCase()})`}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Export Cards */}
      <div className="card">
        <h3><Download size={18} /> Quick Export All Shipments</h3>
        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
          Instantly download your full shipment records in a pre-formatted template.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', backgroundColor: '#f8fafc' }}>
            <FileSpreadsheet size={36} color="#16a34a" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: '0.5rem 0' }}>Excel Format (.xlsx)</h4>
            <button
              className="btn btn-primary"
              onClick={() => handleQuickDownload('excel')}
              disabled={downloading}
              style={{ width: '100%', backgroundColor: '#16a34a', borderColor: '#16a34a' }}
            >
              Download Excel Report
            </button>
          </div>

          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', backgroundColor: '#f8fafc' }}>
            <FileText size={36} color="#dc2626" style={{ marginBottom: '0.5rem' }} />
            <h4 style={{ margin: '0.5rem 0' }}>PDF Format (.pdf)</h4>
            <button
              className="btn btn-primary"
              onClick={() => handleQuickDownload('pdf')}
              disabled={downloading}
              style={{ width: '100%', backgroundColor: '#dc2626', borderColor: '#dc2626' }}
            >
              Download PDF Report
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
