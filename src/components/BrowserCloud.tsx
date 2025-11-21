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
    <div style={{ background: '#f4f6f8', minHeight: '100vh' }}>
      <Container fluid style={{ padding: '24px' }}>
        {/* Control Panel */}
        <Card style={{ marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: 'none' }}>
          <Card.Body>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>Control Panel</h3>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none'
                  }}
                  onClick={fetchGridStatus}
                  disabled={loading}
                >
                  🔄 {loading ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button
                  style={{
                    background: autoRefresh
                      ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                      : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    border: 'none'
                  }}
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
        <Row style={{ marginBottom: '30px' }}>
          <Col md={3} className="mb-3">
            <Card className="text-center" style={{
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              border: 'none',
              borderTop: '4px solid #667eea'
            }}>
              <Card.Body>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>Active Sessions</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#667eea' }}>
                  {gridData.statistics.activeSessions}
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="text-center" style={{
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              border: 'none',
              borderTop: '4px solid #43e97b'
            }}>
              <Card.Body>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>Available Slots</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#43e97b' }}>
                  {gridData.statistics.availableSlots}
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="text-center" style={{
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              border: 'none',
              borderTop: '4px solid #4facfe'
            }}>
              <Card.Body>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>Total Nodes</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#4facfe' }}>
                  {gridData.statistics.totalNodes}
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3} className="mb-3">
            <Card className="text-center" style={{
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              border: 'none',
              borderTop: '4px solid #fa709a'
            }}>
              <Card.Body>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>Total Slots</div>
                <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#fa709a' }}>
                  {gridData.statistics.totalSlots}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Active Sessions Section */}
      <Card style={{ marginBottom: '30px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: 'none' }}>
        <Card.Body>
          <h3 style={{ color: '#0f172a', marginBottom: '20px' }}>Active Sessions</h3>
          {gridData && gridData.sessions.length === 0 ? (
            <div style={{ color: '#666', padding: '20px', textAlign: 'center' }}>
              No active sessions
            </div>
          ) : (
            <Row>
              {gridData?.sessions.map((session: ActiveSession) => (
                <Col md={4} key={session.sessionId} style={{ marginBottom: '20px' }}>
                  <Card style={{
                    border: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    height: '100%',
                    transition: 'transform 0.2s',
                    borderLeft: '4px solid #f093fb'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <Card.Body>
                      <div style={{ fontWeight: 'bold', marginBottom: '10px', color: '#0f172a', fontSize: '16px' }}>
                        {session.capabilities.browserName || 'Unknown'}{' '}
                        {session.capabilities.browserVersion || ''}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', wordBreak: 'break-all', marginBottom: '10px' }}>
                        <strong>ID:</strong> {session.sessionId}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
                        <strong>Platform:</strong> {session.capabilities.platformName || 'N/A'}
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <Button
                          size="sm"
                          style={{
                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            border: 'none',
                            flex: 1
                          }}
                          onClick={() => openVNCViewer(session.sessionId, gridData?.vncPassword || 'secret')}
                        >
                          🖥️ View
                        </Button>
                        <Button
                          size="sm"
                          style={{
                            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                            border: 'none',
                            flex: 1
                          }}
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
      <Card style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: 'none' }}>
        <Card.Body>
          <h3 style={{ color: '#0f172a', marginBottom: '20px' }}>Grid Nodes</h3>
          <Row>
            {gridData?.nodes.map((node: GridNode) => {
              const hasAvailableSlots = node.slots.some(s => !s.session);
              return (
                <Col md={4} key={node.id} style={{ marginBottom: '20px' }}>
                  <Card
                    style={{
                      border: 'none',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      borderLeft: `4px solid ${hasAvailableSlots ? '#43e97b' : '#fa709a'}`,
                      height: '100%',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <Card.Body>
                      <div style={{ fontSize: '14px', marginBottom: '10px', color: '#0f172a' }}>
                        <strong>URI:</strong> {node.uri}
                      </div>
                      <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                        <strong>Availability:</strong> <span style={{
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: node.availability === 'UP' ? '#e6f7ed' : '#fee',
                          color: node.availability === 'UP' ? '#16a34a' : '#dc2626'
                        }}>{node.availability}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        <strong>Slots:</strong> {node.slots.length} total
                        ({node.slots.filter(s => !s.session).length} available)
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>
          {gridData && gridData.nodes.length === 0 && (
            <div style={{ color: '#666', padding: '40px', textAlign: 'center', fontSize: '16px' }}>
              No nodes available
            </div>
          )}
        </Card.Body>
      </Card>
      </Container>

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
    </div>
  );
};

export default BrowserCloud;
