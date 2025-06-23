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
    <Container className="pt-4">
      <Tabs defaultActiveKey="ftm_ios" id="jenkins-job-tabs" className="mb-3">
        <Tab eventKey="ftm_ios" title="FTM iOS">
          <JenkinsFTMIOS/>
        </Tab>
        <Tab eventKey="ftm_android" title="FTM Android">
          <JenkinsFTMAndroid/>
        </Tab>
        <Tab eventKey="fexp_ios" title="FEXPGO iOS">
          <JenkinsFEXPGOiOS/>
        </Tab>
        <Tab eventKey="fexp_android" title="FEXPGO Android">
          <JenkinsFEXPGOAndroid/>
        </Tab>
        <Tab eventKey="fedr_ios" title="FEDR iOS">
          <JenkinsFEDRAndroid/>
        </Tab>
        <Tab eventKey="fedr_android" title="FEDR Android">
          <JenkinsFEDRiOS/>
        </Tab>
        <Tab eventKey="saved_jobs" title="Saved Jobs">
          <JenkinsCloudSavedJobs/>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default JenkinsCloudPage;