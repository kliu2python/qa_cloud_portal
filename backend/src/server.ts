import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import axios from 'axios';
import { EmailService, ErrorReportEmail } from './emailService';

// Load environment variables
const PORT = process.env.PORT || 8309;
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const DEFAULT_RECIPIENT = process.env.DEFAULT_RECIPIENT || 'ljiahao@fortinet.com';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];

// Selenium Grid configuration
const SELENIUM_GRID_URL = process.env.SELENIUM_GRID_URL || 'http://10.160.24.88:4444';
const VNC_PASSWORD = process.env.VNC_PASSWORD || 'secret';

// Validate required environment variables
if (!SMTP_USER || !SMTP_PASS) {
  console.error('❌ ERROR: SMTP_USER and SMTP_PASS environment variables are required!');
  console.error('Please set these in your ConfigMap or environment.');
  process.exit(1);
}

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: ALLOWED_ORIGINS[0] === '*' ? '*' : ALLOWED_ORIGINS,
  methods: ['GET', 'POST'],
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Initialize Email Service
const emailService = new EmailService({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS
  }
});

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'QA Cloud Portal Email Service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Ready check endpoint (includes SMTP verification)
app.get('/ready', async (req: Request, res: Response) => {
  try {
    const isReady = await emailService.verifyConnection();

    if (isReady) {
      res.json({
        status: 'ready',
        smtp: 'connected',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        smtp: 'disconnected',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      smtp: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

// Send error report endpoint
app.post('/send-error-report', async (req: Request, res: Response) => {
  try {
    const { title, content, category, recipient } = req.body;

    // Validate required fields
    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: title, content, and category are required'
      });
    }

    // Prepare error report with sender information
    const errorReport: ErrorReportEmail = {
      title,
      content,
      category,
      recipient: recipient || DEFAULT_RECIPIENT,
      senderInfo: {
        ip: req.ip || req.headers['x-forwarded-for'] as string || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
        timestamp: new Date().toISOString()
      }
    };

    // Send email
    const result = await emailService.sendErrorReport(errorReport);

    if (result.success) {
      res.json({
        success: true,
        message: 'Error report sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send error report'
      });
    }
  } catch (error) {
    console.error('Error in /send-error-report endpoint:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// Test email endpoint (for debugging/testing)
app.post('/send-test-email', async (req: Request, res: Response) => {
  try {
    const { recipient } = req.body;

    if (!recipient) {
      return res.status(400).json({
        success: false,
        error: 'Recipient email address is required'
      });
    }

    const result = await emailService.sendTestEmail(recipient);

    if (result.success) {
      res.json({
        success: true,
        message: 'Test email sent successfully',
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send test email'
      });
    }
  } catch (error) {
    console.error('Error in /send-test-email endpoint:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

// ============================================================================
// SELENIUM GRID API ENDPOINTS
// ============================================================================

// Grid status endpoint - Fetches status from Selenium Grid and transforms it
app.get('/api/selenium-grid/status', async (req: Request, res: Response) => {
  try {
    console.log(`Fetching grid status from: ${SELENIUM_GRID_URL}/status`);

    // Fetch status from Selenium Grid
    const response = await axios.get(`${SELENIUM_GRID_URL}/status`, {
      timeout: 5000
    });

    const gridStatus = response.data;

    // Transform Selenium Grid status to our format
    const nodes = gridStatus.value?.nodes || [];
    const allSessions: any[] = [];

    // Extract all active sessions from nodes
    nodes.forEach((node: any) => {
      if (node.slots) {
        node.slots.forEach((slot: any) => {
          if (slot.session) {
            allSessions.push({
              sessionId: slot.session.sessionId,
              capabilities: slot.session.capabilities || slot.stereotype || {},
              nodeId: node.id,
              nodeUri: node.uri
            });
          }
        });
      }
    });

    // Calculate statistics
    const totalNodes = nodes.length;
    const totalSlots = nodes.reduce((sum: number, node: any) => sum + (node.slots?.length || 0), 0);
    const activeSessions = allSessions.length;
    const availableSlots = totalSlots - activeSessions;

    // Transform nodes to our format
    const transformedNodes = nodes.map((node: any) => ({
      id: node.id,
      uri: node.uri,
      availability: node.availability || 'UNKNOWN',
      slots: node.slots || []
    }));

    res.json({
      success: true,
      data: {
        nodes: transformedNodes,
        sessions: allSessions,
        statistics: {
          totalNodes,
          totalSlots,
          activeSessions,
          availableSlots
        },
        gridUrl: SELENIUM_GRID_URL,
        vncPassword: VNC_PASSWORD
      }
    });
  } catch (error: any) {
    console.error('Error fetching grid status:', error.message);

    // Return a friendly error response
    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        error: `Cannot connect to Selenium Grid at ${SELENIUM_GRID_URL}. Please ensure the grid is running.`,
        details: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch grid status',
        details: error.message
      });
    }
  }
});

// Delete session endpoint - Kills a session on the grid
app.delete('/api/selenium-grid/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    console.log(`Deleting session: ${sessionId}`);

    // Send DELETE request to Selenium Grid
    const response = await axios.delete(`${SELENIUM_GRID_URL}/session/${sessionId}`, {
      timeout: 5000
    });

    res.json({
      success: true,
      message: `Session ${sessionId} deleted successfully`,
      data: response.data
    });
  } catch (error: any) {
    console.error('Error deleting session:', error.message);

    if (error.response?.status === 404) {
      res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    } else if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        error: `Cannot connect to Selenium Grid at ${SELENIUM_GRID_URL}`
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to delete session',
        details: error.message
      });
    }
  }
});

// WebSocket proxy for VNC (if needed)
app.get('/api/selenium-grid/session/:sessionId/se/vnc', (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: 'VNC WebSocket proxy not yet implemented. Use direct connection to grid.'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
async function startServer() {
  try {
    // Verify SMTP connection on startup
    console.log('🔧 Verifying SMTP connection...');
    const isConnected = await emailService.verifyConnection();

    if (!isConnected) {
      console.warn('⚠️  WARNING: SMTP connection verification failed. Email service may not work correctly.');
    }

    app.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('  QA Cloud Portal - Unified Backend Service');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`  🚀 Server running on port ${PORT}`);
      console.log('');
      console.log('  📧 Email Service Configuration:');
      console.log(`     SMTP Server: ${SMTP_HOST}:${SMTP_PORT}`);
      console.log(`     From Address: ${SMTP_USER}`);
      console.log(`     Default Recipient: ${DEFAULT_RECIPIENT}`);
      console.log(`     SMTP Secure: ${SMTP_SECURE}`);
      console.log('');
      console.log('  🌐 Selenium Grid Configuration:');
      console.log(`     Grid URL: ${SELENIUM_GRID_URL}`);
      console.log(`     VNC Password: ${VNC_PASSWORD}`);
      console.log('');
      console.log('  API Endpoints:');
      console.log('');
      console.log('  Health & Status:');
      console.log(`    GET  /health                                 - Health check`);
      console.log(`    GET  /ready                                  - Readiness check (SMTP verification)`);
      console.log('');
      console.log('  Email Service:');
      console.log(`    POST /send-error-report                      - Send error report email`);
      console.log(`    POST /send-test-email                        - Send test email`);
      console.log('');
      console.log('  Selenium Grid:');
      console.log(`    GET    /api/selenium-grid/status             - Get grid status`);
      console.log(`    DELETE /api/selenium-grid/session/:sessionId - Delete session`);
      console.log(`    GET    /api/selenium-grid/session/:id/se/vnc - VNC WebSocket (not implemented)`);
      console.log('═══════════════════════════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();
