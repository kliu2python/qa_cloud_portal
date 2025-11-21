# QA Cloud Portal - Unified Backend Service

Consolidated backend service for the QA Cloud Portal, providing Email service and Selenium Grid API endpoints.

## Features

- ✉️ **Error Report Emails**: Send formatted error reports via Gmail SMTP
- 🌐 **Selenium Grid API**: Proxy API for Selenium Grid status and session management
- 🔒 **Secure**: Uses Helmet for security headers and rate limiting
- 🎨 **HTML Templates**: Beautiful, responsive email templates
- 📊 **Health Checks**: Kubernetes-ready health and readiness endpoints
- 🔧 **ConfigMap Support**: Read credentials from Kubernetes ConfigMaps
- 🎯 **Unified Service**: Single backend for all API needs

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

### Health & Status

#### Health Check
```bash
GET /health
```
Returns service health status.

#### Readiness Check
```bash
GET /ready
```
Verifies SMTP connection and returns readiness status.

---

### Email Service

#### Send Error Report
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

**Response:**
```json
{
  "success": true,
  "message": "Error report sent successfully",
  "messageId": "<message-id>"
}
```

#### Send Test Email
```bash
POST /send-test-email
Content-Type: application/json

{
  "recipient": "test@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully",
  "messageId": "<message-id>"
}
```

---

### Selenium Grid API

#### Get Grid Status
```bash
GET /api/selenium-grid/status
```

Returns comprehensive Selenium Grid status including nodes, active sessions, and statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "nodes": [...],
    "sessions": [...],
    "statistics": {
      "totalNodes": 5,
      "totalSlots": 20,
      "activeSessions": 3,
      "availableSlots": 17
    },
    "gridUrl": "http://10.160.24.88:4444",
    "vncPassword": "secret"
  }
}
```

#### Delete Session
```bash
DELETE /api/selenium-grid/session/:sessionId
```

Terminates a specific Selenium session by ID.

**Response:**
```json
{
  "success": true,
  "message": "Session abc123 deleted successfully"
}
```

#### VNC WebSocket Proxy
```bash
GET /api/selenium-grid/session/:sessionId/se/vnc
```

WebSocket proxy for VNC connections (not yet implemented).

## Environment Variables

### General
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8309` |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `*` |

### Email Service Configuration
| Variable | Description | Default |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_SECURE` | Use TLS (true for 465) | `false` |
| `SMTP_USER` | Gmail email address | *Required* |
| `SMTP_PASS` | Gmail app password | *Required* |
| `DEFAULT_RECIPIENT` | Default email recipient | `ljiahao@fortinet.com` |

### Selenium Grid Configuration
| Variable | Description | Default |
|----------|-------------|---------|
| `SELENIUM_GRID_URL` | Selenium Grid hub URL | `http://10.160.24.88:4444` |
| `VNC_PASSWORD` | VNC password for remote viewing | `secret` |

## Gmail App Password Setup

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification**
3. Scroll to **App passwords**
4. Generate a new app password for "Mail"
5. Use this password in `SMTP_PASS` environment variable

## Testing

### Email Service Tests

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

### Selenium Grid API Tests

Test the Selenium Grid API:

```bash
# Check health
curl http://localhost:8309/health

# Get grid status
curl http://localhost:8309/api/selenium-grid/status

# Delete a session (replace with actual session ID)
curl -X DELETE http://localhost:8309/api/selenium-grid/session/abc123
```

## Project Structure

```
backend/
├── src/
│   ├── server.ts               # Unified Express server with all API routes
│   │                           # - Email service endpoints
│   │                           # - Selenium Grid proxy endpoints
│   │                           # - Health/readiness checks
│   ├── emailService.ts         # Email sending logic with Nodemailer
│   └── selenium-grid-server.ts # [DEPRECATED] Standalone grid server (merged into server.ts)
├── dist/                       # Compiled JavaScript (generated)
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript configuration
├── .env.example               # Environment template
├── Dockerfile                 # Docker build configuration
├── Makefile                   # Build and deployment automation
└── README.md                  # This file
```

## Security Notes

- Never commit `.env` files with real credentials
- Use Kubernetes Secrets or ConfigMaps for production
- Rate limiting is enabled (100 requests per 15 minutes)
- CORS can be restricted via `ALLOWED_ORIGINS`

## License

MIT
