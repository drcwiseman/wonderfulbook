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