import React from 'react';
import { Tabs, Tab, Container } from 'react-bootstrap';
import JenkinsFTMIOS from './JenkinsFTMIOS';
import JenkinsFTMAndroid from './JenkinsFTMAndroid';

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
      </Tabs>
    </Container>
  );
};

export default JenkinsCloudPage;