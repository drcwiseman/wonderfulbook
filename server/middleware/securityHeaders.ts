import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      manifestSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Vite dev mode
        "'unsafe-eval'", // Required for Vite dev mode
        "https://js.stripe.com",
        "https://cdn.jsdelivr.net", // For PDF.js CDN fallback
        "https://replit.com", // For Replit dev banner
        "https://*.replit.com", // For Replit services
        "https://*.replit.dev" // For development domains
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for Tailwind/styled components
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "data:"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "blob:",
        "https://*.stripe.com"
      ],
      connectSrc: [
        "'self'",
        "https://api.stripe.com",
        "wss://localhost:*", // For Vite HMR
        "ws://localhost:*",   // For Vite HMR
        "https://*.replit.com", // For Replit services
        "https://*.replit.dev", // For development domains
        "wss://*.replit.dev", // For WebSocket connections
        "ws://*.replit.dev"   // For WebSocket connections
      ],
      frameSrc: [
        "'self'",
        "https://js.stripe.com",
        "https://hooks.stripe.com"
      ],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false, // Required for PDF.js/WASM
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
});

// Additional security headers middleware
export const additionalSecurityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  next();
};