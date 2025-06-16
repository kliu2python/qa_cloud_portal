// Updated ServerListPage.tsx
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
  tags?: string[];
  group?: string;
}

interface JobInitStatus extends Server {
  status?: 'loading' | 'ready' | 'error' | 'deleting';
  errorMsg?: string;
}

const defaultTags = ['release test', 'unit test', 'dev test', 'integration test'];

const ServerListPage: React.FC = () => {
  const [jobs, setJobs] = useState<JobInitStatus[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newJob, setNewJob] = useState<Partial<Server>>({});
  const [showApiTokenMasked, setShowApiTokenMasked] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');
  const [groups, setGroups] = useState<string[]>([]);

  const navigate = useNavigate();

  const fetchJobs = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/v1/jenkins_cloud/jobs`);
      const data = await res.json();
      if (data.documents) {
        const jobList = data.documents.map((j: any) => ({
          name: j.name,
          ip: j.server_ip,
          un: j.server_un,
          apiToken: j.server_pw,
          tags: j.tags || [],
          group: j.group || '',
          status: 'ready'
        }));
        setJobs(jobList);
      }
    } catch (error) {
      console.error("Failed to fetch saved jobs", error);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/v1/jenkins_cloud/groups`);
      const data = await res.json();
      console.log(data)
      if (data.results) {
        setGroups(data.results);
      }
    } catch (error) {
      console.error("Failed to fetch groups", error);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchGroups();
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
      tags: newJob.tags || [],
      group: newJob.group || '',
      status: 'loading'
    };

    setJobs(prev => [...prev, job]);
    setShowModal(false);

    fetch('http://localhost:8080/api/v1/jenkins_cloud/jobs/parameters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        server_ip: job.ip,
        server_pw: job.apiToken,
        server_un: job.un,
        job_name: job.name,
        tags: job.tags,
        group: job.group
      })
    }).then(res => res.json())
      .then(data => {
        if (data.results) {
          setJobs(prev => prev.map(j => j.name === job.name ? { ...j, status: 'ready' } : j));
        } else {
          throw new Error(data.message || 'Access denied');
        }
      })
      .catch(err => {
        setJobs(prev => prev.map(j => j.name === job.name ? { ...j, status: 'error', errorMsg: err.message } : j));
      });
  };

  const handleEnter = (job: JobInitStatus) => {
    navigate(`/jenkins-cloud/${job.name}`, {
      state: { server: job }
    });
  };

  const handleCopy = (job: JobInitStatus) => {
    setNewJob({
      name: job.name,
      ip: job.ip,
      un: job.un,
      apiToken: job.apiToken,
      tags: job.tags,
      group: job.group
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
      const res = await fetch(`http://localhost:8080/api/v1/jenkins_cloud/jobs/${jobName}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setJobs(prev => prev.filter(job => job.name !== jobName));
      } else {
        setJobs(prev => prev.map(job =>
          job.name === jobName ? { ...job, status: 'error', errorMsg: 'Failed to delete' } : job
        ));
      }
    } catch (error) {
      console.error("Delete request failed", error);
    }
  };

  const filteredJobs = jobs.filter(job => {
    return (!selectedTag || job.tags?.includes(selectedTag)) &&
           (!selectedGroup || job.group === selectedGroup) &&
           job.name.toLowerCase().includes(searchText.toLowerCase());
  });

  const groupedJobs: { [key: string]: JobInitStatus[] } = {};
  [...groups, ''].forEach(group => {
    groupedJobs[group || 'No Group'] = filteredJobs.filter(job => job.group === group);
  });

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

      <Row className="mb-3">
        <Col>
          <Form.Control placeholder="Search..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
        </Col>
        <Col>
          <Form.Select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)}>
            <option value="">All Tags</option>
            {[...new Set(jobs.flatMap(j => j.tags || []))].map(tag => (
              <option key={tag}>{tag}</option>
            ))}
          </Form.Select>
        </Col>
        <Col>
          <Form.Select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
            <option value="">All Groups</option>
            {groups.map(group => <option key={group}>{group}</option>)}
          </Form.Select>
        </Col>
        <Col xs="auto">
          <Button variant="outline-secondary" onClick={() => {
            setSearchText('');
            setSelectedTag('');
            setSelectedGroup('');
          }}>Reset</Button>
        </Col>
      </Row>

      {Object.entries(groupedJobs).map(([groupName, groupJobs]) => (
        <div key={groupName} className="mb-4">
          <h5>{groupName}</h5>
          <hr />
          <Row xs={1} md={2} lg={3} className="g-4">
            {groupJobs.map((job, i) => (
              <Col key={i}>
                <Card>
                  <Card.Body>
                    <Card.Title>
                      {job.name}
                      {(job.status === 'loading' || job.status === 'deleting') && <Spinner animation="border" size="sm" className="ms-2" />}
                      {job.status === 'error' && <div className="text-danger">{job.errorMsg}</div>}
                    </Card.Title>
                    <div className="mb-2"><strong>Group:</strong> {job.group || 'None'}</div>
                    <div className="mb-2"><strong>Tags:</strong> {job.tags?.join(', ') || 'None'}</div>
                    <div className="d-flex gap-2 mt-2">
                      <Button size="sm" onClick={() => handleEnter(job)} disabled={job.status !== 'ready'}>Enter</Button>
                      <Button size="sm" variant="outline-secondary" onClick={() => handleCopy(job)} disabled={job.status !== 'ready'}>Copy</Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(job.name)} disabled={job.status !== 'ready'}>Delete</Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ))}

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>New Jenkins Job Access</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Job Name</Form.Label>
              <Form.Control name="name" value={newJob.name || ''} placeholder="e.g. Android Pipeline" onChange={handleInputChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>IP Address</Form.Label>
              <Form.Control name="ip" value={newJob.ip || ''} placeholder="e.g. 10.160.13.30:8080" onChange={handleInputChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control name="un" value={newJob.un || ''} placeholder="Jenkins username" onChange={handleInputChange} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>API Token</Form.Label>
              <Form.Control name="apiToken" type="text" value={showApiTokenMasked ? '******' : newJob.apiToken || ''} placeholder="Jenkins API token" onChange={(e) => {
                if (e.target.value === '******') return;
                setShowApiTokenMasked(false);
                handleInputChange(e);
              }} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tags (comma separated)</Form.Label>
              <Form.Control name="tags" value={(newJob.tags || []).join(', ')} placeholder="release test, integration test" onChange={(e) => {
                const tagsArray = e.target.value.split(',').map(tag => tag.trim());
                setNewJob(prev => ({ ...prev, tags: tagsArray }));
              }} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Group</Form.Label>
              <Form.Control name="group" value={newJob.group || ''} placeholder="e.g. mobile, gui" onChange={handleInputChange} />
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
