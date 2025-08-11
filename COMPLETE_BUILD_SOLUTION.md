# Complete Build & Deploy Solution

## 🚀 Updated Package.json Scripts Section

Replace your current `scripts` section in `package.json` with:

```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "node scripts/build-production.js",
    "start": "node scripts/start-production.js",
    "build:frontend": "cd client && npm run build",
    "build:backend": "esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=server/dist",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  }
}
```

## 📁 .replit File Configuration

Your `.replit` file is already correctly configured:

```toml
modules = ["nodejs-20", "web", "postgresql-16"]
run = "npm run dev"

[deployment]
deploymentTarget = "cloudrun"
build = ["npm", "run", "build"]
run = ["npm", "run", "start"]

[env]
PORT = "5000"
```

## ⚙️ Express Static Serving + History Fallback Code

Add this to your `server/production.ts` file (already created):

```typescript
import express, { type Express } from "express";
import path from "path";
import fs from "fs";

export function setupProductionServing(app: Express) {
  const publicPath = path.resolve(import.meta.dirname, "public");
  const indexPath = path.resolve(publicPath, "index.html");

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

  // Serve static assets with proper caching headers
  app.use(express.static(publicPath, {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
    index: false // Disable automatic index.html serving for directories
  }));

  // Handle all non-API routes by serving index.html for React Router
  // This ensures routes like /auth/reset-password and /verify-email work correctly
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(indexPath);
  });

  console.log('✅ Production static serving configured with React Router support');
}
```

## 🔧 Build Process Summary

The new build process does exactly what you requested:

1. **Builds React Frontend**: `cd client && npm run build`
2. **Copies Build Files**: Copies `client/dist` to `server/public`
3. **Builds Backend**: Compiles TypeScript to `server/dist/index.js`
4. **Runs in Production**: Forces `NODE_ENV=production` and serves from built files
5. **React Router Support**: Serves `index.html` for all non-API routes

## 🎯 Email Reset & Verification Fix

With this configuration:
- `/auth/reset-password?token=...` will serve your React app
- `/verify-email?token=...` will serve your React app  
- React Router handles the routing client-side
- Never returns "Not Found" for frontend routes

## ⚡ How to Deploy

1. **For Development**: `npm run dev` (unchanged)
2. **For Production Build**: `npm run build` 
3. **For Production Run**: `npm run start`
4. **For Replit Deployment**: Click Deploy button (uses the .replit config)

Your email reset and verification links will work correctly after deployment!