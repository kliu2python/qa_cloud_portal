# QA Cloud Portal - Email Service

Backend service for sending error report emails from the QA Cloud Portal.

## Features

- ✉️ **Error Report Emails**: Send formatted error reports via Gmail SMTP
- 🔒 **Secure**: Uses Helmet for security headers and rate limiting
- 🎨 **HTML Templates**: Beautiful, responsive email templates
- 📊 **Health Checks**: Kubernetes-ready health and readiness endpoints
- 🔧 **ConfigMap Support**: Read credentials from Kubernetes ConfigMaps

## Prerequisites

- Node.js 14+ or Docker
- Gmail account with App Password enabled
- Kubernetes cluster (for production deployment)

## Getting Started

### Local Development

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Gmail credentials
   ```

3. **Build TypeScript:**
   ```bash
   npm run build
   ```

4. **Run the service:**
   ```bash
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```

The service will start on port 8309 by default.

### Using Docker

1. **Build the Docker image:**
   ```bash
   docker build -t qa-portal-email-service:latest .
   ```

2. **Run the container:**
   ```bash
   docker run -p 8309:8309 \
     -e SMTP_USER=your-email@gmail.com \
     -e SMTP_PASS=your-app-password \
     -e DEFAULT_RECIPIENT=recipient@example.com \
     qa-portal-email-service:latest
   ```

### Kubernetes Deployment

1. **Apply ConfigMap with credentials:**
   ```bash
   kubectl apply -f ../k8s/email-service-configmap.yaml
   ```

2. **Deploy the service:**
   ```bash
   kubectl apply -f ../k8s/email-service-deployment.yaml
   kubectl apply -f ../k8s/email-service-service.yaml
   ```

## API Endpoints

### Health Check
```bash
GET /health
```
Returns service health status.

### Readiness Check
```bash
GET /ready
```
Verifies SMTP connection and returns readiness status.

### Send Error Report
```bash
POST /send-error-report
Content-Type: application/json

{
  "title": "Error Title",
  "content": "Detailed error description",
  "category": "Browser Cloud",
  "recipient": "optional-recipient@example.com"
}
```

### Send Test Email
```bash
POST /send-test-email
Content-Type: application/json

{
  "recipient": "test@example.com"
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8309` |
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_SECURE` | Use TLS (true for 465) | `false` |
| `SMTP_USER` | Gmail email address | *Required* |
| `SMTP_PASS` | Gmail app password | *Required* |
| `DEFAULT_RECIPIENT` | Default email recipient | `ljiahao@fortinet.com` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `*` |

## Gmail App Password Setup

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification**
3. Scroll to **App passwords**
4. Generate a new app password for "Mail"
5. Use this password in `SMTP_PASS` environment variable

## Testing

Test the email service locally:

```bash
# Send a test email
curl -X POST http://localhost:8309/send-test-email \
  -H "Content-Type: application/json" \
  -d '{"recipient":"your-email@example.com"}'

# Send an error report
curl -X POST http://localhost:8309/send-error-report \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Test Error",
    "content":"This is a test error report",
    "category":"Infrastructure"
  }'
```

## Project Structure

```
backend/
├── src/
│   ├── server.ts          # Express server and API routes
│   └── emailService.ts    # Email sending logic with Nodemailer
├── dist/                  # Compiled JavaScript (generated)
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript configuration
├── .env.example          # Environment template
└── Dockerfile            # Docker build configuration
```

## Security Notes

- Never commit `.env` files with real credentials
- Use Kubernetes Secrets or ConfigMaps for production
- Rate limiting is enabled (100 requests per 15 minutes)
- CORS can be restricted via `ALLOWED_ORIGINS`

## License

MIT
