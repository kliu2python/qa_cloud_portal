# QA Cloud Portal - Email Service Deployment Guide

Complete guide for deploying the QA Cloud Portal with Email Service functionality.

## Architecture Overview

The QA Cloud Portal now includes an email service that sends error reports via Gmail SMTP:

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│   React SPA     │  HTTP   │  Email Service   │  SMTP   │   Gmail     │
│  (Frontend)     │────────▶│   (Backend)      │────────▶│   Server    │
│  Port 3000      │         │   Port 8309      │         │  Port 587   │
└─────────────────┘         └──────────────────┘         └─────────────┘
```

**Frontend**: React SPA with error reporting form
**Backend**: Node.js/Express email service with Nodemailer
**Email**: Gmail SMTP for sending formatted error reports

## Prerequisites

- Docker installed
- Kubernetes cluster access
- kubectl configured
- Access to Docker registry: `10.160.16.60/uiux`
- Gmail account with App Password (already configured)

## 1. Build and Push Docker Images

### Frontend (React App)

```bash
# From project root
make build_docker_image
make push_docker_image
```

This builds and pushes: `10.160.16.60/uiux/portal:latest`

### Backend (Email Service)

```bash
# Navigate to backend directory
cd backend

# Build and push using Makefile
make build
make push

# Or build manually
docker build -t 10.160.16.60/uiux/email-service:latest .
docker push 10.160.16.60/uiux/email-service:latest
```

## 2. Deploy to Kubernetes

### Deploy Email Service First

```bash
# Apply ConfigMap with SMTP credentials
kubectl apply -f k8s/email-service-configmap.yaml

# Deploy email service
kubectl apply -f k8s/email-service-deployment.yaml

# (Optional) Expose via NodePort for external access
kubectl apply -f k8s/email-service-nodeport.yaml
```

### Verify Email Service

```bash
# Check pods are running
kubectl get pods -l app=email-service

# Check service
kubectl get svc email-service

# View logs
kubectl logs -l app=email-service -f

# Test health endpoint
kubectl port-forward svc/email-service 8309:8309
curl http://localhost:8309/health
```

### Deploy Frontend (if needed)

If you have frontend k8s manifests, deploy them:

```bash
kubectl apply -f k8s/frontend-deployment.yaml
```

## 3. Testing

### Test Email Service Directly

```bash
# Port forward to email service
kubectl port-forward svc/email-service 8309:8309

# Send test email
curl -X POST http://localhost:8309/send-test-email \
  -H "Content-Type: application/json" \
  -d '{"recipient":"your-email@example.com"}'

# Send error report
curl -X POST http://localhost:8309/send-error-report \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Error from K8s",
    "content": "Testing email service deployment",
    "category": "Infrastructure"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Error report sent successfully",
  "messageId": "<message-id@smtp.gmail.com>"
}
```

### Test from Frontend

1. Access the QA Cloud Portal frontend
2. Navigate to **Report Error** page (`/report-error`)
3. Fill out the form:
   - **Title**: "Test Error Report"
   - **Category**: Any category
   - **Description**: "Testing email integration"
4. Click **Submit Report**
5. Check for success message
6. Verify email received at `ljiahao@fortinet.com`

## 4. Configuration

### Email Service Configuration

The email service is configured via ConfigMap in `k8s/email-service-configmap.yaml`:

```yaml
SMTP_HOST: smtp.gmail.com
SMTP_PORT: 587
SMTP_USER: ftc.automation.time.smoke4@gmail.com
SMTP_PASS: iyfbuhpeepzydyxg
DEFAULT_RECIPIENT: ljiahao@fortinet.com
```

### Frontend Configuration

The frontend is configured in `src/config/config.ts`:

```typescript
emailServiceUrl: 'http://10.160.24.88:30309'
```

This URL points to the NodePort service for the email backend.

## 5. Monitoring

### View Email Service Logs

```bash
# Stream logs from all email service pods
kubectl logs -l app=email-service --all-containers -f

# View logs from specific pod
kubectl logs <pod-name> -f

# Search for errors
kubectl logs -l app=email-service | grep -i error
```

### Health Checks

The email service includes two health endpoints:

**Liveness Probe**: `/health`
- Checks if service is running
- Returns basic status

**Readiness Probe**: `/ready`
- Checks if service is ready to accept requests
- Verifies SMTP connection

```bash
# Check health
curl http://10.160.24.88:30309/health

