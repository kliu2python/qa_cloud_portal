import React, { useEffect, useState } from 'react';
import { Button, Container, Row, Table, Col} from 'react-bootstrap';

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
  createResource: (os: string, version: string) => void;
  deleteResource: (name: string, nickName: string) => void;
  launchVNC: (port: number) => void;
  refreshPage: () => void;
  nickName: string;
  resetNickname: () => void;
  handleCreateNew: () => void;
  checkResourceStatus: (name: string) => Promise<string | null>;
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
  checkResourceStatus,
  updateResourceStatus
}) => {
  const [resourceStatuses, setResourceStatuses] = useState<{ [name: string]: boolean }>({});

  useEffect(() => {
    const savedStatuses = localStorage.getItem('resourceStatuses');
    if (savedStatuses) {
      setResourceStatuses(JSON.parse(savedStatuses));
    }

    const intervalId = setInterval(() => {
      resources.forEach(async (resource) => {
        const status = await checkResourceStatus(resource.name);
        if (status === 'Running') {
          setResourceStatuses((prevStatuses) => {
            const updatedStatuses = {
              ...prevStatuses,
              [resource.name]: true,
            };
            localStorage.setItem('resourceStatuses', JSON.stringify(updatedStatuses));
            return updatedStatuses;
          });
          
          updateResourceStatus(resource.name, 'Running');
        }
      });
    }, 5000);

    return () => clearInterval(intervalId);
  }, [resources, checkResourceStatus, updateResourceStatus]);

  return (
    <div>
        <Row>
          <Col 
          xs={7}
          >
            <h1>Emulator Resources</h1>
          </Col>
          <Col
          md="auto"
          className="ms-auto">
            <h1>NickName:  {nickName}</h1>
          </Col>
        </Row>
      <Button onClick={handleCreateNew}>Create New Resource</Button>
      <Button onClick={resetNickname}>Reset Nickname</Button>
      <Button onClick={refreshPage}>Refresh</Button>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Version</th>
            <th>VNC Port</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {resources.map((resource) => (
            <tr key={resource.name}>
              <td>{resource.name}</td>
              <td>{resource.status}</td>
              <td>{resource.version}</td>
              <td>{resource.vnc_port}</td>
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
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default ResourcePage;
