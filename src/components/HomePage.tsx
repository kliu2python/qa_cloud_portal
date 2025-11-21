import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaMobileAlt,
  FaJenkins,
  FaSearch,
  FaRocket,
  FaTools,
  FaServer
} from 'react-icons/fa';
import { IconType } from 'react-icons';
import '../styles/HomePage.css';

interface HomePageProps {
  nickName?: string;
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
  const isLoggedIn = !!nickName;

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
    </div>
  );
};

export default HomePage;
