# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying the QA Cloud Portal Email Service.

## Files

- `email-service-configmap.yaml` - Configuration including Gmail SMTP credentials
- `email-service-deployment.yaml` - Deployment with 2 replicas + ClusterIP Service
- `email-service-nodeport.yaml` - NodePort Service for external access (optional)

## Quick Deployment

### 1. Apply ConfigMap (with SMTP credentials)

```bash
kubectl apply -f email-service-configmap.yaml
```

This creates a ConfigMap with:
- Gmail SMTP credentials
- Default recipient email
- Port and CORS configuration

### 2. Deploy the Email Service

```bash
kubectl apply -f email-service-deployment.yaml
```

This creates:
- **Deployment**: 2 replicas of the email service
- **ClusterIP Service**: Internal access on port 8309
- **Health Probes**: Liveness and readiness checks

### 3. (Optional) Expose via NodePort

For external access, apply the NodePort service:

```bash
kubectl apply -f email-service-nodeport.yaml
```

This exposes the service on `NodePort 30309`.

## Verification

### Check Deployment Status

```bash
# Check pods
kubectl get pods -l app=email-service

# Check deployment
kubectl get deployment email-service

# Check services
kubectl get svc email-service
kubectl get svc email-service-nodeport
```

### View Logs

```bash
# Get pod name
kubectl get pods -l app=email-service

# View logs
kubectl logs -f <pod-name>

# View logs from all replicas
kubectl logs -l app=email-service --all-containers=true -f
```

### Test Health Endpoints

```bash
# Port forward to test locally
kubectl port-forward svc/email-service 8309:8309

# In another terminal, test health endpoint
curl http://localhost:8309/health

# Test readiness (includes SMTP verification)
curl http://localhost:8309/ready
```

## Testing Email Functionality

### Send Test Email

```bash
# Port forward
kubectl port-forward svc/email-service 8309:8309

# Send test email
curl -X POST http://localhost:8309/send-test-email \
  -H "Content-Type: application/json" \
  -d '{"recipient":"your-email@example.com"}'
```

### Send Error Report

```bash
curl -X POST http://localhost:8309/send-error-report \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Error Report",
    "content": "This is a test error report from Kubernetes deployment",
    "category": "Infrastructure"
  }'
```

## Updating Configuration

### Update SMTP Credentials

1. Edit the ConfigMap:
   ```bash
   kubectl edit configmap email-service-config
   ```

2. Or apply updated YAML:
   ```bash
   kubectl apply -f email-service-configmap.yaml
   ```

3. Restart pods to pick up changes:
   ```bash
   kubectl rollout restart deployment email-service
   ```

### Update Email Service Image

1. Build and push new image:
   ```bash
   cd ../backend
   make build-and-push
   ```

2. Update deployment:
   ```bash
   kubectl rollout restart deployment email-service
   ```

3. Watch rollout status:
   ```bash
   kubectl rollout status deployment email-service
   ```

## Troubleshooting

### Pods not starting

```bash
# Check pod status
kubectl describe pod <pod-name>

# Check events
kubectl get events --sort-by='.lastTimestamp'
```

### SMTP connection failing

```bash
# Check logs for SMTP errors
kubectl logs -l app=email-service | grep -i smtp

# Verify ConfigMap
kubectl get configmap email-service-config -o yaml

# Test SMTP from inside pod
kubectl exec -it <pod-name> -- sh
# Inside pod:
nc -zv smtp.gmail.com 587
```

### Service not accessible

```bash
# Check service endpoints
kubectl get endpoints email-service

# Check service details
kubectl describe svc email-service

# Test from another pod
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl http://email-service:8309/health
```

## Scaling

### Scale replicas

```bash
# Scale to 3 replicas
kubectl scale deployment email-service --replicas=3

# Auto-scale based on CPU
kubectl autoscale deployment email-service --min=2 --max=5 --cpu-percent=80
```

## Cleanup

```bash
# Delete all email service resources
kubectl delete -f email-service-deployment.yaml
kubectl delete -f email-service-nodeport.yaml
kubectl delete -f email-service-configmap.yaml
```

## Security Notes

⚠️ **Important**: The ConfigMap contains sensitive SMTP credentials in plain text.

For production, consider using **Kubernetes Secrets**:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: email-service-secret
type: Opaque
stringData:
  SMTP_USER: ftc.automation.time.smoke4@gmail.com
  SMTP_PASS: iyfbuhpeepzydyxg
```

Then reference in deployment:
```yaml
env:
- name: SMTP_USER
  valueFrom:
    secretKeyRef:
      name: email-service-secret
      key: SMTP_USER
```

## Access Methods

1. **Within Cluster**: Use ClusterIP service
   - URL: `http://email-service:8309`

2. **External Access** (if NodePort applied):
   - URL: `http://<node-ip>:30309`
   - In this setup: `http://10.160.24.88:30309`

3. **Port Forward** (development):
   ```bash
   kubectl port-forward svc/email-service 8309:8309
   # Access at http://localhost:8309
   ```

## Monitoring

### Resource Usage

```bash
# Check resource usage
kubectl top pods -l app=email-service

# Check resource limits
kubectl describe deployment email-service | grep -A 5 Limits
```

### Email Service Metrics

The email service logs include:
- Email send success/failure
- SMTP connection status
- Request timing and errors
- Rate limiting events

Access logs:
```bash
kubectl logs -l app=email-service --tail=100 -f
```
