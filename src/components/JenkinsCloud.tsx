import React from 'react';
import { Tabs, Tab, Container, Card, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaQuestionCircle } from 'react-icons/fa';
import JenkinsFTMIOS from './JenkinsFTMIOS';
import JenkinsFTMAndroid from './JenkinsFTMAndroid';
import JenkinsFEXPGOiOS from './JenkinsFEXPGOiOS';
import JenkinsFEXPGOAndroid from './JenkinsFEXPGOAndroid';
import JenkinsFEDRAndroid from './JenkinsFEDRAndroid';
import JenkinsFEDRiOS from './JenkinsFEDRiOS';
import JenkinsCloudSavedJobs from './JenkinsCloudSavedJobs';

const JenkinsCloudPage: React.FC = () => {
  return (
    <div style={{ background: '#f4f6f8', minHeight: '100vh' }}>
      <Container className="pb-4" style={{ paddingTop: '24px' }}>
        <Card style={{ marginBottom: '20px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: 'none' }}>
          <Card.Body>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>Jenkins Cloud Service</h3>
              <OverlayTrigger
                placement="right"
                overlay={
                  <Tooltip id="jenkins-cloud-help">
                    <div style={{ textAlign: 'left' }}>
                      <strong>Jenkins Cloud Service</strong>
                      <hr style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.3)' }} />
                      <p style={{ margin: '4px 0' }}><strong>What it does:</strong></p>
                      <p style={{ margin: '4px 0', fontSize: '13px' }}>
                        Provides automated CI/CD job execution for mobile app testing across multiple platforms and test suites
                      </p>
                      <p style={{ margin: '8px 0 4px 0' }}><strong>How to use:</strong></p>
                      <ul style={{ margin: '4px 0', paddingLeft: '20px', fontSize: '13px' }}>
                        <li>Select the appropriate tab for your test suite (FTM, FEXPGO, FEDR)</li>
                        <li>Choose iOS or Android platform</li>
                        <li>Configure test parameters and environment variables</li>
                        <li>Click "Run Job" to trigger Jenkins execution</li>
                        <li>Monitor job progress and view real-time logs</li>
                        <li>Access "Saved Jobs" to review historical test results</li>
                      </ul>
                      <p style={{ margin: '8px 0 4px 0' }}><strong>What you get:</strong></p>
                      <ul style={{ margin: '4px 0', paddingLeft: '20px', fontSize: '13px' }}>
                        <li>Automated mobile test execution across platforms</li>
                        <li>Parameterized job configuration and customization</li>
                        <li>Real-time build logs and execution status</li>
                        <li>Job history and result archival</li>
                        <li>Integration with existing Jenkins pipelines</li>
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
          </Card.Body>
        </Card>
        <Tabs defaultActiveKey="ftm_ios" id="jenkins-job-tabs" className="mb-3">
          <Tab eventKey="ftm_ios" title="FTM iOS">
            <JenkinsFTMIOS/>
          </Tab>
          <Tab eventKey="ftm_android" title="FTM Android">
            <JenkinsFTMAndroid/>
          </Tab>
          <Tab eventKey="fexp_ios" title="FEXPGO iOS" disabled>
            <JenkinsFEXPGOiOS/>
          </Tab>
          <Tab eventKey="fexp_android" title="FEXPGO Android" disabled>
            <JenkinsFEXPGOAndroid/>
          </Tab>
          <Tab eventKey="fedr_ios" title="FEDR iOS" disabled>
            <JenkinsFEDRAndroid/>
          </Tab>
          <Tab eventKey="fedr_android" title="FEDR Android" disabled>
            <JenkinsFEDRiOS/>
          </Tab>
          <Tab eventKey="saved_jobs" title="Saved Jobs">
            <JenkinsCloudSavedJobs/>
          </Tab>
        </Tabs>
      </Container>
    </div>
  );
};

export default JenkinsCloudPage;