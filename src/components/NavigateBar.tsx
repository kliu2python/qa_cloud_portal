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
  FaTimes
} from 'react-icons/fa';
import { IconType } from 'react-icons';
import '../styles/NavigateBar.css';

interface NavItem {
  path: string;
  label: string;
  icon: IconType;
}

const NavigateBar: React.FC = () => {
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

      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          {isExpanded ? (
            <>
              <h3 className="brand-title">TaaS</h3>
              <p className="brand-subtitle">Test as a Service</p>
            </>
          ) : (
            <h3 className="brand-title-collapsed">T</h3>
          )}
        </div>
      </div>

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

      {/* Footer */}
      <div className="text-center mt-4">
        <hr className="border-light" />
        <p className="mb-1">Version: 6.0.0</p>
        <p className="mb-0">Editor: Jiahao Liu (ljiahao@fortinet.com)</p>
      </div>
    </div>
  );
};

export default NavigateBar;
