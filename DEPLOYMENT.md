# QA Cloud Portal - Deployment Guide

Complete guide for deploying the QA Cloud Portal frontend.

## Architecture Overview

The QA Cloud Portal is a React SPA that connects to separate backend services:

```
┌─────────────────┐         ┌──────────────────┐
│   React SPA     │  HTTP   │  Backend APIs    │
│  (Frontend)     │────────▶│  (Separate)      │
│  Port 3000      │         │  Various ports   │
└─────────────────┘         └──────────────────┘
```

**Frontend**: React SPA with TypeScript
**Backend**: Separate backend services (deployed independently)

## Prerequisites

- Docker installed
- Kubernetes cluster access (if deploying to K8s)
- kubectl configured (if deploying to K8s)
- Access to Docker registry: `10.160.16.60/uiux`
- Backend services running and accessible

## 1. Build and Push Docker Image

```bash
# From project root
make build_docker_image
make push_docker_image
```

This builds and pushes: `10.160.16.60/uiux/portal:latest`

Or manually:
```bash
docker build -t 10.160.16.60/uiux/portal:latest .
docker push 10.160.16.60/uiux/portal:latest
```

## 2. Configuration

Before deploying, configure backend API endpoints in `src/config/config.ts`:

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

## 3. Deploy to Kubernetes (Optional)

If you have Kubernetes manifests:

```bash
kubectl apply -f k8s/frontend-deployment.yaml
```

Verify deployment:
```bash
kubectl get pods -l app=qa-cloud-portal
kubectl logs -l app=qa-cloud-portal -f
```

## 4. Run with Docker

```bash
docker run -p 3000:3000 10.160.16.60/uiux/portal:latest
```

Access the portal at: http://localhost:3000

## 5. Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

## 6. Available Pages

- `/` - Home page
- `/emulator-cloud` - Emulator management
- `/browser-cloud` - Browser cloud management
- `/jenkins-cloud` - Jenkins dashboard
- `/reviewfinder` - App review analysis
- `/resource` - Resource monitoring
- `/report-error` - Error reporting form

## 7. Troubleshooting

### Frontend Issues

**Clear cache and rebuild**:
```bash
rm -rf node_modules build
npm install
npm run build
```

**Check API connectivity**:
- Verify endpoints in `src/config/config.ts`
- Ensure backend services are running and accessible
- Test backend endpoints manually with curl

**Check logs** (if deployed to K8s):
```bash
kubectl logs -l app=qa-cloud-portal -f
```

### Backend Connectivity Issues

1. **Verify backend URLs** in `src/config/config.ts`
2. **Test backend endpoints**:
   ```bash
   curl http://10.160.24.88:32677/health
   curl http://10.160.24.88:30309/health
   ```
3. **Check CORS settings** on backend services
4. **Verify network connectivity** from frontend to backend

## 8. Updating

### Update Frontend Code

```bash
# Build new image
make build_docker_image
make push_docker_image

# If using K8s, restart pods
kubectl rollout restart deployment qa-cloud-portal
```

## 9. Complete Deployment Checklist

- [ ] Configure backend URLs in `src/config/config.ts`
- [ ] Build frontend Docker image
- [ ] Push image to registry
- [ ] Deploy frontend (Docker or K8s)
- [ ] Verify frontend is accessible
- [ ] Test connectivity to backend services
- [ ] Verify all features work correctly
- [ ] Set up monitoring/logging (if needed)

## 10. Quick Commands Reference

```bash
# Build and push
make build_docker_image
make push_docker_image

# Run locally
npm start

# Build for production
npm run build

# Deploy to K8s (if applicable)
kubectl apply -f k8s/frontend-deployment.yaml

# Check status (K8s)
kubectl get pods,svc -l app=qa-cloud-portal

# View logs (K8s)
kubectl logs -l app=qa-cloud-portal -f --tail=50

# Restart service (K8s)
kubectl rollout restart deployment qa-cloud-portal
```

## Support

For issues or questions:
- Check browser console for errors
- Verify backend service connectivity
- Contact: ljiahao@fortinet.com
