import React from 'react';
import { Modal, Button, Table, Spinner } from 'react-bootstrap';

interface TestResult {
  name: string;
  res: string;
  build_url: string;
  platform: string;
}

interface TestResultsModalProps {
  show: boolean;
  onClose: () => void;
  testResultLogs: TestResult[];
  onRefreshAll: () => void;
  onRefreshSingle: (jobName: string, index: number) => void;
  refreshingIndex: number | null;
  fullscreen?: boolean; // Optional: default to true
}

const TestResultsModal: React.FC<TestResultsModalProps> = ({
  show,
  onClose,
  testResultLogs,
  onRefreshAll,
  onRefreshSingle,
  refreshingIndex,
  fullscreen = true,
}) => {
  return (
    <Modal
        show={show}
        onHide={onClose}
        fullscreen={fullscreen ? true : undefined}
        scrollable
        >
      <Modal.Header closeButton>
        <Modal.Title>Test Results</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ padding: '1.5rem' }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">Test Results</h5>
          <Button size="sm" onClick={onRefreshAll}>Refresh All</Button>
        </div>
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              <th>Build URL</th>
              <th>Allure Result</th>
              <th>Status</th>
              <th>Platform</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {testResultLogs.map((log, idx) => {
              const url = log.build_url || '';
              const allureUrl = url ? `${url.replace(/\/$/, '')}/allure` : '';
              const jobName = `${log.name}`.replace(/[^a-zA-Z0-9]/g, '');

              return (
                <tr key={idx}>
                  <td><a href={url} target="_blank" rel="noreferrer">Build URL</a></td>
                  <td>{log.res === 'running'
                    ? 'Unavailable'
                    : <a href={allureUrl} target="_blank" rel="noreferrer">Allure</a>}</td>
                  <td>{log.res || 'Unknown'}</td>
                  <td>{log.platform}</td>
                  <td>
                    {log.res === 'running' && (
                      <Button
                        size="sm"
                        disabled={refreshingIndex === idx}
                        onClick={() => onRefreshSingle(jobName, idx)}
                      >
                        {refreshingIndex === idx ? <Spinner animation="border" size="sm" /> : 'Refresh'}
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default TestResultsModal;
