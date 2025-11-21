import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import axios from 'axios';

// Load environment variables
const PORT = process.env.PORT || 31590;
const SELENIUM_GRID_URL = process.env.SELENIUM_GRID_URL || 'http://10.160.24.88:4444';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://10.160.24.88:30000'];
const VNC_PASSWORD = process.env.VNC_PASSWORD || 'secret';

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration - Allow requests from frontend
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - Origin: ${req.headers.origin || 'N/A'}`);
  next();
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'Selenium Grid Backend Proxy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Grid status endpoint - Fetches status from Selenium Grid and transforms it
app.get('/api/status', async (req: Request, res: Response) => {
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
app.delete('/api/session/:sessionId', async (req: Request, res: Response) => {
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
app.get('/session/:sessionId/se/vnc', (req: Request, res: Response) => {
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
    path: req.path,
    availableEndpoints: [
      'GET /health',
      'GET /api/status',
      'DELETE /api/session/:sessionId'
    ]
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
    app.listen(PORT, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('  Selenium Grid Backend Proxy');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`  🚀 Server running on port ${PORT}`);
      console.log(`  🌐 Selenium Grid URL: ${SELENIUM_GRID_URL}`);
      console.log(`  🔓 Allowed Origins: ${ALLOWED_ORIGINS.join(', ')}`);
      console.log(`  🔐 VNC Password: ${VNC_PASSWORD}`);
      console.log('');
      console.log('  Endpoints:');
      console.log(`    GET    /health                      - Health check`);
      console.log(`    GET    /api/status                  - Get grid status`);
      console.log(`    DELETE /api/session/:sessionId      - Delete session`);
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
