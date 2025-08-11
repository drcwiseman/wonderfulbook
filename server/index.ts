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
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, async () => {
      log(`serving on port ${port}`);
      
      // Now perform heavy initialization after server is listening
      console.log('Server listening, starting background initialization...');
      
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
    });
    
  } catch (error) {
    console.error('Server initialization failed:', error);
    process.exit(1);
  }
})().catch((error) => {
  console.error('Unhandled async error in server initialization:', error);
  process.exit(1);
});
