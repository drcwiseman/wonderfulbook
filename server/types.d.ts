import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    [key: string]: any;
  }
}

declare module 'connect-pg-simple' {
  import { Store } from 'express-session';
  
  interface ConnectPgSimpleOptions {
    conString?: string;
    createTableIfMissing?: boolean;
    ttl?: number;
    tableName?: string;
  }
  
  function connectPgSimple(session: any): {
    new (options: ConnectPgSimpleOptions): Store;
  };
  
  export = connectPgSimple;
}

declare global {
  namespace Express {
    interface Request {
      session: import('express-session').Session & Partial<import('express-session').SessionData>;
      sessionID: string;
    }
  }
}