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
      <Row className="bg-primary text-white py-3 mb-4">
        <Col xs={8}>
          <h1 className="mb-0">{title}</h1>
        </Col>
        <Col xs={4} className="text-end">
          {showLogin && (nickname ? (
            <Dropdown>
              <Dropdown.Toggle variant="success">{nickname}</Dropdown.Toggle>
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
