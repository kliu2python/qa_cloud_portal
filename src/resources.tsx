import React, { useEffect, useState } from 'react';
import { Button, Container, Row, Table, Col, Dropdown } from 'react-bootstrap';
import NickNamePage from './nickname';

interface Resource {
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
  checkResourceStatus: (name: string) => Promise<string | null>;
  updateResourceStatus: (name: string, status: string) => void

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
  checkResourceStatus,
  updateResourceStatus,
  handleNicknameSubmit
}) => {
  const [resourceStatuses, setResourceStatuses] = useState<{ [name: string]: boolean }>({});

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

    const intervalId = setInterval(() => {
      resources.forEach(async (resource) => {
        const status = await checkResourceStatus(resource.name);
        if (status) {
          updateResourceStatus(resource.name, status);
        }
      });
    }, 5000);

    const timeoutId = setTimeout(enableLaunchButtons, 5000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [resources, checkResourceStatus, updateResourceStatus]);

  const launchNFS = () => {
    window.open(`http://10.160.13.30:8888/lab/tree/apks`, '_blank');
  };


  return (
    <div>
      <Row>
        <Col xs={7}>
          <h1>Emulator Resources</h1>
        </Col>
      </Row>
      <Row>
        <Col>
          {nickName ? (
            <Button 
            onClick={handleCreateNew}
            >
              Create New Resource
            </Button>
          ) : (
            <Button 
            disabled
            >
            Create New Resource
          </Button>
          )}
          <Button onClick={refreshPage}>Refresh</Button>
        </Col>
        <Col>
          <Button onClick={launchNFS}>NFS Location</Button>
        </Col>
        <Col md="auto" className="ms-auto">
          {nickName ? (
            <Dropdown>
              <Dropdown.Toggle variant="success" id="dropdown-basic">
                {nickName}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={resetNickname}>Logout</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          ) : (
            <NickNamePage onSubmit={handleNicknameSubmit} />
          )}  
        </Col>
      </Row>
        {nickName ? (
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Version</th>
                <th>VNC Port</th>
                <th>ADB Port</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.length > 0 ? (
                resources.map((resource) => (
                  <tr key={resource.name}>
                    <td>{resource.name}</td>
                    <td>{resource.status}</td>
                    <td>{resource.version}</td>
                    <td>{resource.vnc_port}</td>
                    <td>{resource.adb_port}</td>
                    <td>
                      <Button
                        variant="danger"
                        onClick={() => deleteResource(resource.name, nickName)}
                      >
                        Delete
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => launchVNC(resource.vnc_port)}
                        disabled={!resourceStatuses[resource.name]}
                      >
                        Launch
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center' }}>
                    No resources available.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        ) : (
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            Login your nickname first
          </div>
        )}
    </div>
  );
};

export default ResourcePage;
