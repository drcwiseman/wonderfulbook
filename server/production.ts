import express, { type Express } from "express";
import path from "path";
import fs from "fs";

export function setupProductionServing(app: Express) {
  // Handle both running from root and from server directory
  const isInServerDir = process.cwd().endsWith('server');
  const publicPath = isInServerDir 
    ? path.resolve(process.cwd(), "public")
    : path.resolve(process.cwd(), "server", "public");
  const indexPath = path.resolve(publicPath, "index.html");
  
  // CRITICAL FIX: Setup uploads directory for production
  // Check multiple possible upload locations
  const possibleUploadPaths = [
    isInServerDir ? path.resolve(process.cwd(), "uploads") : path.resolve(process.cwd(), "uploads"),
    isInServerDir ? path.resolve(process.cwd(), "..", "uploads") : path.resolve(process.cwd(), "server", "uploads"),
    path.resolve(process.cwd(), "uploads"),
    path.resolve(process.cwd(), "server", "uploads")
  ];
  
  let uploadsPath = possibleUploadPaths[0];
  for (const testPath of possibleUploadPaths) {
    if (fs.existsSync(testPath)) {
      uploadsPath = testPath;
      console.log(`✅ Found uploads directory at: ${uploadsPath}`);
      break;
    }
  }
  
  // If no uploads directory exists, create one in the expected location
  if (!fs.existsSync(uploadsPath)) {
    console.log(`📁 Creating uploads directory at: ${uploadsPath}`);
    fs.mkdirSync(uploadsPath, { recursive: true });
    
    // Create subdirectories for different file types
    const subdirs = ['images', 'pdfs', 'documents'];
    subdirs.forEach(subdir => {
      const subdirPath = path.join(uploadsPath, subdir);
      if (!fs.existsSync(subdirPath)) {
        fs.mkdirSync(subdirPath, { recursive: true });
        console.log(`📁 Created subdirectory: ${subdirPath}`);
      }
    });
  }
  
  console.log(`📤 Uploads path resolved to: ${uploadsPath}`);

  if (!fs.existsSync(publicPath)) {
    throw new Error(
      `Could not find the build directory: ${publicPath}, make sure to build the client first`,
    );
  }

  if (!fs.existsSync(indexPath)) {
    throw new Error(
      `Could not find index.html: ${indexPath}, make sure the frontend is built`,
    );
  }

  console.log(`Serving static files from: ${publicPath}`);
  
  // CRITICAL FIX: Serve uploads directory with proper headers and fallback
  app.use('/uploads', (req, res, next) => {
    // Remove excessive debug logging in production
    const requestedFile = path.join(uploadsPath, req.path);
    
    // Check if file exists, if not and it's in /images/, try parent directory
    if (!fs.existsSync(requestedFile) && req.path.startsWith('/images/')) {
      const fallbackFile = path.join(uploadsPath, req.path.substring('/images/'.length));
      if (fs.existsSync(fallbackFile)) {
        console.log(`📷 Image fallback: ${req.path} → ${fallbackFile}`);
        req.url = req.path.substring('/images/'.length);
      }
    }
    
    next();
  }, express.static(uploadsPath, {
    maxAge: '1d', // Cache uploaded files for 1 day
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      console.log(`🔥 PRODUCTION UPLOADS DEBUG: Setting headers for: ${filePath}`);
      
      // Set proper CORS headers for all file types in production
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      
      // Set appropriate cache control and content type based on file type
      if (filePath.endsWith('.pdf')) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour for PDFs
        res.setHeader('Content-Disposition', 'inline'); // Allow inline viewing
      } else if (filePath.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        // Set proper image content types
        if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
          res.setHeader('Content-Type', 'image/jpeg');
        } else if (filePath.endsWith('.png')) {
          res.setHeader('Content-Type', 'image/png');
        } else if (filePath.endsWith('.gif')) {
          res.setHeader('Content-Type', 'image/gif');
        } else if (filePath.endsWith('.webp')) {
          res.setHeader('Content-Type', 'image/webp');
        }
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours for images
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour for other files
      }
    }
  }));
  
  console.log(`✅ Production uploads served from: ${uploadsPath}`);

  // Enhanced caching strategy for different asset types
  app.use('/assets', express.static(path.join(publicPath, 'assets'), {
    maxAge: '1y', // Aggressive caching for hashed assets (JS/CSS)
    etag: true,
    lastModified: true,
    immutable: true,
    setHeaders: (res, path) => {
      if (path.endsWith('.js') || path.endsWith('.css')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));

  // Cache images and other media for 30 days
  app.use('/images', express.static(path.join(publicPath, 'images'), {
    maxAge: '30d',
    etag: true,
    lastModified: true
  }));

  // Cache SVG icons and social images for 7 days
  app.use('/', express.static(publicPath, {
    maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
    index: false, // Disable automatic index.html serving for directories
    setHeaders: (res, path) => {
      if (path.endsWith('.svg')) {
        res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 days
      } else if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));

  // Handle all non-API routes by serving index.html for React Router
  // This ensures routes like /auth/reset-password and /verify-email work correctly
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(indexPath);
  });

  console.log('✅ Production static serving configured with React Router support');
}