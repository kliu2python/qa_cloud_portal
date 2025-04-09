// JenkinsDashboard.tsx
import React, { useState, useEffect, Fragment } from 'react';
import {
  Container,
  Row,
  Col,
  Button,
  ListGroup,
  Alert
} from 'react-bootstrap';
import ParameterModal from './ParameterModal';
import BuildHistoryTable, { BuildHistoryRecord } from './BuildHistoryTable';
import '../styles/CustomModal.css';

interface TreeNode {
  name: string;
  children: { [key: string]: TreeNode };
}

const buildTree = (paths: string[]): TreeNode => {
  const root: TreeNode = { name: 'root', children: {} };
  paths.forEach(path => {
    const parts = path.split('/');
    let current = root;
    parts.forEach(part => {
      if (!current.children[part]) {
        current.children[part] = { name: part, children: {} };
      }
      current = current.children[part];
    });
  });
  return root;
};

interface ParameterDefinition {
  _class: string;
  name: string;
  description?: string;
  defaultParameterValue?: {
    _class: string;
    name: string;
    value: string;
  };
  choices?: string[];
  type?: string;
}

interface JenkinsDashboardProps {
  nickName: string;
}

const JenkinsDashboard: React.FC<JenkinsDashboardProps> = ({ nickName }) => {
  const [jobPathsList, setJobPathsList] = useState<string[]>([]);
  const [jobTree, setJobTree] = useState<TreeNode | null>(null);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [alertMsg, setAlertMsg] = useState<string>('');
  const [runningTasks, setRunningTasks] = useState<any[]>([]);
  const [requiredParams, setRequiredParams] = useState<ParameterDefinition[]>([]);
  const [loadingParams, setLoadingParams] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [buildHistory, setBuildHistory] = useState<BuildHistoryRecord[]>([]);

  // Fetch job paths list from API on mount.
  useEffect(() => {
    fetch("http://localhost:8080/api/v1/jenkins/list")
      .then(res => res.json())
      .then(data => {
         if (data.results) {
           // Filter only jobs starting with mobile_test, ui_test, or smoke_testing.
           const filtered = data.results.filter((job: string) =>
             job.startsWith("mobile_test") ||
             job.startsWith("ui_test") ||
             job.startsWith("smoke_testing")
           );
           setJobPathsList(filtered);
           setJobTree(buildTree(filtered));
         }
      })
      .catch(err => console.error("Error fetching job list:", err));
  }, []);

  // Dummy running tasks (replace with real API calls)
  useEffect(() => {
    setRunningTasks([
      { _id: '123', job_name: 'mobile_test/FortiToken_Mobile/iOS/ios16_auto_test', status: 'running', build_number: 105 }
    ]);
  }, []);

  // When at a leaf node, fetch required parameters and build history.
  useEffect(() => {
    if (currentPath.length === 0) return;
    const node = getCurrentNode();
    if (node && Object.keys(node.children).length === 0) {
      const jobName = currentPath.join('/');
      setLoadingParams(true);
      fetch(`http://localhost:8080/api/v1/jenkins/parameters?job_name=${encodeURIComponent(jobName)}`)
        .then(res => res.json())
        .then(data => {
          if (data.parameters) {
            setRequiredParams(data.parameters);
          }
        })
        .catch(err => console.error("Error fetching parameters:", err))
        .finally(() => setLoadingParams(false));

      // Fetch build history for this job.
      fetch(`http://localhost:8080/api/v1/jenkins/build_history/${encodeURIComponent(jobName)}`)
        .then(res => res.json())
        .then(data => {
          if (data.results) {
            setBuildHistory(data.results);
          }
        })
        .catch(err => console.error("Error fetching build history:", err));
    }
  }, [currentPath, jobTree]);

  const getCurrentNode = (): TreeNode | null => {
    if (!jobTree) return null;
    let node: TreeNode = jobTree;
    for (const part of currentPath) {
      if (!node.children[part]) {
        return null;
      }
      node = node.children[part];
    }
    return node;
  };

  const handleSelect = (newPath: string[]) => {
    setCurrentPath(newPath);
  };

  const handleBack = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1));
    }
  };

  // Left Sidebar: TreeView Component.
  const TreeView: React.FC<{ node: TreeNode; currentPath: string[]; onSelect: (newPath: string[]) => void; }> = ({ node, currentPath, onSelect }) => {
    if (!node) return null;
    const childKeys = Object.keys(node.children);
    return (
      <ListGroup>
        {childKeys.map((key, index) => (
          <ListGroup.Item key={index} action onClick={() => onSelect([...currentPath, key])}>
            {key} {Object.keys(node.children[key].children).length > 0 ? ' >' : ''}
          </ListGroup.Item>
        ))}
      </ListGroup>
    );
  };

  // Right Side: JobDetails Component.
  const JobDetails: React.FC<{ path: string[]; }> = ({ path }) => {
    const jobName = path.slice(-1)[0];
    return (
      <div>
        <h4>{jobName}</h4>
        <Button variant="primary" onClick={() => setShowModal(true)}>
          Start Build
        </Button>
      </div>
    );
  };

  // Show running jobs only at root level.
  const showRunningJobs = currentPath.length === 0;

  // Handle modal submit: receive final parameters from the modal.
  const handleModalSubmit = (finalParams: { [key: string]: string }) => {
    const jobName = currentPath.join('/');
    const uid = Date.now().toString();
    fetch('/api/v1/jenkins/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_name: jobName,
        parameters: finalParams,
        uid,
        nickname: nickName
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.result) {
          setAlertMsg('Job started successfully.');
        } else {
          setAlertMsg('Failed to start job.');
        }
      })
      .catch(err => {
        console.error(err);
        setAlertMsg('Error starting job.');
      });
    setShowModal(false);
  };

  return (
    <Container style={{ padding: '20px' }}>
      {alertMsg && <Alert variant="info">{alertMsg}</Alert>}
      <Row className="g-0">
        {/* Left Sidebar: Navigation Tree (approx 2/5 width) */}
        <Col md={2} style={{ paddingRight: '5px' }}>
          {currentPath.length > 0 && (
            <Button variant="secondary" onClick={handleBack} className="mb-3">
              &larr; Back
            </Button>
          )}
          {(!getCurrentNode() || Object.keys(getCurrentNode()!.children).length > 0) ? (
            <TreeView node={getCurrentNode() || jobTree!} currentPath={currentPath} onSelect={handleSelect} />
          ) : (
            <Fragment>
              <JobDetails path={currentPath} />
              {loadingParams && <p>Loading parameters...</p>}
            </Fragment>
          )}
        </Col>
        {/* Right Main Area */}
        <Col md={10} style={{ paddingLeft: '5px' }}>
          {showRunningJobs ? (
            <>
              <h4>Running Jobs</h4>
              <ListGroup className="mb-3">
                {runningTasks.map((task, idx) => (
                  <ListGroup.Item key={idx}>
                    UID: {task._id} | Job: {task.job_name} | Status: {task.status} | Build #{task.build_number}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </>
          ) : (
            <>
              <h4>Build History</h4>
              <BuildHistoryTable records={buildHistory} />
            </>
          )}
        </Col>
      </Row>
      {/* ParameterModal Popup */}
      <ParameterModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleModalSubmit}
        requiredParams={requiredParams}
      />
    </Container>
  );
};

export default JenkinsDashboard;
