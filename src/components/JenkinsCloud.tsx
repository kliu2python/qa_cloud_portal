import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Button,
  Card,
  Modal,
  Form,
  Spinner
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

interface Server {
  id?: string;
  ip: string;
  name: string;
  apiToken: string;
  un: string;
}

interface JobInitStatus {
  ip?: string;
  un?: string;
  apiToken?: string;
  name: string;
  status?: 'loading' | 'ready' | 'error' | 'deleting';
  errorMsg?: string;
}

const ServerListPage: React.FC = () => {
  const [jobs, setJobs] = useState<JobInitStatus[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newJob, setNewJob] = useState<Partial<Server>>({});
  const [showApiTokenMasked, setShowApiTokenMasked] = useState(false);
  const navigate = useNavigate();

  const fetchJobs = async () => {
    try {
      const res = await fetch(`http://10.160.24.88:31224/api/v1/jenkins_cloud/jobs`);
      const data = await res.json();
      if (data.documents) {
        const jobList = data.documents.map((j: any) => ({
          name: j.name,
          ip: j.server_ip,
          un: j.server_un,
          apiToken: j.server_pw,
          status: 'ready'
        }));
        setJobs(jobList);
      }
    } catch (error) {
      console.error("Failed to fetch saved jobs", error);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<any>) => {
    const { name, value } = e.target;
    if (name === 'apiToken' && value !== '******') {
      setShowApiTokenMasked(false);
    }
    setNewJob(prev => ({ ...prev, [name]: value }));
  };

  const handleStartJob = () => {
    if (!newJob.ip || !newJob.apiToken || !newJob.name || !newJob.un) return;

    const job: JobInitStatus = {
      ip: newJob.ip,
      apiToken: newJob.apiToken,
      name: newJob.name,
      un: newJob.un,
      status: 'loading'
    };

    setJobs(prev => [...prev, job]);
    setShowModal(false);

    const checkStatus = async () => {
      try {
        const res = await fetch(`http://10.160.24.88:31224/api/v1/jenkins_cloud/jobs/parameters`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            server_ip: job.ip,
            server_pw: job.apiToken,
            server_un: job.un,
            job_name: job.name
          })
        });

        const data = await res.json();
        if (data.results) {
          setJobs(prev =>
            prev.map(j =>
              j.name === job.name && j.ip === job.ip
                ? { ...j, status: 'ready' }
                : j
            )
          );
        } else {
          throw new Error(data.message || 'Access denied');
        }
      } catch (err) {
        setJobs(prev =>
          prev.map(j =>
            j.name === job.name && j.ip === job.ip
              ? { ...j, status: 'error', errorMsg: (err as Error).message }
              : j
          )
        );
      }
    };

    const poll = async () => {
      const current = jobs.find(j => j.name === job.name && j.ip === job.ip);
      if (!current || current.status === 'loading') {
        await checkStatus();
        setTimeout(poll, 3000);
      }
    };

    setTimeout(poll, 1000);
  };

  const handleEnter = (job: JobInitStatus) => {
    navigate(`/jenkins-cloud/${job.name}`, {
      state: { server: job }
    });
  };

  const handleCopy = (job: JobInitStatus) => {
    setNewJob({
      name: job.name,
      ip: job.ip || '',
      un: job.un || '',
      apiToken: job.apiToken || ''
    });
    setShowApiTokenMasked(true);
    setShowModal(true);
  };

  const handleDelete = async (jobName: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${jobName}"?`);
    if (!confirmDelete) return;

    setJobs(prev => prev.map(job =>
      job.name === jobName ? { ...job, status: 'deleting' } : job
    ));

    try {
      const res = await fetch(`http://10.160.24.88:31224/api/v1/jenkins_cloud/jobs/${jobName}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        const pollUntilDeleted = async () => {
          const checkRes = await fetch(`http://10.160.24.88:31224/api/v1/jenkins_cloud/jobs/${jobName}`);
          const checkData = await checkRes.json();
          if (!checkData || checkData.length === 0) {
            setJobs(prev => prev.filter(job => job.name !== jobName));
          } else {
            setTimeout(pollUntilDeleted, 2000);
          }
        };
        pollUntilDeleted();
      } else {
        console.error(`Failed to delete job "${jobName}"`);
        setJobs(prev => prev.map(job =>
          job.name === jobName ? { ...job, status: 'error', errorMsg: 'Failed to delete' } : job
        ));
      }
    } catch (error) {
      console.error("Delete request failed", error);
    }
  };

  return (
    <Container style={{ paddingTop: '20px' }}>
      <Row className="align-items-center mb-3">
        <Col><h3>Tracked Jenkins Jobs</h3></Col>
        <Col className="text-end">
          <Button variant="outline-secondary" onClick={fetchJobs} className="me-2">Refresh</Button>
          <Button variant="primary" onClick={() => {
            setNewJob({});
            setShowApiTokenMasked(false);
            setShowModal(true);
          }}>New</Button>
        </Col>
      </Row>

      <Row xs={1} md={2} lg={3} className="g-4">
        {jobs.map((job, i) => (
          <Col key={i}>
            <Card>
              <Card.Body>
                <Card.Title>
                  {job.name}
                  {(job.status === 'loading' || job.status === 'deleting') && <Spinner animation="border" size="sm" className="ms-2" />}
                  {job.status === 'error' && <div className="text-danger">{job.errorMsg}</div>}
                </Card.Title>

                <div className="d-flex gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={() => handleEnter(job)}
                    disabled={job.status !== 'ready'}
                  >
                    Enter
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    onClick={() => handleCopy(job)}
                    disabled={job.status !== 'ready'}
                  >
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(job.name)}
                    disabled={job.status !== 'ready'}
                  >
                    Delete
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>New Jenkins Job Access</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Job Name</Form.Label>
              <Form.Control
                name="name"
                value={newJob.name || ''}
                placeholder="e.g. Android Pipeline"
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>IP Address</Form.Label>
              <Form.Control
                name="ip"
                value={newJob.ip || ''}
                placeholder="e.g. 10.160.13.30:8080"
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                name="un"
                value={newJob.un || ''}
                placeholder="Jenkins username"
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>API Token</Form.Label>
              <Form.Control
                name="apiToken"
                type="text"
                value={showApiTokenMasked ? '******' : newJob.apiToken || ''}
                placeholder="Jenkins API token"
                onChange={(e) => {
                  if (e.target.value === '******') return;
                  setShowApiTokenMasked(false);
                  handleInputChange(e);
                }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleStartJob}>Verify</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ServerListPage;
