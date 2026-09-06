import React from 'react';
import { Truck, ShieldCheck, User, LogOut, Lock, UserPlus, Zap } from 'lucide-react';

export function Navbar({ currentUser, onQuickLogin, onLogout, onOpenLogin, onOpenRegister }) {
  return (
    <header className="navbar">
      <div class="nav-container">
        <div className="brand">
          <Truck className="accent" size={28} />
          <span>ShipTrack <span className="accent">Pro</span></span>
        </div>

        <div className="nav-actions">
          {currentUser ? (
            <div className="user-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} />
              <span>{currentUser.fullName}</span>
              <span className="badge badge-role">{currentUser.role}</span>
              <button className="btn btn-sm btn-danger-outline" onClick={onLogout}>
                <LogOut size={14} /> Logout
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-primary" onClick={onOpenLogin}>
                <Lock size={16} /> Login
              </button>
              <button className="btn btn-secondary" onClick={onOpenRegister}>
                <UserPlus size={16} /> Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
