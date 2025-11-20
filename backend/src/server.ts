import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
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
      console.log('  QA Cloud Portal - Email Service');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`  🚀 Server running on port ${PORT}`);
      console.log(`  📧 SMTP Server: ${SMTP_HOST}:${SMTP_PORT}`);
      console.log(`  📮 From Address: ${SMTP_USER}`);
      console.log(`  📬 Default Recipient: ${DEFAULT_RECIPIENT}`);
      console.log(`  🔒 SMTP Secure: ${SMTP_SECURE}`);
      console.log('');
      console.log('  Endpoints:');
      console.log(`    GET  /health              - Health check`);
      console.log(`    GET  /ready               - Readiness check (SMTP verification)`);
      console.log(`    POST /send-error-report   - Send error report email`);
      console.log(`    POST /send-test-email     - Send test email`);
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
