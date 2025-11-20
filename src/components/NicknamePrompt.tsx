import React, { useState } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';

interface NicknamePromptProps {
  isOpen: boolean;
  onSubmit: (nickname: string) => void;
}

const NicknamePrompt: React.FC<NicknamePromptProps> = ({ isOpen, onSubmit }) => {
  const [nicknameInput, setNicknameInput] = useState('');

  const handleNicknameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNicknameInput(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (nicknameInput.trim()) {
      onSubmit(nicknameInput);
      setNicknameInput('');
    }
  };

  return (
    <Modal show={isOpen} backdrop="static" keyboard={false} centered>
      <Modal.Header>
        <Modal.Title>Enter Your Nickname</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="nicknameInput" className="mb-3">
            <Form.Label>Nickname</Form.Label>
            <Form.Control
              type="text"
              value={nicknameInput}
              onChange={handleNicknameChange}
              placeholder="Enter your nickname"
              autoFocus
              required
            />
          </Form.Group>
          <div className="d-grid">
            <Button
              type="submit"
              variant="primary"
            >
              Continue
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default NicknamePrompt;
