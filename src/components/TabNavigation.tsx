import React from 'react';
import {
  LayoutDashboard,
  Image,
  Music,
  Video,
  Camera,
  Shield,
  Activity,
  Globe,
  Lock
} from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isAdminMode: boolean;
  setIsAdminMode: (admin: boolean) => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
  isAdminMode,
  setIsAdminMode
}) => {
  const baseItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'image', label: 'Image Forensics', icon: Image },
    { id: 'audio', label: 'Audio Analyzer', icon: Music },
    { id: 'video', label: 'Video Scanner', icon: Video },
    { id: 'live', label: 'Live Webcam Scanner', icon: Camera },
    { id: 'footprint', label: 'Footprint Tracer', icon: Globe },
  ];

  const navItems = isAdminMode
    ? [...baseItems, { id: 'admin', label: 'Admin Portal', icon: Lock }]
    : baseItems;

  return (
    <aside className="cyber-sidebar">
      <div
        className="brand-container"
        onDoubleClick={() => {
          const nextState = !isAdminMode;
          localStorage.setItem('defend_ai_admin_mode', nextState.toString());
          setIsAdminMode(nextState);
          alert(nextState ? '🔑 Admin mode activated! Admin Portal tab is now visible.' : '🔒 Admin mode deactivated. Admin Portal tab is hidden.');
          if (!nextState && activeTab === 'admin') {
            setActiveTab('dashboard');
          }
        }}
        style={{ cursor: 'pointer' }}
        title="Double click to toggle Admin mode"
      >
        <div className="brand-logo">
          <Shield className="logo-icon" />
        </div>
        <div className="brand-text">
          <h1 className="brand-title">DEFEND<span className="brand-gradient-text">.AI</span></h1>
          <p className="brand-subtitle">FORENSIC CORE ENGINE</p>
        </div>
      </div>

      <div className="system-status-indicator">
        <Activity className="status-pulse-icon" />
        <span className="status-label">SYSTEM SCANNER:</span>
        <span className="status-val online">SECURE</span>
      </div>

      <nav className="nav-menu">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.id);
                setIsOpen(false);
              }}
            >
              {isActive && <div className="nav-active-bar" />}
              <IconComponent className="nav-icon" />
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <p className="footer-title">Local Sandbox Guard</p>
        <p className="footer-desc">Privacy-preserving forensic scanner.</p>
        <div className="footer-links">
          <a href="#" className="footer-link">
            <svg style={{ marginRight: '4px' }} viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> Secure Local Node
          </a>
        </div>
      </div>

      <style>{`
        .cyber-sidebar {
          width: 280px;
          height: 100vh;
          background: #090d16; /* Clean, dark slate backdrop */
          border-right: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          flex-direction: column;
          padding: 28px 20px;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 1000;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @media (max-width: 1024px) {
          .cyber-sidebar {
            transform: translateX(${isOpen ? '0' : '-100%'});
          }
        }

        .brand-container {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 28px;
          padding: 0 4px;
        }

        .brand-logo {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(99, 102, 241, 0.1) 100%);
          border: 1px solid rgba(99, 102, 241, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(99, 102, 241, 0.05);
        }

        .logo-icon {
          color: #3b82f6;
          width: 20px;
          height: 20px;
        }

        .brand-title {
          font-family: var(--font-primary);
          font-size: 1.25rem;
          font-weight: 800;
          letter-spacing: 0.5px;
          color: var(--text-primary);
          line-height: 1.1;
        }

        .brand-gradient-text {
          background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .brand-subtitle {
          font-family: var(--font-mono);
          font-size: 0.6rem;
          color: var(--text-muted);
          letter-spacing: 1.5px;
          margin-top: 2px;
        }

        .system-status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 24px;
          font-family: var(--font-mono);
          font-size: 0.72rem;
        }

        .status-pulse-icon {
          width: 14px;
          height: 14px;
          color: var(--color-ok);
          animation: pulse-ok 1.8s infinite ease-in-out;
        }

        @keyframes pulse-ok {
          0%, 100% { opacity: 0.5; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
        }

        .status-label {
          color: var(--text-secondary);
        }

        .status-val.online {
          color: var(--color-ok);
          font-weight: 700;
        }

        .nav-menu {
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex-grow: 1;
        }

        .nav-item {
          background: transparent;
          border: 1px solid transparent;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          color: var(--text-secondary);
          font-family: var(--font-primary);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
          position: relative;
          text-align: left;
          width: 100%;
        }

        .nav-item:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.02);
        }

        .nav-item.active {
          color: #ffffff;
          background: rgba(59, 130, 246, 0.08);
          font-weight: 600;
          border-color: rgba(59, 130, 246, 0.18);
        }

        .nav-icon {
          width: 18px;
          height: 18px;
          transition: transform 0.2s ease;
        }

        .nav-item:hover .nav-icon {
          transform: scale(1.05);
        }

        .nav-active-bar {
          position: absolute;
          left: 0;
          top: 20%;
          height: 60%;
          width: 3px;
          background: var(--color-cyan);
          border-radius: 0 3px 3px 0;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }

        .sidebar-footer {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 18px;
          font-family: var(--font-primary);
        }

        .footer-title {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 2px;
        }

        .footer-desc {
          font-size: 0.65rem;
          color: var(--text-muted);
          margin-bottom: 12px;
        }

        .footer-links {
          display: flex;
        }

        .footer-link {
          font-family: var(--font-primary);
          font-size: 0.72rem;
          color: var(--text-secondary);
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: color 0.2s;
        }

        .footer-link:hover {
          color: var(--color-cyan);
        }
      `}</style>
    </aside>
  );
};
