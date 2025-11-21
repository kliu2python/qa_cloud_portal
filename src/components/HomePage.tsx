import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaMobileAlt,
  FaChrome,
  FaJenkins,
  FaSearch,
  FaChartBar,
  FaBug,
  FaRocket,
  FaCog,
  FaTools,
  FaServer
} from 'react-icons/fa';
import { IconType } from 'react-icons';
import '../styles/HomePage.css';

interface HomePageProps {
  nickName?: string;
}

interface FeatureCard {
  title: string;
  description: string;
  icon: IconType;
  path: string;
  color: string;
  features: string[];
  available: boolean;
}

interface QuickAction {
  title: string;
  description: string;
  icon: IconType;
  path: string;
  color: string;
}

const HomePage: React.FC<HomePageProps> = ({ nickName }) => {
  const navigate = useNavigate();
  const un = nickName || 'Guest';
  const isLoggedIn = !!nickName;

  const featureCards: FeatureCard[] = [
    {
      title: 'Emulator Cloud',
      description: 'Manage Android and iOS emulators with remote VNC access and ADB integration.',
      icon: FaMobileAlt,
      path: '/emulator-cloud',
      color: '#667eea',
      features: ['Remote VNC Access', 'ADB Integration', 'Resource Management', 'Android & iOS Support'],
      available: true
    },
    {
      title: 'Browser Cloud',
      description: 'Access cloud-based browser testing infrastructure for web application testing.',
      icon: FaChrome,
      path: '/browser-cloud',
      color: '#f093fb',
      features: ['Multiple Browsers', 'Cloud Testing', 'Automated Testing', 'Cross-Platform'],
      available: false
    },
    {
      title: 'Jenkins Cloud',
      description: 'Execute automated test jobs for mobile apps with customizable parameters and build tracking.',
      icon: FaJenkins,
      path: '/jenkins-cloud',
      color: '#4facfe',
      features: ['FTM Testing', 'Build History', 'Custom Parameters', 'Test Results'],
      available: true
    },
    {
      title: 'FortiReviewFinder',
      description: 'Aggregate and analyze app reviews from Google Play, App Store, and Reddit with subscriptions.',
      icon: FaSearch,
      path: '/reviewfinder',
      color: '#43e97b',
      features: ['Multi-Platform Reviews', 'Rating Filters', 'Excel Export', 'Email Subscriptions'],
      available: true
    },
    {
      title: 'Resource Dashboard',
      description: 'Access comprehensive testing resources including device farms, servers, and analysis tools.',
      icon: FaChartBar,
      path: '/resource',
      color: '#fa709a',
      features: ['Jupyter Server', 'Device Farms', 'Jenkins CI/CD', 'AI Code Assistant'],
      available: true
    },
    {
      title: 'Report an Issue',
      description: 'Submit bug reports and issues to help improve the TaaS platform.',
      icon: FaBug,
      path: '/report-error',
      color: '#ff6b6b',
      features: ['Quick Reporting', 'Email Notifications', 'Category Selection', 'Issue Tracking'],
      available: true
    }
  ];

  const quickActions: QuickAction[] = [
    {
      title: 'Launch Emulator',
      description: 'Create a new emulator instance',
      icon: FaMobileAlt,
      path: '/emulator-cloud',
      color: '#667eea'
    },
    {
      title: 'Run Jenkins Job',
      description: 'Execute automated tests',
      icon: FaJenkins,
      path: '/jenkins-cloud',
      color: '#4facfe'
    },
    {
      title: 'Search Reviews',
      description: 'Find app reviews and feedback',
      icon: FaSearch,
      path: '/reviewfinder',
      color: '#43e97b'
    },
    {
      title: 'Access Resources',
      description: 'View all testing resources',
      icon: FaServer,
      path: '/resource',
      color: '#fa709a'
    }
  ];

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="home-page">
      {/* Service Info Banner */}
      <Container className="service-info-section">
        <div className="service-info-banner">
          <div className="service-info-icon">
            {React.createElement(FaRocket as React.FC)}
          </div>
          <div className="service-info-content">
            <h1 className="service-info-title">TaaS - Test as a Service</h1>
            <p className="service-info-description">
              Comprehensive testing platform with cloud emulators, automated CI/CD, and powerful analytics tools.
            </p>
          </div>
        </div>
      </Container>

      {/* Quick Actions Section */}
      {isLoggedIn && (
        <Container className="quick-actions-section">
          <h2 className="section-title">
            {React.createElement(FaTools as React.FC)} Quick Actions
          </h2>
          <Row>
            {quickActions.map((action, index) => (
              <Col key={index} xs={12} sm={6} md={3} className="mb-4">
                <Card
                  className="quick-action-card"
                  onClick={() => handleNavigate(action.path)}
                  style={{ borderColor: action.color }}
                >
                  <Card.Body className="text-center">
                    <div
                      className="quick-action-icon"
                      style={{ color: action.color }}
                    >
                      {React.createElement(action.icon as React.FC)}
                    </div>
                    <h5>{action.title}</h5>
                    <p className="quick-action-description">{action.description}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      )}

      {/* Features Section */}
      <Container className="features-section">
        <h2 className="section-title">
          {React.createElement(FaServer as React.FC)} Available Services
        </h2>
        <Row>
          {featureCards.map((feature, index) => (
            <Col key={index} xs={12} md={6} lg={4} className="mb-4">
              <Card
                className={`feature-card ${!feature.available ? 'feature-card-disabled' : ''}`}
                onClick={() => feature.available && handleNavigate(feature.path)}
              >
                <Card.Body>
                  <div
                    className="feature-icon"
                    style={{ background: `linear-gradient(135deg, ${feature.color}, ${feature.color}dd)` }}
                  >
                    {React.createElement(feature.icon as React.FC)}
                  </div>
                  <Card.Title className="feature-title">
                    {feature.title}
                    {!feature.available && <span className="badge-coming-soon">Coming Soon</span>}
                  </Card.Title>
                  <Card.Text className="feature-description">
                    {feature.description}
                  </Card.Text>
                  <ul className="feature-list">
                    {feature.features.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                  {feature.available && (
                    <Button
                      className="feature-button"
                      style={{
                        background: `linear-gradient(135deg, ${feature.color}, ${feature.color}dd)`,
                        border: 'none'
                      }}
                    >
                      Explore {feature.title}
                    </Button>
                  )}
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </div>
  );
};

export default HomePage;
