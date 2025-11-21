import React, { useEffect, useState } from 'react';
import { Button, Container, Row, Table, Col, OverlayTrigger, Tooltip, Card } from 'react-bootstrap';
import { FaQuestionCircle } from 'react-icons/fa';
import SplitView from './SplitView';

export interface Resource {
  adb_port: number;
  available: string;
  name: string;
  status: string;
  version: string;
  vnc_port: number;
}

interface ResourcePageProps {
  resources: Resource[];
  handleNicknameSubmit: (nickname: string) => void;
  createResource: (os: string, version: string) => void;
  deleteResource: (name: string, nickName: string) => void;
  launchVNC: (port: number) => void;
  refreshPage: () => void;
  nickName: string;
  resetNickname: () => void;
  handleCreateNew: () => void;
  updateResourceStatus: (name: string, status: string) => void;
}

const ResourcePage: React.FC<ResourcePageProps> = ({
  resources,
  createResource,
  deleteResource,
  launchVNC,
  refreshPage,
  nickName,
  resetNickname,
  handleCreateNew,
  updateResourceStatus,
  handleNicknameSubmit,
}) => {
  const [resourceStatuses, setResourceStatuses] = useState<{ [name: string]: boolean }>({});
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null); // Track selected resource for VNC

  useEffect(() => {
    const savedStatuses = localStorage.getItem('resourceStatuses');
    if (savedStatuses) {
      setResourceStatuses(JSON.parse(savedStatuses));
    }

    const enableLaunchButtons = () => {
      setResourceStatuses((prevStatuses) => {
        const updatedStatuses = resources.reduce((acc: { [name: string]: boolean }, resource) => {
          acc[resource.name] = true;
          return acc;
        }, {});
        localStorage.setItem('resourceStatuses', JSON.stringify(updatedStatuses));
        return updatedStatuses;
      });
    };

    const timeoutId = setTimeout(enableLaunchButtons, 5000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [resources, updateResourceStatus]);

  const handleLaunchVNC = (resource: Resource) => {
    setSelectedResource(resource); // Set the selected resource to show in SplitView
  };

  const handleGoBack = () => {
    setSelectedResource(null); // Reset when going back
  };

  const launchNFS = () => {
    window.open('https://10.160.13.30:8888/lab/tree/apks', '_blank');
  };

  return (
    <div style={{ background: '#f4f6f8', minHeight: '100vh' }}>
      <Container fluid style={{ padding: '24px' }}>
        {/* Only show buttons if no resource is selected */}
        {!selectedResource && (
          <Card style={{ marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: 'none' }}>
            <Card.Body>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ margin: 0, color: '#0f172a' }}>Control Panel</h3>
                  <OverlayTrigger
                    placement="right"
                    overlay={
                      <Tooltip id="emulator-cloud-help">
                        <div style={{ textAlign: 'left' }}>
                          <strong>Emulator Cloud Service</strong>
                          <hr style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.3)' }} />
                          <p style={{ margin: '4px 0' }}><strong>What it does:</strong></p>
                          <p style={{ margin: '4px 0', fontSize: '13px' }}>
                            Provides on-demand Android/iOS emulator instances with VNC viewing and ADB debugging capabilities
                          </p>
                          <p style={{ margin: '8px 0 4px 0' }}><strong>How to use:</strong></p>
                          <ul style={{ margin: '4px 0', paddingLeft: '20px', fontSize: '13px' }}>
                            <li>Click "Create New Resource" to provision a new emulator instance</li>
                            <li>Use "Refresh" to update the resource status and availability</li>
                            <li>Access "NFS Location" to upload/manage APK files</li>
                            <li>Click "Launch" to open VNC viewer for visual interaction</li>
                            <li>Use ADB port for programmatic device debugging</li>
                            <li>Delete resources when testing is complete</li>
                          </ul>
                          <p style={{ margin: '8px 0 4px 0' }}><strong>What you get:</strong></p>
                          <ul style={{ margin: '4px 0', paddingLeft: '20px', fontSize: '13px' }}>
                            <li>Isolated Android/iOS emulator environments</li>
                            <li>VNC remote desktop access for visual debugging</li>
                            <li>ADB connectivity for automation and testing</li>
                            <li>NFS file sharing for APK deployment</li>
                            <li>Resource management and lifecycle control</li>
                          </ul>
                        </div>
                      </Tooltip>
                    }
                  >
                    <span style={{ cursor: 'help', color: '#4facfe', display: 'flex', alignItems: 'center' }}>
                      {FaQuestionCircle({ size: 18 })}
                    </span>
                  </OverlayTrigger>
                </div>
                <div className="d-flex gap-2">
                  <Button
                    onClick={handleCreateNew}
                    disabled={!nickName}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none'
                    }}
                  >
                    Create New Resource
                  </Button>
                  <Button
                    onClick={refreshPage}
                    style={{
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      border: 'none'
                    }}
                  >
                    Refresh
                  </Button>
                  <Button
                    onClick={launchNFS}
                    style={{
                      background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                      border: 'none'
                    }}
                  >
                    NFS Location
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        )}

      {/* Show SplitView if a resource has been selected for VNC */}
      {selectedResource ? (
        <SplitView
          resource={selectedResource}
          launchVNC={launchVNC}
          onGoBack={handleGoBack} // Pass "Go Back" functionality to SplitView
        />
      ) : (
        <>
          {nickName ? (
            <div style={{
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              <Table striped bordered hover responsive style={{ marginBottom: 0 }}>
                <thead style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white'
                }}>
                  <tr>
                    <th style={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}>Name</th>
                    <th style={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}>Status</th>
                    <th style={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}>Version</th>
                    <th className="text-center" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}>VNC Port</th>
                    <th className="text-center" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}>ADB Port</th>
                    <th style={{ color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.length > 0 ? (
                    resources.map((resource) => (
                      <tr
                        key={resource.name}
                        style={{ background: resource.status === 'active' ? '#e6f7ed' : 'white' }}
                      >
                        <td style={{ fontWeight: '500', color: '#0f172a' }}>{resource.name}</td>
                        <td>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            background: resource.status === 'active' ? '#43e97b' : '#94a3b8',
                            color: 'white'
                          }}>
                            {resource.status}
                          </span>
                        </td>
                        <td>{resource.version}</td>
                        <td className="text-center">{resource.vnc_port}</td>
                        <td className="text-center">{resource.adb_port}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <OverlayTrigger
                              overlay={
                                <Tooltip>
                                  {resourceStatuses[resource.name]
                                    ? 'Launch the VNC viewer.'
                                    : 'Wait for the resource to become available.'}
                                </Tooltip>
                              }
                            >
                              <Button
                                size="sm"
                                onClick={() => handleLaunchVNC(resource)}
                                disabled={!resourceStatuses[resource.name]}
                                style={{
                                  background: resourceStatuses[resource.name]
                                    ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                                    : '#94a3b8',
                                  border: 'none'
                                }}
                              >
                                Launch
                              </Button>
                            </OverlayTrigger>
                            <Button
                              size="sm"
                              onClick={() => deleteResource(resource.name, nickName)}
                              style={{
                                background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                                border: 'none'
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center text-muted" style={{ padding: '40px' }}>
                        No resources available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center mt-4" style={{
              background: 'white',
              padding: '60px 40px',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
            }}>
              <h5 style={{ color: '#fa709a', fontSize: '1.5rem' }}>
                Login with your nickname first to access resources
              </h5>
            </div>
          )}
        </>
      )}
      </Container>
    </div>
  );
};

export default ResourcePage;
