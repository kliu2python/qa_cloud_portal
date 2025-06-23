import React, { useEffect, useState } from 'react';
import {
  Container,
  Form,
  Button,
  Spinner,
  Row,
  Col,
  Toast,
  ToastContainer,
  InputGroup,
  Table
} from 'react-bootstrap';
import axios from 'axios';

import config from '../config/config';
import CustomEnvModal from './JenkinsCustomModal';
import UploadFileModal from './UploadFileModal';
import TestResultsModal from './JenkinsResultModal';

const JenkinsFEDRiOS: React.FC = () => {
  const [imageOptions, setImageOptions] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'danger'>('success');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedEnv, setSelectedEnv] = useState<'Prod' | 'QA' | 'Custom' | ''>('');
  const [showCustomEnvModal, setShowCustomEnvModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [customEnv, setCustomEnv] = useState({
    docker_tag: '',
    fgt_ftm_dns: '',
    fortigate_ip: '',
    fac_ip: '',
    fac_api_key: ''
  });
  const [testResultLogs, setTestResultLogs] = useState<any[]>([]);
  const [refreshingIndex, setRefreshingIndex] = useState<number | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);

  const apkOptions = imageOptions.filter(name => name.endsWith('.apk'));
  const isReadyToRun = selectedEnv && selectedImage && selectedProduct && selectedPlatforms.length > 0;

  useEffect(() => {
    axios.get(`${config.jenkinsCloudUrl}/api/v1/jenkins_cloud/apk_images`)
      .then(res => setImageOptions(res.data))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    fetchResults();
  }, []);

  useEffect(() => {
    if (!showToast) fetchResults();
  }, [showToast]);

  const handlePlatformChange = (platform: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  const handleSubmit = () => {
    setIsSubmitting(true);

    const nonEmptyCustomEnv = Object.fromEntries(
      Object.entries(customEnv).filter(([_, v]) => v.trim() !== '')
    );

    const payload: any = {
      parameters: {
        RUN_STAGE: selectedProduct,
        docker_tag: selectedImage
      },
      platforms: selectedPlatforms,
      environment: selectedEnv
    };

    if (Object.keys(nonEmptyCustomEnv).length > 0) {
      payload.custom_env = nonEmptyCustomEnv;
    }

    axios.post('http://localhost:8080/api/v1/jenkins_cloud/run/execute/ftm', payload)
      .then(() => {
        setToastMessage('Job started successfully');
        setToastVariant('success');
      })
      .catch(err => {
        setToastMessage(`Error: ${err.message}`);
        setToastVariant('danger');
      })
      .finally(() => {
        setIsSubmitting(false);
        setShowToast(true);
      });
  };

  const fetchResults = () => {
    axios.get('http://localhost:8080/api/v1/jenkins_cloud/run/results/ios/ftm')
      .then(res => setTestResultLogs(res.data || []))
      .catch(err => setTestResultLogs([{ res: `Failed to fetch results: ${err.message}` }]));
  };

  const refreshSingleJob = (jobName: string, index: number) => {
    setRefreshingIndex(index);
    axios.get(`http://localhost:8080/api/v1/jenkins_cloud/run/result/ios/ftm?job_name=${jobName}`)
      .then(res => {
        const newLogs = [...testResultLogs];
        newLogs[index].res = res.data;
        setTestResultLogs(newLogs);
      })
      .catch(err => console.error(`Refresh failed for ${jobName}:`, err))
      .finally(() => setRefreshingIndex(null));
  };

  const uploadFileToServer = (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    axios.post(`${config.jenkinsCloudUrl}/api/v1/jenkins_cloud/apk_images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then(() => {
        setSelectedImage(file.name);
        setImageOptions(prev => [...new Set([...prev, file.name])]);
        setToastMessage(`Uploaded: ${file.name}`);
        setToastVariant('success');
        axios.get(`${config.jenkinsCloudUrl}/api/v1/jenkins_cloud/apk_images`)
          .then(res => setImageOptions(res.data));
      })
      .catch((err) => {
        setToastMessage(`Upload failed: ${err.message}`);
        setToastVariant('danger');
      })
      .finally(() => {
        setIsUploading(false);
        setShowUploadModal(false);
        setShowToast(true);
      });
  };

  return (
    <Container className="p-4 position-relative">
      {/* Select Test Environment */}
        <Form.Label>Work on Progress</Form.Label>
    </Container>
  );
};

export default JenkinsFEDRiOS;
