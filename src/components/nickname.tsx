import React, { useState } from 'react';
import { Form, Button, Container, Row, Col} from 'react-bootstrap';

interface NickNamePageProps {
  onSubmit: (nickname: string) => void;
}

const NickNamePage: React.FC<NickNamePageProps> = ({ onSubmit }) => {
  const [nicknameInput, setNicknameInput] = useState('');

  const handleNicknameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNicknameInput(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(nicknameInput);
  };

  return (
    <Container>
    <Form onSubmit={handleSubmit}>
      <Row className="align-items-center">
        <Col xs={8}>
          <Form.Group controlId="nicknameInput">
            <Form.Control
              type="text"
              value={nicknameInput}
              onChange={handleNicknameChange}
              placeholder="Enter your nickname"
              style={{
                borderRadius: '10px',
                padding: '10px',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
              }}
            />
          </Form.Group>
        </Col>
        <Col xs={4}>
          <Button
            type="submit"
            variant="primary"
            style={{
              borderRadius: '10px',
              padding: '10px 20px',
              width: '100%',
            }}
          >
            Login
          </Button>
        </Col>
      </Row>
    </Form>
  </Container>
  );
};

export default NickNamePage;