# Check readiness (includes SMTP test)
curl http://10.160.24.88:30309/ready
```

## 6. Troubleshooting

### Email Service Not Sending Emails

1. **Check SMTP connection**:
   ```bash
   kubectl logs -l app=email-service | grep -i smtp
   ```

2. **Verify credentials**:
   ```bash
   kubectl get configmap email-service-config -o yaml
   ```

3. **Test SMTP from pod**:
   ```bash
   kubectl exec -it <email-service-pod> -- sh
   nc -zv smtp.gmail.com 587
   ```

4. **Check Gmail App Password**:
   - Ensure 2FA is enabled on Gmail account
   - App Password is valid and not revoked

### Frontend Cannot Reach Email Service

1. **Check service endpoint**:
   ```bash
   kubectl get endpoints email-service
   ```

2. **Verify NodePort service**:
   ```bash
   kubectl get svc email-service-nodeport
   ```

3. **Test connectivity**:
   ```bash
   curl http://10.160.24.88:30309/health
   ```

4. **Check frontend config**:
   - Verify `emailServiceUrl` in `src/config/config.ts`
   - Ensure it points to correct NodePort URL

### Pods Not Starting

```bash
# Describe pod to see events
kubectl describe pod <pod-name>

# Check deployment status
kubectl get deployment email-service

# Check resource usage
kubectl top pods -l app=email-service
```

## 7. Updating

### Update SMTP Credentials

```bash
# Edit ConfigMap
kubectl edit configmap email-service-config

# Restart pods to apply changes
kubectl rollout restart deployment email-service
```

### Update Email Service Code

```bash
cd backend
make build-and-push
kubectl rollout restart deployment email-service
```

### Update Frontend

```bash
# From project root
make build_docker_image
make push_docker_image
# Restart frontend pods if applicable
```

## 8. Security Considerations

⚠️ **Important Security Notes**:

1. **SMTP Credentials**: Currently stored in ConfigMap (plain text)
   - For production, use Kubernetes Secrets
   - Consider using secret management tools (Vault, Sealed Secrets)

2. **CORS**: Currently set to `*` (allow all origins)
   - Restrict to specific origins in production

3. **Rate Limiting**: Service includes rate limiting (100 req/15min)
   - Adjust in `backend/src/server.ts` if needed

4. **TLS/HTTPS**:
   - Email service uses TLS for SMTP (port 587)
   - Consider adding HTTPS for the service endpoint

## 9. Email Template

The email service sends beautifully formatted HTML emails with:

- Error title and category
- Full error description
- Metadata (timestamp, IP, user agent)
- Professional styling with QA Cloud Portal branding

Example email preview:
```
🚨 QA Cloud Portal - Error Report
Category: Infrastructure

Error Title: Database Connection Failed

Error Description:
Unable to connect to production database...

Report Metadata:
- Timestamp: 2025-11-20T12:34:56.789Z
- Category: Infrastructure
- IP Address: 10.160.24.100
```

## 10. API Reference

### POST /send-error-report

Send an error report via email.

**Request**:
```json
{
  "title": "Error title",
  "content": "Detailed error description",
  "category": "Emulator Cloud | Browser Cloud | Benchmark Automation | Infrastructure",
  "recipient": "optional@email.com"  // Optional, defaults to ljiahao@fortinet.com
}
```

**Response**:
```json
{
  "success": true,
  "message": "Error report sent successfully",
  "messageId": "<unique-message-id>"
}
```

### POST /send-test-email

Send a test email to verify configuration.

**Request**:
```json
{
  "recipient": "test@example.com"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Test email sent successfully",
  "messageId": "<unique-message-id>"
}
```

## 11. Complete Deployment Checklist

- [ ] Build frontend Docker image
- [ ] Push frontend image to registry
- [ ] Build email service Docker image
- [ ] Push email service image to registry
- [ ] Apply email service ConfigMap
- [ ] Deploy email service
- [ ] Verify email service pods are running
- [ ] Test email service health endpoint
- [ ] Send test email
- [ ] Deploy frontend (if needed)
- [ ] Test error reporting from frontend
- [ ] Verify email received
- [ ] Set up monitoring/logging
- [ ] Document any custom configurations

## 12. Quick Commands Reference

```bash
# Build everything
cd backend && make build && cd ..
make build_docker_image

# Push everything
cd backend && make push && cd ..
make push_docker_image

# Deploy everything
kubectl apply -f k8s/

# Check status
kubectl get pods,svc -l app=email-service

# View logs
kubectl logs -l app=email-service -f --tail=50

# Restart services
kubectl rollout restart deployment email-service

# Test email
kubectl port-forward svc/email-service 8309:8309
curl -X POST http://localhost:8309/send-test-email \
  -H "Content-Type: application/json" \
  -d '{"recipient":"your@email.com"}'
```

## Support

For issues or questions:
- Check logs: `kubectl logs -l app=email-service`
- Review ConfigMap: `kubectl get configmap email-service-config -o yaml`
- Test SMTP: Use `/ready` endpoint
- Contact: ljiahao@fortinet.com
