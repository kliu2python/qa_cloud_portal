import React from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Row, Col, Dropdown } from 'react-bootstrap';
import NickNamePage from './nickname';

interface HeaderProps {
  nickname: string;
  resetNickname: () => void;
  handleNicknameSubmit: (nickname: string) => void;
}

const Header: React.FC<HeaderProps> = ({ nickname, resetNickname, handleNicknameSubmit }) => {
  const location = useLocation();

  const getTitle = (path: string): string => {
    switch (path) {
      case '/emulator-cloud':
        return 'Emulator Resources';
      case '/':
        return 'Home';
      default:
        return 'TaaS Cloud';
    }
  };

  const title = getTitle(location.pathname);

  return (
    <Container fluid>
      <Row className="bg-primary text-white py-3 mb-4">
        <Col xs={8}>
          <h1 className="mb-0">{title}</h1>
        </Col>
        <Col xs={4} className="text-end">
          {nickname ? (
            <Dropdown>
              <Dropdown.Toggle variant="success">{nickname}</Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={resetNickname}>Logout</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          ) : (
            <NickNamePage onSubmit={handleNicknameSubmit} />
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Header;
