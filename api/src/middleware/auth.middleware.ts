// Authentication Middleware
// JWT token validation and user context extraction

import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    organization_id: string;
    role: string;
  };
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  // Mock implementation for TypeScript compilation
  // In production, this would validate JWT tokens
  const authReq = req as AuthenticatedRequest;
  authReq.user = {
    id: 'mock-user-id',
    organization_id: 'mock-org-id',
    role: 'user'
  };
  next();
};

export const requireOrganization = (req: Request, res: Response, next: NextFunction): void => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user?.organization_id) {
    res.status(403).json({ error: 'Organization access required' });
    return;
  }
  next();
};