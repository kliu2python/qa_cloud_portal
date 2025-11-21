# Selenium Grid Backend Proxy

A backend service that proxies requests to a Selenium Grid with proper CORS configuration for the QA Cloud Portal frontend.

## Overview

This service acts as a middleware between the QA Cloud Portal frontend and a Selenium Grid instance. It provides:

- **CORS Support**: Allows the frontend (running on `localhost:3000` or other origins) to communicate with the Selenium Grid
- **API Endpoints**: RESTful API for fetching grid status and managing sessions
- **Grid Status Transformation**: Converts Selenium Grid's status format to a frontend-friendly format
- **Session Management**: Proxy for creating and deleting browser sessions

## Why This Service?

The Selenium Grid doesn't natively support CORS, which blocks browser-based frontends from making direct requests. This proxy:

1. Adds proper CORS headers to allow cross-origin requests
2. Provides a cleaner API interface
3. Transforms Selenium Grid responses to match frontend expectations
4. Handles errors gracefully

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.selenium-grid.example .env.selenium-grid
```

Edit `.env.selenium-grid`:

```env
PORT=31590
SELENIUM_GRID_URL=http://10.160.24.88:4444  # Your Selenium Grid URL
ALLOWED_ORIGINS=http://localhost:3000
VNC_PASSWORD=secret
```

### 3. Run the Service

**Development mode** (with auto-reload):
```bash
npm run dev:grid
```

**Production mode**:
```bash
npm run build
npm run start:grid
```

## API Endpoints

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "service": "Selenium Grid Backend Proxy",
  "timestamp": "2025-11-21T00:00:00.000Z",
  "uptime": 123.456
}
```

### GET /api/status
Get grid status including active sessions and available nodes

**Response:**
```json
{
  "success": true,
  "data": {
    "nodes": [...],
    "sessions": [...],
    "statistics": {
      "totalNodes": 3,
      "totalSlots": 12,
      "activeSessions": 2,
      "availableSlots": 10
    },
    "gridUrl": "http://10.160.24.88:4444",
    "vncPassword": "secret"
  }
}
```

### DELETE /api/session/:sessionId
Delete/kill a browser session

**Response:**
```json
{
  "success": true,
  "message": "Session abc123 deleted successfully"
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Port for the proxy server | `31590` |
| `SELENIUM_GRID_URL` | URL of the Selenium Grid | `http://10.160.24.88:4444` |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed origins | `http://localhost:3000` |
| `VNC_PASSWORD` | Password for VNC sessions | `secret` |

## CORS Configuration

The service allows cross-origin requests from:
- `http://localhost:3000` (development frontend)
- Any origins specified in `ALLOWED_ORIGINS`

You can use `ALLOWED_ORIGINS=*` to allow all origins (not recommended for production).

## Troubleshooting

### CORS Errors Persist

1. Check that `ALLOWED_ORIGINS` includes your frontend URL
2. Restart the backend service after changing environment variables
3. Clear browser cache and reload the frontend

### Cannot Connect to Selenium Grid

1. Verify `SELENIUM_GRID_URL` is correct
2. Check that the Selenium Grid is running:
   ```bash
   curl http://10.160.24.88:4444/status
   ```
3. Ensure network connectivity between the proxy and the grid

### 404 Errors

1. Make sure the frontend is using the correct backend URL
2. Check `config.ts` in the frontend:
   ```typescript
   seleniumGridBackendUrl: 'http://localhost:31590'
   ```

## Development

To run both services simultaneously:

```bash
# Terminal 1: Email service
npm run dev

# Terminal 2: Selenium Grid proxy
npm run dev:grid
```

## Production Deployment

See the main [DEPLOYMENT.md](../DEPLOYMENT.md) for Kubernetes deployment instructions.

Quick build:
```bash
npm run build
```

This compiles both services to the `dist/` directory.
