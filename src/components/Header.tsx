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
        className="text-white py-2 mb-2"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          borderRadius: '0 0 8px 8px'
        }}
      >
        <Col xs={8}>
          <h1
            className="mb-0"
            style={{
              fontWeight: '700',
              fontSize: '1.25rem',
              letterSpacing: '-0.5px',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            {title}
          </h1>
        </Col>
        <Col xs={4} className="text-end d-flex align-items-center justify-content-end">
          {showLogin && (nickname ? (
            <Dropdown>
              <Dropdown.Toggle
                variant="light"
                style={{
                  fontWeight: '600',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
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
