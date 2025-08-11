import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { setupProductionServing } from "./production.js";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up EJS for health dashboard templates
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

// Cloud Run environment variable validation - simplified for deployment
const requiredEnvVars = ['DATABASE_URL'];
const missingVars = requiredEnvVars.filter(env => !process.env[env]);
if (missingVars.length > 0 && process.env.NODE_ENV === 'production') {
  console.error('Missing required environment variables:', missingVars);
  process.exit(1);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Simple health endpoints are now handled in routes.ts before heavy initialization

(async () => {
  try {
    console.log('Starting route registration...');
    const server = await registerRoutes(app);
    console.log('Route registration complete');

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // Setup static file serving and routing
    const isProduction = process.env.NODE_ENV === "production";
    console.log(`Environment check: NODE_ENV=${process.env.NODE_ENV}, isProduction=${isProduction}`);
    
    if (isProduction) {
      console.log('Serving static files from production build...');
      setupProductionServing(app);
    } else {
      console.log('Setting up Vite development server...');
      await setupVite(app, server);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    
    // Start listening FIRST before heavy initialization
    // Cloud Run compatibility: bind to all interfaces
    server.listen(port, "0.0.0.0", async () => {
      // Minimal logging for Cloud Run compatibility
      if (process.env.NODE_ENV === 'production') {
        console.log('SERVER_READY');
        console.log(`PORT:${port}`);
        // Immediately defer background services to ensure quick startup
        setImmediate(async () => {
          try {
            await initializeBackgroundServices();
          } catch (error) {
            console.error('Background services failed:', error);
          }
        });
      } else {
        log(`serving on port ${port}`);
        console.log('Development mode: Starting all background services...');
        await initializeBackgroundServices();
        console.log('🚀 Server initialization complete');
      }
    });
    
    // Graceful shutdown handling for production deployments
    const gracefulShutdown = (signal: string) => {
      console.log(`Received ${signal}. Graceful shutdown...`);
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };
    
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    console.error('Server initialization failed:', error);
    process.exit(1);
  }
})().catch((error) => {
  console.error('Unhandled async error in server initialization:', error);
  process.exit(1);
});

// Background service initialization function - Cloud Run optimized
async function initializeBackgroundServices() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Parallel initialization for faster startup
  const initPromises = [];
  
  // Initialize crypto system
  initPromises.push(
    (async () => {
      try {
        const { initializeCrypto } = await import('./crypto.js');
        await initializeCrypto();
        if (!isProduction) console.log('✅ Crypto system initialized');
      } catch (error) {
        console.error('Crypto init failed:', error);
      }
    })()
  );

  // Initialize email scheduler for automated campaigns - only if SMTP configured
  if (process.env.SMTP_HOST || process.env.SMTP_SERVICE) {
    initPromises.push(
      (async () => {
        try {
          const { emailScheduler } = await import('./emailScheduler.js');
          await emailScheduler.initialize();
          if (!isProduction) console.log('✅ Email scheduler initialized');
        } catch (error) {
          console.error('Email scheduler init failed:', error);
        }
      })()
    );
  }

  // Initialize health monitoring scheduler
  initPromises.push(
    (async () => {
      try {
        const { startHealthScheduler } = await import('./health/scheduler.js');
        startHealthScheduler();
        if (!isProduction) console.log('✅ Health monitoring scheduler started');
      } catch (error) {
        console.error('Health scheduler init failed:', error);
      }
    })()
  );
  
  // Wait for all services with timeout
  try {
    await Promise.allSettled(initPromises);
    if (!isProduction) console.log('🚀 All background services initialized');
  } catch (error) {
    console.error('Background service initialization error:', error);
  }
}
