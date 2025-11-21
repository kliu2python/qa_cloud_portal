import React from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Row, Col, Dropdown } from 'react-bootstrap';
import NickNamePage from './nickname';

import { unslugify } from '../utils/slugify';

interface HeaderProps {
  nickname: string;
  resetNickname: () => void;
  handleNicknameSubmit: (nickname: string) => void;
}

const Header: React.FC<HeaderProps> = ({ nickname, resetNickname, handleNicknameSubmit }) => {
  const location = useLocation();

  const getTitle = (path: string): string => {
    if (path.startsWith('/jenkins-cloud/')) {
      // Extract server slug after "/jenkins-cloud/"
      const serverSlug = path.replace('/jenkins-cloud/', '');
      if (serverSlug) {
        return unslugify(serverSlug);
      }
      return 'Jenkins Cloud';
    }
    
    switch (path) {
        case '/emulator-cloud':
            return 'Emulator Resources';
        case '/browser-cloud':
            return 'Browser Resources';
        case '/reviewfinder':
            return 'FTNT Review Finder';
        case '/jenkins-cloud':
          return 'Jenkins Cloud';
        case '/resource':
            return 'Resource Dashboard';
        case '/report-error':
            return 'Report an Error';
        case '/':
            return 'Home';
        default:
            return 'TaaS Cloud';
    }
  };

  const title = getTitle(location.pathname);

  // Check if the path is one of the specific ones where nickname and login should be shown
  const showLogin = ['/emulator-cloud', '/browser-cloud', '/report-error'].includes(location.pathname);

  return (
    <Container fluid>
      <Row
        className="text-white py-1 mb-1"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.1)',
          borderRadius: '0 0 4px 4px'
        }}
      >
        <Col xs={8} className="d-flex align-items-center">
          <span
            className="mb-0"
            style={{
              fontWeight: '600',
              fontSize: '0.9rem',
              letterSpacing: '-0.3px'
            }}
          >
            {title} <span style={{ fontWeight: '400', fontSize: '0.75rem', opacity: 0.85 }}>· TaaS Cloud Portal</span>
          </span>
        </Col>
        <Col xs={4} className="text-end d-flex align-items-center justify-content-end">
          {showLogin && (nickname ? (
            <Dropdown>
              <Dropdown.Toggle
                variant="light"
                size="sm"
                style={{
                  fontWeight: '600',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '0.8rem',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.15)'
                }}
              >
                {nickname}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={resetNickname}>Logout</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          ) : (
            <NickNamePage onSubmit={handleNicknameSubmit} />
          ))}
        </Col>
      </Row>
    </Container>
  );
};

export default Header;
