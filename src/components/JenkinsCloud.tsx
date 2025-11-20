import React from 'react';
import { Tabs, Tab, Container } from 'react-bootstrap';
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
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        padding: '60px 0',
        marginBottom: '30px',
        color: 'white',
        textAlign: 'center'
      }}>
        <Container>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '15px' }}>
            Jenkins Cloud
          </h1>
          <p style={{ fontSize: '1.2rem', opacity: 0.9 }}>
            Execute automated test jobs with customizable parameters and build tracking
          </p>
        </Container>
      </div>

      <Container className="pb-4">
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