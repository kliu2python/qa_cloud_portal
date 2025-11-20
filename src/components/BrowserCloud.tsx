import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';
import VNCModal from './VNCModal';
import config from '../config/config';
import { GridData, GridStatusResponse, ActiveSession, GridNode } from '../types/gridTypes';

interface BrowserCloudProps {
  nickName: string;
}

const BrowserCloud: React.FC<BrowserCloudProps> = ({ nickName }) => {
  const [gridData, setGridData] = useState<GridData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [showVNC, setShowVNC] = useState<boolean>(false);
  const [selectedSession, setSelectedSession] = useState<{ id: string; password: string } | null>(null);

  // Fetch grid status
  const fetchGridStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${config.seleniumGridBackendUrl}/api/status`);
      if (!response.ok) {
        throw new Error('Failed to fetch grid status');
      }
      const data: GridStatusResponse = await response.json();
      if (data.success && data.data) {
        setGridData(data.data);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err: any) {
      console.error('Error fetching grid status:', err);
      setError(err.message || 'Failed to connect to Selenium Grid');
    } finally {
      setLoading(false);
    }
  };

  // Delete/Kill a session
  const deleteSession = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to kill this session?')) return;

    try {
      const response = await fetch(`${config.seleniumGridBackendUrl}/api/session/${sessionId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchGridStatus();
      } else {
        alert('Failed to delete session');
      }
    } catch (err) {
      console.error('Error deleting session:', err);
      alert('Error deleting session');
    }
  };

  // Open VNC viewer
  const openVNCViewer = (sessionId: string, password: string) => {
    setSelectedSession({ id: sessionId, password });
    setShowVNC(true);
  };

  // Close VNC viewer
  const closeVNCViewer = () => {
    setShowVNC(false);
    setSelectedSession(null);
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchGridStatus();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchGridStatus();
      }, 5000); // Refresh every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  return (
    <Container fluid style={{ padding: '24px', background: '#f4f6f8', minHeight: '100vh' }}>
      {/* Header Section */}
      <Card style={{ marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <Card.Body>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ margin: 0 }}>Selenium Grid Manager</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button variant="success" onClick={fetchGridStatus} disabled={loading}>
                🔄 {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button
                variant={autoRefresh ? 'warning' : 'primary'}
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? '⏸ Stop Auto' : '▶ Start Auto'}
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          <strong>Error:</strong> {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      {gridData && (
        <Row style={{ marginBottom: '20px' }}>
          <Col md={3}>
            <Card className="text-center" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <Card.Body>
                <div style={{ fontSize: '14px', color: '#666' }}>Active Sessions</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0f172a' }}>
                  {gridData.statistics.activeSessions}
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <Card.Body>
                <div style={{ fontSize: '14px', color: '#666' }}>Available Slots</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0f172a' }}>
                  {gridData.statistics.availableSlots}
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <Card.Body>
                <div style={{ fontSize: '14px', color: '#666' }}>Total Nodes</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0f172a' }}>
                  {gridData.statistics.totalNodes}
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <Card.Body>
                <div style={{ fontSize: '14px', color: '#666' }}>Total Slots</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0f172a' }}>
                  {gridData.statistics.totalSlots}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Active Sessions Section */}
      <Card style={{ marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <Card.Body>
          <h3>Active Sessions</h3>
          {gridData && gridData.sessions.length === 0 ? (
            <div style={{ color: '#666', padding: '20px', textAlign: 'center' }}>
              No active sessions
            </div>
          ) : (
            <Row>
              {gridData?.sessions.map((session: ActiveSession) => (
                <Col md={4} key={session.sessionId} style={{ marginBottom: '15px' }}>
                  <Card style={{ border: '1px solid #e2e8f0', height: '100%' }}>
                    <Card.Body>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        {session.capabilities.browserName || 'Unknown'}{' '}
                        {session.capabilities.browserVersion || ''}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', wordBreak: 'break-all', marginBottom: '10px' }}>
                        ID: {session.sessionId}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
                        Platform: {session.capabilities.platformName || 'N/A'}
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openVNCViewer(session.sessionId, gridData?.vncPassword || 'secret')}
                        >
                          🖥️ View
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => deleteSession(session.sessionId)}
                        >
                          ✖ Kill
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* Nodes Section */}
      <Card style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        <Card.Body>
          <h3>Nodes</h3>
          <Row>
            {gridData?.nodes.map((node: GridNode) => {
              const hasAvailableSlots = node.slots.some(s => !s.session);
              return (
                <Col md={4} key={node.id} style={{ marginBottom: '15px' }}>
                  <Card
                    style={{
                      borderLeft: `4px solid ${hasAvailableSlots ? '#16a34a' : '#f59e0b'}`,
                      height: '100%'
                    }}
                  >
                    <Card.Body>
                      <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                        <strong>URI:</strong> {node.uri}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                        Availability: {node.availability}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        Slots: {node.slots.length} ({node.slots.filter(s => !s.session).length} available)
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
          {gridData && gridData.nodes.length === 0 && (
            <div style={{ color: '#666', padding: '20px', textAlign: 'center' }}>
              No nodes available
            </div>
          )}
        </Card.Body>
      </Card>

      {/* VNC Modal */}
      {selectedSession && (
        <VNCModal
          show={showVNC}
          onClose={closeVNCViewer}
          sessionId={selectedSession.id}
          password={selectedSession.password}
          gridUrl={config.seleniumGridUrl}
        />
      )}
    </Container>
  );
};

export default BrowserCloud;
