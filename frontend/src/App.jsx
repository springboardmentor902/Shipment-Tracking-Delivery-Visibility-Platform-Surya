import React, { useState, useEffect } from 'react';
import { Package, PlusSquare, MapPin, Calculator, Users, FileCheck, BarChart3, ShieldCheck, LayoutDashboard } from 'lucide-react';
import { Navbar } from './components/Navbar.jsx';
import { LandingPage } from './components/LandingPage.jsx';
import { ShipmentsTab } from './components/ShipmentsTab.jsx';
import { CreateShipmentTab } from './components/CreateShipmentTab.jsx';
import { LiveTrackingTab } from './components/LiveTrackingTab.jsx';
import { ETATab } from './components/ETATab.jsx';
import { PODTab } from './components/PODTab.jsx';
import { PODVerificationQueueTab } from './components/PODVerificationQueueTab.jsx';
import { ReportsTab } from './components/ReportsTab.jsx';
import { AdminTab } from './components/AdminTab.jsx';
import { AnalyticsDashboardTab } from './components/AnalyticsDashboardTab.jsx';
import { LoginModal, RegisterModal } from './components/AuthModals.jsx';

import { apiService } from './services/apiService.js';
import { websocketService } from './services/websocketService.js';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('shiptrack_token') || null);
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('shiptrack_user')) || null);

  const [activeTab, setActiveTab] = useState('shipmentsTab');
  const [shipments, setShipments] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState(null);
  const [routeData, setRouteData] = useState(null);
  const [etaData, setEtaData] = useState(null);

  const [isWsConnected, setIsWsConnected] = useState(false);
  const [wsLogs, setWsLogs] = useState([]);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [alert, setAlert] = useState(null);

  const showAlert = (message, type = 'success') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  const addWsLog = (text) => {
    const time = new Date().toLocaleTimeString();
    setWsLogs(prev => [...prev, `[${time}] ${text}`]);
  };

  // Initial Load
  useEffect(() => {
    if (token) {
      loadShipments();
      if (currentUser?.role === 'ADMINISTRATOR') {
        loadAdminUsers();
      }
    }
  }, [token]);

  // Connect WebSocket
  useEffect(() => {
    websocketService.connect(
      () => {
        setIsWsConnected(true);
        addWsLog('Connected to WebSocket broker at /api/ws/tracking');
      },
      (err) => {
        setIsWsConnected(false);
        addWsLog('WebSocket status: Disconnected / Error');
      }
    );

    return () => {
      websocketService.disconnect();
    };
  }, []);

  const loadShipments = async () => {
    try {
      const data = await apiService.getShipments(token);
      if (data && data.length > 0) {
        setShipments(data);
      }
    } catch (e) {
      console.warn('Error loading shipments.');
    }
  };

  const loadAdminUsers = async () => {
    try {
      const users = await apiService.getAdminUsers(token);
      setAdminUsers(users);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const res = await apiService.login(email, password);
      setToken(res.token);
      setCurrentUser(res.user);
      localStorage.setItem('shiptrack_token', res.token);
      localStorage.setItem('shiptrack_user', JSON.stringify(res.user));

      setIsLoginOpen(false);
      showAlert(`Welcome back, ${res.user.fullName}!`, 'success');
    } catch (err) {
      showAlert(err.message, 'danger');
    }
  };

  const handleRegister = async (payload) => {
    try {
      await apiService.register(payload);
      setIsRegisterOpen(false);
      showAlert('Registration successful! Please login with your credentials.', 'success');
      setIsLoginOpen(true);
    } catch (err) {
      showAlert(err.message, 'danger');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('shiptrack_token');
    localStorage.removeItem('shiptrack_user');
    setShipments([]);
    showAlert('Logged out successfully.', 'success');
  };

  // Automatic Session Expiry (10 mins) & Inactivity Timeout (10 mins)
  useEffect(() => {
    if (!token) return;

    const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes inactivity timeout
    const SESSION_EXPIRY_LIMIT = 10 * 60 * 1000; // 10 minutes session expiry

    let inactivityTimer;
    let sessionTimer;

    const performAutoLogout = (reason) => {
      setToken(null);
      setCurrentUser(null);
      localStorage.removeItem('shiptrack_token');
      localStorage.removeItem('shiptrack_user');
      setShipments([]);
      showAlert(reason, 'warning');
    };

    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        performAutoLogout('Logged out automatically due to 10 minutes of inactivity.');
      }, INACTIVITY_LIMIT);
    };

    // 10-minute session expiry timer
    sessionTimer = setTimeout(() => {
      performAutoLogout('Your 10-minute session has expired. Please log in again.');
    }, SESSION_EXPIRY_LIMIT);

    const activityEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    activityEvents.forEach(event => window.addEventListener(event, resetInactivityTimer));

    resetInactivityTimer();

    return () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      if (sessionTimer) clearTimeout(sessionTimer);
      activityEvents.forEach(event => window.removeEventListener(event, resetInactivityTimer));
    };
  }, [token]);

  const handleCreateShipment = async (payload) => {
    try {
      const created = await apiService.createShipment(payload, token);
      showAlert(`Shipment Created! Tracking #: ${created.trackingNumber}. Confirmation email sent via Brevo.`, 'success');

      await apiService.createRoute(created.id, {
        originAddress: created.pickupAddress || created.senderAddress,
        destinationAddress: created.deliveryAddress || created.receiverAddress
      }, token).catch(() => {});

      loadShipments();
      setActiveTab('shipmentsTab');
    } catch (e) {
      showAlert(e.message, 'danger');
    }
  };

  const handleSelectTrackingShipment = async (shipmentId) => {
    setSelectedShipmentId(shipmentId);
    if (!shipmentId) return;

    try {
      const route = await apiService.getRouteByShipmentId(shipmentId, token);
      setRouteData(route);
    } catch (e) {
      setRouteData(null);
      showAlert('No route object registered for this shipment.', 'warning');
    }

    addWsLog(`Subscribing to /topic/shipment/${shipmentId}/location`);
    websocketService.subscribeToShipment(shipmentId, (locationData) => {
      addWsLog(`[GPS Update] Lat: ${locationData.latitude}, Lng: ${locationData.longitude}`);
      setRouteData(prev => prev ? ({
        ...prev,
        currentLatitude: locationData.latitude,
        currentLongitude: locationData.longitude
      }) : null);
    });
  };

  const handleUpdateLocation = async (routeId, lat, lng) => {
    try {
      await apiService.updateRouteLocation(routeId, { latitude: lat, longitude: lng }, token);
      showAlert(`GPS coordinate updated: (${lat}, ${lng})`, 'success');
    } catch (e) {
      showAlert(e.message, 'danger');
    }
  };

  const handleCalculateETA = async (shipmentId) => {
    try {
      const res = await apiService.predictETA(shipmentId, token);
      setEtaData(res);
    } catch (e) {
      showAlert(e.message, 'danger');
    }
  };

  const handleChangeRole = async (userId, role) => {
    try {
      await apiService.updateUserRole(userId, role, token);
      showAlert(`Role updated to ${role}`, 'success');
      loadAdminUsers();
    } catch (e) {
      showAlert(e.message, 'danger');
    }
  };

  return (
    <div>
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenRegister={() => setIsRegisterOpen(true)}
      />

      {alert && (
        <div className={`alert-banner ${alert.type}`}>
          <span>{alert.message}</span>
          <button
            onClick={() => setAlert(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              color: 'inherit',
              marginLeft: '0.5rem',
              lineHeight: 1
            }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Conditionally Render Landing Advertisement vs Dashboard */}
      {!currentUser ? (
        <LandingPage
          onOpenLogin={() => setIsLoginOpen(true)}
          onOpenRegister={() => setIsRegisterOpen(true)}
        />
      ) : (
        <main className="main-container">
          <nav className="dashboard-tabs">
            <button className={`tab-btn ${activeTab === 'shipmentsTab' ? 'active' : ''}`} onClick={() => setActiveTab('shipmentsTab')}>
              <Package size={18} /> Shipments
            </button>
            <button className={`tab-btn ${activeTab === 'createShipmentTab' ? 'active' : ''}`} onClick={() => setActiveTab('createShipmentTab')}>
              <PlusSquare size={18} /> Create Shipment
            </button>
            <button className={`tab-btn ${activeTab === 'trackingTab' ? 'active' : ''}`} onClick={() => setActiveTab('trackingTab')}>
              <MapPin size={18} /> Live GPS Tracking & Map
            </button>

            <button className={`tab-btn ${activeTab === 'etaTab' ? 'active' : ''}`} onClick={() => setActiveTab('etaTab')}>
              <Calculator size={18} /> ETA & Risk Analysis
            </button>



            <button className={`tab-btn ${activeTab === 'podTab' ? 'active' : ''}`} onClick={() => setActiveTab('podTab')}>
              <FileCheck size={18} /> Proof of Delivery
            </button>

            {['SUPPORT_AGENT', 'ADMINISTRATOR'].includes(currentUser?.role) && (
              <button className={`tab-btn ${activeTab === 'podVerifyTab' ? 'active' : ''}`} onClick={() => setActiveTab('podVerifyTab')}>
                <ShieldCheck size={18} /> POD Verification Queue
              </button>
            )}

            <button className={`tab-btn ${activeTab === 'analyticsTab' ? 'active' : ''}`} onClick={() => setActiveTab('analyticsTab')}>
              <LayoutDashboard size={18} /> Analytics Dashboard
            </button>

            <button className={`tab-btn ${activeTab === 'reportsTab' ? 'active' : ''}`} onClick={() => setActiveTab('reportsTab')}>
              <BarChart3 size={18} /> Reports & Export
            </button>


            {currentUser?.role === 'ADMINISTRATOR' && (
              <button className={`tab-btn ${activeTab === 'adminTab' ? 'active' : ''}`} onClick={() => setActiveTab('adminTab')}>
                <Users size={18} /> Admin Management
              </button>
            )}
          </nav>

          {activeTab === 'shipmentsTab' && (
            <ShipmentsTab
              shipments={shipments}
              currentUser={currentUser}
              token={token}
              onCreateNew={() => setActiveTab('createShipmentTab')}
              onTrack={(id) => {
                setActiveTab('trackingTab');
                handleSelectTrackingShipment(id);
              }}
              onETA={(id) => {
                setActiveTab('etaTab');
                setSelectedShipmentId(id);
                handleCalculateETA(id);
              }}
              onPOD={(id) => {
                setActiveTab('podTab');
                setSelectedShipmentId(id);
              }}
            />
          )}

          {activeTab === 'createShipmentTab' && (
            <CreateShipmentTab onSubmitShipment={handleCreateShipment} />
          )}

          {activeTab === 'trackingTab' && (
            <LiveTrackingTab
              shipments={shipments}
              selectedShipmentId={selectedShipmentId}
              onSelectShipment={handleSelectTrackingShipment}
              routeData={routeData}
              onUpdateLocation={handleUpdateLocation}
              wsLogs={wsLogs}
              isWsConnected={isWsConnected}
            />
          )}

          {activeTab === 'etaTab' && (
            <ETATab
              shipments={shipments}
              selectedShipmentId={selectedShipmentId}
              onSelectShipment={setSelectedShipmentId}
              onCalculateETA={handleCalculateETA}
              etaData={etaData}
            />
          )}

          {activeTab === 'podTab' && (
            <PODTab
              shipments={shipments}
              selectedShipmentId={selectedShipmentId}
              onSelectShipment={setSelectedShipmentId}
              token={token}
              onPODSubmitted={() => loadShipments()}
            />
          )}

          {activeTab === 'podVerifyTab' && ['SUPPORT_AGENT', 'ADMINISTRATOR'].includes(currentUser?.role) && (
            <PODVerificationQueueTab token={token} shipments={shipments} />
          )}

          {activeTab === 'analyticsTab' && (
            <AnalyticsDashboardTab token={token} currentUser={currentUser} />
          )}

          {activeTab === 'reportsTab' && (
            <ReportsTab token={token} />
          )}

          {activeTab === 'adminTab' && currentUser?.role === 'ADMINISTRATOR' && (
            <AdminTab users={adminUsers} onChangeRole={handleChangeRole} />
          )}
        </main>
      )}

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onLogin={handleLogin} />
      <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} onRegister={handleRegister} />
    </div>
  );
}
