import React, { useEffect, useRef, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';

// Declare RFB globally for TypeScript (loaded from CDN)
declare global {
  interface Window {
    RFB: any;
  }
}

interface VNCModalProps {
  show: boolean;
  onClose: () => void;
  sessionId: string;
  password: string;
  gridUrl: string;
}

const VNCModal: React.FC<VNCModalProps> = ({ show, onClose, sessionId, password, gridUrl }) => {
  const vncContainerRef = useRef<HTMLDivElement>(null);
  const rfbRef = useRef<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');

  useEffect(() => {
    if (show && vncContainerRef.current && sessionId) {
      // Small delay to ensure RFB from CDN is loaded
      const connectTimeout = setTimeout(() => {
        connectVNC();
      }, 100);
      return () => clearTimeout(connectTimeout);
    }

    return () => {
      disconnectVNC();
    };
  }, [show, sessionId]);

  const connectVNC = () => {
    if (!vncContainerRef.current) return;

    // Wait for RFB to be available from CDN
    const checkRFB = () => {
      if (!window.RFB) {
        console.log('RFB not loaded yet, retrying...');
        setTimeout(checkRFB, 100);
        return;
      }

      try {
        // Clear previous canvas
        vncContainerRef.current!.innerHTML = '';

        // Build WebSocket URL pointing to the backend proxy
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const url = new URL(gridUrl);
        const wsUrl = `${protocol}://${url.host}/session/${sessionId}/se/vnc`;

        setConnectionStatus('Connecting...');

        // Create RFB connection
        rfbRef.current = new window.RFB(vncContainerRef.current, wsUrl, {
          credentials: { password: password || 'secret' }
        });

        // Event listeners
        rfbRef.current.addEventListener('connect', () => {
          setConnectionStatus('Connected');
        });

        rfbRef.current.addEventListener('disconnect', () => {
          setConnectionStatus('Disconnected');
        });

        rfbRef.current.addEventListener('credentialsrequired', () => {
          setConnectionStatus('Password Required');
        });

        // Scale to fit
        rfbRef.current.scaleViewport = true;
        rfbRef.current.resizeSession = true;

      } catch (err) {
        console.error('VNC Connection Error:', err);
        setConnectionStatus(`Error: ${err}`);
      }
    };

    checkRFB();
  };

  const disconnectVNC = () => {
    if (rfbRef.current) {
      try {
        rfbRef.current.disconnect();
      } catch (err) {
        console.error('Error disconnecting VNC:', err);
      }
      rfbRef.current = null;
    }
  };

  const handleClose = () => {
    disconnectVNC();
    onClose();
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="xl"
      fullscreen={true}
      style={{ zIndex: 1050 }}
    >
      <Modal.Header closeButton style={{ background: '#f8f9fa' }}>
        <Modal.Title>Remote Desktop (VNC) - Session: {sessionId}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: 0, background: '#000', display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            padding: '10px',
            background: '#f1f5f9',
            color: '#333',
            fontFamily: 'monospace',
            display: 'flex',
            gap: '15px'
          }}
        >
          <span style={{ color: connectionStatus === 'Connected' ? 'green' : connectionStatus.includes('Error') ? 'red' : '#666' }}>
            Status: {connectionStatus}
          </span>
          <span>Session: {sessionId}</span>
        </div>
        <div
          ref={vncContainerRef}
          style={{
            flex: 1,
            background: '#000',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            minHeight: '600px'
          }}
        />
      </Modal.Body>
      <Modal.Footer style={{ background: '#f8f9fa' }}>
        <Button variant="danger" onClick={handleClose}>
          Close Connection
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default VNCModal;
