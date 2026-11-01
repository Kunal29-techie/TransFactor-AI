import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  FlaskConical, LayoutDashboard, FileEdit, History, Plus, 
  BookOpen, HelpCircle, Bell, Settings 
} from 'lucide-react';

function MainLayout() {
  const location = useLocation();

  return (
    <div className="app-container">
      {/* LEFT SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Transcription Core</h2>
          <p>v2.4.1-stable</p>
        </div>
        
        <div className="nav-links">
          <NavLink to="/workspace" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <FlaskConical size={18} /> Workspace
          </NavLink>
          <NavLink to="/analysis" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={18} /> TF Classification
          </NavLink>
          <NavLink to="/editor" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <FileEdit size={18} /> Sequence Editor
          </NavLink>
          <NavLink to="/history" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <History size={18} /> Project History
          </NavLink>
        </div>

        <div className="sidebar-footer">
          <button className="btn-new-analysis">
            <Plus size={18} /> NEW ANALYSIS
          </button>
          <div className="footer-link">
            <BookOpen size={18} /> Documentation
          </div>
          <div className="footer-link">
            <HelpCircle size={18} /> Support
          </div>
        </div>
      </aside>

      {/* MAIN WRAPPER */}
      <div className="main-wrapper">
        
        {/* TOP NAV */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="topbar-logo">TransFactor AI</div>
            <div className="topbar-nav">
              <NavLink to="/" className={({isActive}) => `top-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
              <NavLink to="/analysis" className={({isActive}) => `top-link ${location.pathname.includes('/analysis') ? 'active' : ''}`}>Analysis</NavLink>
              <NavLink to="/history" className={({isActive}) => `top-link ${isActive ? 'active' : ''}`}>History</NavLink>
            </div>
          </div>
          <div className="topbar-right">
            <Bell size={20} />
            <Settings size={20} />
            <div className="avatar">KD</div>
          </div>
        </header>

        {/* DYNAMIC PAGE CONTENT */}
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;
