import React from 'react';

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
}

const ResourcePage: React.FC<ResourcePageProps> = ({ resources, createResource, deleteResource, launchVNC, refreshPage, nickName, resetNickname, handleCreateNew }) => {
  return (
    
    <div className="container mt-5">
        <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
            <h1 className="mb-0">List of Resources for {nickName}
                <button className="btn btn-primary mb-1" onClick={() => resetNickname()}>
                    Switch
                </button>
            </h1>
            </div>
            <div>
            <button className="btn btn-primary me-2" onClick={() => handleCreateNew()}>
                Create New
            </button>
            <button className="btn btn-secondary" onClick={() => refreshPage()}>
                Refresh
            </button>
            </div>
        </div>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Version</th>
            <th>ADB Port</th>
            <th>VNC Port</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {resources.map((resource, index) => (
            <tr key={index}>
              <td>{resource.name}</td>
              <td>{resource.status}</td>
              <td>{resource.version}</td>
              <td>{resource.adb_port || '-'}</td>
              <td>{resource.vnc_port || '-'}</td>
              <td>
                <button
                  className="btn btn-danger me-2"
                  onClick={() => deleteResource(resource.name, nickName)}
                  disabled={resource.available === "false" || resource.available === "error"}
                >
                  Delete
                </button>
                {(resource.status === "Running" || resource.status === "Pending") && (
                  <button
                    className="btn btn-primary"
                    onClick={() => resource.vnc_port && launchVNC(resource.vnc_port)}
                    disabled={typeof resource.vnc_port === 'string' && resource.vnc_port === "-" || resource.available === "false" || resource.available === "error"}
                  >
                    Launch VNC
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResourcePage;