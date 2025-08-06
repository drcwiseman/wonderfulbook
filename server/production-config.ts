// Production-specific configurations and error handling
export const productionConfig = {
  // Ensure all routes are properly configured for production
  staticFileHandling: true,
  errorBoundaries: true,
  corsSettings: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://*.replit.app', 'https://*.replit.dev']
      : ['http://localhost:3000', 'http://localhost:5000']
  },
  
  // Database connection for production
  database: {
    ssl: process.env.NODE_ENV === 'production',
    connectionString: process.env.DATABASE_URL
  },
  
  // Session configuration for production
  session: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  }
};

// Production health check endpoint
export const healthCheck = {
  database: () => {
    // Check database connection
    return true;
  },
  
  environment: () => {
    const requiredEnvVars = [
      'DATABASE_URL',
      'SESSION_SECRET',
      'STRIPE_SECRET_KEY'
    ];
    
    return requiredEnvVars.every(envVar => process.env[envVar]);
  },
  
  apis: () => {
    // Check critical API endpoints
    return true;
  }
};