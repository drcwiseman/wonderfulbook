import express from "express";
import path from "path";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Simple production configuration test
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Is Production: ${isProduction}`);

app.get('/', (req, res) => {
  res.json({ 
    message: 'Server running successfully', 
    environment: process.env.NODE_ENV,
    isProduction: isProduction,
    nodeEnvConfigured: true
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const port = parseInt(process.env.PORT || '5000', 10);
app.listen(port, '0.0.0.0', () => {
  console.log(`Simple test server running on port ${port}`);
  console.log(`Production mode: ${isProduction}`);
});