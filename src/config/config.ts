const config = {
    emulatorBaseUrl: 'http://10.160.24.88:32677', // Replace with your actual base URL
    reviewfinderUrl: 'http://10.160.24.88:30423',
    jenkinsCloudUrl: 'http://localhost:8080',
    emailServiceUrl: 'http://10.160.24.88:30309', // Email service for error reporting
    // Use environment variables if available, otherwise fallback to defaults
    seleniumGridBackendUrl: process.env.REACT_APP_SELENIUM_BACKEND_URL ||
      (process.env.NODE_ENV === 'development'
        ? 'http://localhost:31590'  // For local development
        : 'http://10.160.24.88:31590'), // For production
    seleniumGridUrl: process.env.REACT_APP_SELENIUM_GRID_URL ||
      (process.env.NODE_ENV === 'development'
        ? 'http://localhost:31590'
        : 'http://10.160.24.88:31590')
  };

  export default config;