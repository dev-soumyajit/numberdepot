/* eslint-disable @typescript-eslint/no-namespace */

// Override Express query/params types for cleaner route handlers
declare module 'express-serve-static-core' {
  interface ParamsDictionary {
    [key: string]: string;
  }

  interface Query {
    [key: string]: string | undefined;
  }
}

declare namespace Express {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}

export {};
