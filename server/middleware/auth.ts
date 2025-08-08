import { RequestHandler } from "express";

/**
 * Unified authentication middleware for session-based authentication
 * Handles both local session authentication and provides debugging capabilities
 */
export const isAuthenticated: RequestHandler = (req: any, res, next) => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Check for session and user data
  if (!req.session || !req.session.user) {
    console.log('Authentication failed: No session or user data');
    return res.status(401).json({ 
      message: "Unauthorized",
      debug: isProduction ? undefined : {
        hasSession: !!req.session,
        sessionId: req.sessionID,
        sessionData: req.session
      }
    });
  }
  
  // Set user object with both session data and claims structure for compatibility
  req.user = {
    ...req.session.user,
    // Add claims structure for backward compatibility with Replit auth code
    claims: {
      sub: req.session.user.id,
      email: req.session.user.email,
      first_name: req.session.user.firstName,
      last_name: req.session.user.lastName,
      profile_image_url: req.session.user.profileImageUrl
    }
  };
  
  next();
};

/**
 * Admin role checking middleware
 * Checks if the authenticated user has admin privileges
 */
export const requireAdmin: RequestHandler = (req: any, res, next) => {
  // First check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Check for admin role or specific admin emails
  const isAdmin = req.user.role === 'admin' || 
                  req.user.role === 'super_admin' ||
                  req.user.email === 'admin@wonderfulbooks.com' ||
                  req.user.email === 'prophetclimate@yahoo.com';
  
  if (!isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  
  next();
};

/**
 * Super admin role checking middleware
 * Checks if the authenticated user has super admin privileges
 */
export const requireSuperAdmin: RequestHandler = (req: any, res, next) => {
  // First check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  // Check for super admin role or specific super admin emails
  const isSuperAdmin = req.user.role === 'super_admin' ||
                       req.user.email === 'prophetclimate@yahoo.com';
  
  if (!isSuperAdmin) {
    return res.status(403).json({ message: "Super admin access required" });
  }
  
  next();
};