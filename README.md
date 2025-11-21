# QA Cloud Portal

A comprehensive web portal for QA automation and cloud resource management at Fortinet.

## Features

- **Emulator Cloud**: Manage Android emulator instances in the cloud
- **Browser Cloud**: Browser testing infrastructure management
- **Jenkins Cloud**: Jenkins CI/CD job management and monitoring
- **FortiReviewFinder**: App store review analysis and monitoring
- **Resource Management**: System resource dashboard and monitoring
- **Error Reporting**: Email-based error reporting system with Gmail SMTP

## Architecture

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **UI**: Bootstrap 5.3.5 + Custom CSS
- **Routing**: React Router v7.0.1
- **State**: React Hooks
- **HTTP**: Axios + Fetch API

### Backend Services
- All backend services are deployed separately
- API endpoints configured in `src/config/config.ts`

## Quick Start

### Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm start
   ```
   Opens [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
```

## Docker Deployment

### Build Images

```bash
make build_docker_image
make push_docker_image
```

### Run with Docker

```bash
docker run -p 3000:3000 10.160.16.60/uiux/portal:latest
```


## Configuration

Edit `src/config/config.ts` to configure backend API endpoints:

```typescript
const config = {
  emulatorBaseUrl: 'http://10.160.24.88:32677',
  reviewfinderUrl: 'http://10.160.24.88:30423',
  jenkinsCloudUrl: 'http://localhost:8080',
  emailServiceUrl: 'http://10.160.24.88:30309',
  seleniumGridBackendUrl: 'http://10.160.24.88:31590',
  seleniumGridUrl: 'http://10.160.24.88:31590'
};
```

## Project Structure

```
qa_cloud_portal/
├── src/
│   ├── components/         # React components
│   │   ├── ReportError.tsx # Error reporting form
│   │   ├── EmulatorCloud.tsx
│   │   ├── JenkinsCloud.tsx
│   │   ├── NavigateBar.tsx # Sidebar navigation
│   │   └── ...
│   ├── config/            # Configuration files
│   │   └── config.ts      # API endpoints
│   ├── styles/            # CSS files
│   └── App.tsx            # Main app component
├── public/                # Static assets
├── Dockerfile             # Docker build
├── Makefile              # Build automation
└── package.json          # Dependencies
```

## Available Pages

- `/` - Home page
- `/emulator-cloud` - Emulator management
- `/browser-cloud` - Browser cloud management
- `/jenkins-cloud` - Jenkins dashboard
- `/reviewfinder` - App review analysis
- `/resource` - Resource monitoring
- `/report-error` - Error reporting form

## Development

```bash
npm start           # Start dev server
npm test            # Run tests
npm run build       # Production build
```

## Testing

```bash
npm test
```

## Troubleshooting

**Clear cache and rebuild**:
```bash
rm -rf node_modules build
npm install
npm run build
```

**Check API connectivity**:
- Verify endpoints in `src/config/config.ts`
- Ensure backend services are running and accessible

## Dependencies

- react, react-dom (18.3.1)
- react-router-dom (7.0.1)
- bootstrap (5.3.5)
- axios
- react-icons
- xlsx (Excel export)
- @novnc/novnc (VNC viewer)

## Support & Contact

For issues or questions, contact: ljiahao@fortinet.com

## License

Internal Fortinet Project

## Version

Current Version: 6.0.0

## Learn More

- [React Documentation](https://reactjs.org/)
- [Create React App](https://facebook.github.io/create-react-app/docs/getting-started)
