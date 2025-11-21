import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaMobileAlt,
  FaChrome,
  FaJenkins,
  FaSearch,
  FaChartBar,
  FaBug,
  FaBars,
  FaTimes,
  FaUser,
  FaSignOutAlt
} from 'react-icons/fa';
import { IconType } from 'react-icons';
import '../styles/NavigateBar.css';

interface NavItem {
  path: string;
  label: string;
  icon: IconType;
}

interface NavigateBarProps {
  nickname?: string;
  onLogout?: () => void;
}

const NavigateBar: React.FC<NavigateBarProps> = ({ nickname, onLogout }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const location = useLocation();

  const navItems: NavItem[] = [
    { path: '/', label: 'Home', icon: FaHome },
    { path: '/emulator-cloud', label: 'Emulator Cloud', icon: FaMobileAlt },
    { path: '/browser-cloud', label: 'Browser Cloud', icon: FaChrome },
    { path: '/jenkins-cloud', label: 'Jenkins Cloud', icon: FaJenkins },
    { path: '/reviewfinder', label: 'FortiReviewFinder', icon: FaSearch },
    { path: '/resource', label: 'Resource Dashboard', icon: FaChartBar },
    { path: '/report-error', label: 'Report an Issue', icon: FaBug },
  ];

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className={`modern-sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Toggle Button */}
      <button
        className="sidebar-toggle"
        onClick={toggleSidebar}
        aria-label="Toggle Sidebar"
      >
        {isExpanded ? React.createElement(FaTimes as React.FC) : React.createElement(FaBars as React.FC)}
      </button>

      {/* Navigation Items */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const IconComponent = item.icon as React.FC;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              title={!isExpanded ? item.label : ''}
            >
              <span className="nav-icon">{React.createElement(IconComponent)}</span>
              {isExpanded && <span className="nav-label">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      {nickname && (
        <div className="sidebar-user">
          <div className={`user-info ${!isExpanded ? 'collapsed' : ''}`}>
            <div className="user-avatar">
              {React.createElement(FaUser as React.FC)}
            </div>
            {isExpanded && (
              <div className="user-details">
                <p className="user-nickname">{nickname}</p>
              </div>
            )}
          </div>
          {onLogout && (
            <button
              className="logout-button"
              onClick={onLogout}
              title={!isExpanded ? 'Logout' : ''}
              aria-label="Logout"
            >
              <span className="logout-icon">{React.createElement(FaSignOutAlt as React.FC)}</span>
              {isExpanded && <span className="logout-label">Logout</span>}
            </button>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="sidebar-footer">
        <hr className="footer-divider" />
        {isExpanded ? (
          <p className="footer-version">v6.0.0</p>
        ) : (
          <p className="footer-version" style={{ fontSize: '0.7rem' }}>v6</p>
        )}
      </div>
    </div>
  );
};

export default NavigateBar;
