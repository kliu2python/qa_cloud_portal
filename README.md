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
- **Email Service**: Node.js/Express with Nodemailer for error reporting
  - Gmail SMTP integration
  - Beautiful HTML email templates
  - ConfigMap-based configuration for Kubernetes

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

3. **Start email service** (optional):
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   Email service runs on [http://localhost:8309](http://localhost:8309)

### Production Build

```bash
# Build frontend
npm run build

# Build email service
cd backend
npm run build
```

## Docker Deployment

### Build Images

```bash
# Frontend
make build_docker_image
make push_docker_image

# Backend email service
cd backend
make build
make push
```

### Run with Docker

```bash
# Frontend
docker run -p 3000:3000 10.160.16.60/uiux/portal:latest

# Email service
docker run -p 8309:8309 \
  -e SMTP_USER=your-email@gmail.com \
  -e SMTP_PASS=your-app-password \
  10.160.16.60/uiux/email-service:latest
```

## Kubernetes Deployment

Complete deployment guide available in [DEPLOYMENT.md](./DEPLOYMENT.md)

### Quick Deploy

```bash
# Deploy email service
kubectl apply -f k8s/email-service-configmap.yaml
kubectl apply -f k8s/email-service-deployment.yaml

# Verify deployment
kubectl get pods -l app=email-service
kubectl logs -l app=email-service -f
```

See [k8s/README.md](./k8s/README.md) for detailed Kubernetes documentation.

## Email Service

The email service provides error reporting functionality via Gmail SMTP.

### Features
- Beautiful HTML email templates
- Configurable via Kubernetes ConfigMap
- Health and readiness probes
- Rate limiting (100 requests per 15 minutes)
- Automatic retry logic

### API Endpoints

**Health Check**:
```bash
GET /health
```

**Readiness Check** (includes SMTP verification):
```bash
GET /ready
```

**Send Error Report**:
```bash
POST /send-error-report
Content-Type: application/json

{
  "title": "Error title",
  "content": "Error description",
  "category": "Infrastructure",
  "recipient": "optional@email.com"
}
```

**Send Test Email**:
```bash
POST /send-test-email
Content-Type: application/json

{
  "recipient": "test@email.com"
}
```

### Testing Email Service

```bash
cd backend
./test-email.sh
```

Or manually:
```bash
# Port forward to service
kubectl port-forward svc/email-service 8309:8309

# Send test email
curl -X POST http://localhost:8309/send-test-email \
  -H "Content-Type: application/json" \
  -d '{"recipient":"your@email.com"}'
```

## Configuration

### Frontend Configuration

Edit `src/config/config.ts`:

```typescript
const config = {
  emulatorBaseUrl: 'http://10.160.24.88:32677',
  reviewfinderUrl: 'http://10.160.24.88:30423',
  jenkinsCloudUrl: 'http://localhost:8080',
  emailServiceUrl: 'http://10.160.24.88:30309'
};
```

### Email Service Configuration

Configure via environment variables or Kubernetes ConfigMap:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
DEFAULT_RECIPIENT=recipient@example.com
```

## Project Structure

```
qa_cloud_portal/
├── src/
│   ├── components/         # React components
│   │   ├── ReportError.tsx # Error reporting form
│   │   ├── EmulatorCloud.tsx
│   │   ├── JenkinsCloud.tsx
│   │   └── ...
│   ├── config/            # Configuration files
│   │   └── config.ts      # API endpoints
│   ├── styles/            # CSS files
│   └── App.tsx            # Main app component
├── backend/               # Email service backend
│   ├── src/
│   │   ├── server.ts      # Express server
│   │   └── emailService.ts # Email logic
│   ├── Dockerfile         # Backend Docker build
│   ├── package.json       # Backend dependencies
│   └── test-email.sh      # Test script
├── k8s/                   # Kubernetes manifests
│   ├── email-service-configmap.yaml
│   ├── email-service-deployment.yaml
│   └── email-service-nodeport.yaml
├── public/                # Static assets
├── Dockerfile             # Frontend Docker build
├── Makefile              # Build automation
└── DEPLOYMENT.md         # Deployment guide
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

### Frontend

```bash
npm start           # Start dev server
npm test            # Run tests
npm run build       # Production build
```

### Backend Email Service

```bash
cd backend
npm install         # Install dependencies
npm run dev         # Start with hot reload
npm run build       # Build TypeScript
npm start           # Start production server
```

## Testing

### Frontend Tests
```bash
npm test
```

### Email Service Tests
```bash
cd backend
./test-email.sh
```

### Manual Testing
1. Start both frontend and backend services
2. Navigate to `/report-error`
3. Fill out and submit error report form
4. Check recipient email inbox

## Troubleshooting

### Email Service Issues

**Check logs**:
```bash
kubectl logs -l app=email-service -f
```

**Verify SMTP connection**:
```bash
curl http://localhost:8309/ready
```

**Test email sending**:
```bash
cd backend
./test-email.sh
```

### Frontend Issues

**Clear cache and rebuild**:
```bash
rm -rf node_modules build
npm install
npm run build
```

**Check API connectivity**:
- Verify endpoints in `src/config/config.ts`
- Check CORS settings on backend services

## Dependencies

### Frontend
- react, react-dom (18.3.1)
- react-router-dom (7.0.1)
- bootstrap (5.3.5)
- axios
- react-icons
- xlsx (Excel export)

### Backend Email Service
- express
- nodemailer
- cors
- helmet (security)
- express-rate-limit

## Environment Variables

### Email Service

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 8309 |
| SMTP_HOST | SMTP server | smtp.gmail.com |
| SMTP_PORT | SMTP port | 587 |
| SMTP_USER | Gmail address | *Required* |
| SMTP_PASS | Gmail app password | *Required* |
| DEFAULT_RECIPIENT | Default recipient | ljiahao@fortinet.com |
| ALLOWED_ORIGINS | CORS origins | * |

## Gmail App Password Setup

1. Enable 2-Factor Authentication on Gmail
2. Go to Google Account Settings → Security
3. Navigate to "App passwords"
4. Generate new app password for "Mail"
5. Use this password in `SMTP_PASS`

## Security

- SMTP credentials stored in Kubernetes ConfigMap
- Rate limiting on email endpoints (100 req/15 min)
- CORS configuration
- Helmet security headers
- Input validation on all endpoints

## Support & Contact

For issues or questions:
- Check logs: `kubectl logs -l app=email-service`
- Review documentation: [DEPLOYMENT.md](./DEPLOYMENT.md)
- Contact: ljiahao@fortinet.com

## License

Internal Fortinet Project

## Version

Current Version: 6.0.0

## Learn More

- [React Documentation](https://reactjs.org/)
- [Create React App](https://facebook.github.io/create-react-app/docs/getting-started)
- [Nodemailer Documentation](https://nodemailer.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
