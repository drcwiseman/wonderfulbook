import { Request, Response, NextFunction } from 'express';

export const reportsAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Reports"');
    return res.status(401).json({ error: 'Authorization required' });
  }

  const credentials = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  const expectedUsername = process.env.REPORTS_USER || 'checks';
  const expectedPassword = process.env.REPORTS_PASS || 'change_me_strong';

  if (username !== expectedUsername || password !== expectedPassword) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Reports"');
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  next();
};