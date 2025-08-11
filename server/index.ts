import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up EJS for health dashboard templates
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

// Cloud Run environment variable validation
const requiredEnvVars = ['DATABASE_URL', 'STRIPE_SECRET_KEY'];
const missingVars = requiredEnvVars.filter(env => !process.env[env]);
if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars);
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
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

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    
    // Start listening FIRST before heavy initialization
    // Cloud Run compatibility: bind to all interfaces
    server.listen(port, "0.0.0.0", async () => {
      log(`serving on port ${port}`);
      
      // Production deployment readiness confirmation
      if (process.env.NODE_ENV === 'production') {
        console.log('🚀 PRODUCTION DEPLOYMENT READY');
        console.log(`✅ Server listening on 0.0.0.0:${port}`);
        console.log('✅ Health endpoints available at /health, /ping, /healthz');
        console.log('✅ Cloud Run compatible configuration active');
        
        // Signal deployment readiness to Cloud Run
        console.log('READY FOR TRAFFIC');
      }
      
      // Now perform heavy initialization after server is listening
      // Cloud Run optimization: only start heavy services in production after traffic readiness
      if (process.env.NODE_ENV !== 'production') {
        console.log('Development mode: Starting all background services...');
        await initializeBackgroundServices();
      } else {
        // In production, defer heavy initialization to allow Cloud Run health checks
        console.log('Production mode: Deferring background services to allow traffic...');
        setTimeout(async () => {
          console.log('Starting background services after deployment initialization...');
          await initializeBackgroundServices();
        }, 2000); // 2-second delay for Cloud Run
      }
      
      console.log('🚀 Server initialization complete');
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

// Background service initialization function
async function initializeBackgroundServices() {
  // Initialize crypto system
  try {
    const { initializeCrypto } = await import('./crypto.js');
    await initializeCrypto();
    console.log('✅ Crypto system initialized');
  } catch (error) {
    console.error('❌ Failed to initialize crypto system:', error);
  }

  // Initialize email scheduler for automated campaigns
  try {
    const { emailScheduler } = await import('./emailScheduler.js');
    await emailScheduler.initialize();
    console.log('✅ Email scheduler initialized');
  } catch (error) {
    console.error('❌ Failed to initialize email scheduler:', error);
  }

  // Initialize health monitoring scheduler
  try {
    const { startHealthScheduler } = await import('./health/scheduler.js');
    startHealthScheduler();
    console.log('✅ Health monitoring scheduler started');
  } catch (error) {
    console.error('❌ Failed to initialize health monitoring scheduler:', error);
  }
  
  console.log('🚀 All background services initialized');
}
