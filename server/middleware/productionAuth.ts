import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";

// Feature flags from environment variables
export const features = {
  EMAIL_VERIFICATION: process.env.ENABLE_EMAIL_VERIFICATION === "true",
  PASSWORD_RESET: process.env.ENABLE_PASSWORD_RESET === "true",
  ADMIN_RESET_TOKEN: process.env.ADMIN_RESET_TOKEN || ""
};

// Rate limiters for auth endpoints
export const registerRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 registration attempts per IP per window
  message: {
    error: "Too many registration attempts, please try again later",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes  
  max: 10, // 10 login attempts per IP per window
  message: {
    error: "Too many login attempts, please try again later",
    retryAfter: "15 minutes"
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Captcha verification middleware (Cloudflare Turnstile)
export const verifyCaptcha = async (req: Request, res: Response, next: NextFunction) => {
  const { captchaToken } = req.body;
  
  if (!captchaToken) {
    return res.status(400).json({ 
      ok: false, 
      error: "Captcha verification required" 
    });
  }

  // Skip captcha in development if no secret provided
  if (process.env.NODE_ENV === "development" && !process.env.TURNSTILE_SECRET) {
    console.log("⚠️  Captcha verification skipped in development mode");
    return next();
  }

  try {
    const secretKey = process.env.TURNSTILE_SECRET || process.env.HCAPTCHA_SECRET;
    
    if (!secretKey) {
      console.error("❌ No captcha secret key configured");
      return res.status(500).json({ 
        ok: false, 
        error: "Captcha service not configured" 
      });
    }

    // Verify with Cloudflare Turnstile or hCaptcha
    const verifyUrl = process.env.TURNSTILE_SECRET 
      ? "https://challenges.cloudflare.com/turnstile/v0/siteverify"
      : "https://hcaptcha.com/siteverify";

    const verifyResponse = await fetch(verifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: captchaToken,
        remoteip: req.ip || req.connection.remoteAddress || ""
      }),
    });

    const verifyData = await verifyResponse.json();
    
    if (!verifyData.success) {
      console.log("❌ Captcha verification failed:", verifyData);
      return res.status(400).json({ 
        ok: false, 
        error: "Captcha verification failed" 
      });
    }

    console.log("✅ Captcha verification successful");
    next();
  } catch (error) {
    console.error("❌ Captcha verification error:", error);
    return res.status(500).json({ 
      ok: false, 
      error: "Captcha verification service unavailable" 
    });
  }
};

// Admin token verification middleware
export const verifyAdminToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ 
      ok: false, 
      error: "Authorization header required" 
    });
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix
  
  if (!features.ADMIN_RESET_TOKEN || token !== features.ADMIN_RESET_TOKEN) {
    return res.status(403).json({ 
      ok: false, 
      error: "Invalid admin token" 
    });
  }

  next();
};

// Enhanced session middleware for production auth
export const requireProductionAuth = (req: any, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.user || !req.session.user.id) {
    return res.status(401).json({ 
      ok: false, 
      error: "Authentication required" 
    });
  }

  // Ensure user is active
  if (req.session.user.isActive === false) {
    return res.status(403).json({ 
      ok: false, 
      error: "Account is deactivated" 
    });
  }

  next();
};