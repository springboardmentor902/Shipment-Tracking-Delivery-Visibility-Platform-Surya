import React from 'react';
import { Truck, MapPin, Sparkles, Mail, ShieldCheck, ArrowRight, Lock, UserPlus } from 'lucide-react';

export function LandingPage({ onOpenLogin, onOpenRegister }) {
  return (
    <div className="landing-container">
      {/* Hero Advertisement Section */}
      <section className="hero-section">
        {/*
        <div className="hero-badge">
          <Sparkles size={14} /> Next-Gen Enterprise Logistics Platform
        </div>
        */}
        <h1 className="hero-title">
          Smart Real-Time Fleet Tracking & <span className="accent">Predictive ETA Engine</span>
        </h1>
        {/*
        <p className="hero-subtitle">
          Monitor live vehicle coordinates via STOMP WebSockets, automate Brevo email dispatch alerts to senders and receivers, and score delivery delay risks in real time.
        </p>
        */}
        <div className="hero-cta-group">
          <button className="btn btn-primary btn-lg" onClick={onOpenLogin}>
            <Lock size={18} /> Sign In to Access Dashboard <ArrowRight size={18} />
          </button>
          <button className="btn btn-outline btn-lg" onClick={onOpenRegister}>
            <UserPlus size={18} /> Register New Account
          </button>
        </div>
      </section>

      {/* Product Feature Highlights (Hidden for now via comment) */}
      {/*
      <section className="features-grid">
        <div className="feature-card">
          <div className="feature-icon icon-blue">
            <MapPin size={24} />
          </div>
          <h3>Live GPS Map Tracking</h3>
          <p>
            Stream driver coordinates live with STOMP WebSockets and render origin, destination, and animated vehicle position markers on Leaflet maps.
          </p>
          <button className="feature-link" onClick={onOpenLogin}>
            Explore Live Tracking <ArrowRight size={14} />
          </button>
        </div>

        <div className="feature-card">
          <div className="feature-icon icon-purple">
            <Sparkles size={24} />
          </div>
          <h3>AI ETA & Delay Risk Engine</h3>
          <p>
            Predict delivery dates and score delay risks (0 to 10) by analyzing traffic conditions, distance, Haversine progress, and shipment age.
          </p>
          <button className="feature-link" onClick={onOpenLogin}>
            Calculate Risk Metrics <ArrowRight size={14} />
          </button>
        </div>

        <div className="feature-card">
          <div className="feature-icon icon-green">
            <Mail size={24} />
          </div>
          <h3>Automated Brevo Email Alerts</h3>
          <p>
            Instantly dispatch HTML confirmation emails to senders and receivers upon shipment creation using Brevo SMTP integration.
          </p>
          <button className="feature-link" onClick={onOpenLogin}>
            View Dispatch Alerts <ArrowRight size={14} />
          </button>
        </div>

        <div className="feature-card">
          <div className="feature-icon icon-orange">
            <ShieldCheck size={24} />
          </div>
          <h3>Enterprise Role Security</h3>
          <p>
            Strict JWT role-based access control tailored for Customers, Business Clients, Logistics Operators, and System Administrators.
          </p>
          <button className="feature-link" onClick={onOpenLogin}>
            Manage User Roles <ArrowRight size={14} />
          </button>
        </div>
      </section>
      */}

      {/* Bottom CTA Banner (Hidden for now via comment) */}
      {/*
      <section className="cta-banner">
        <div className="cta-content">
          <Truck size={36} className="accent" />
          <div>
            <h2>Ready to manage your logistics fleet?</h2>
            <p>Sign in with your account credentials to view shipments, stream live GPS updates, and calculate ETAs.</p>
          </div>
        </div>
        <button className="btn btn-primary btn-lg" onClick={onOpenLogin}>
          Sign In Now
        </button>
      </section>
      */}
    </div>
  );
}
