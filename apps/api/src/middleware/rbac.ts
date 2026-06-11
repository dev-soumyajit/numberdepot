import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { ForbiddenError } from '../utils/errors';

export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError('Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Role '${req.user.role}' does not have access to this resource`));
    }
    next();
  };
};

export const requireAdmin = requireRole('admin', 'super_admin');
export const requireSeller = requireRole('seller', 'admin', 'super_admin');
export const requireBuyer = requireRole('buyer', 'seller', 'admin', 'super_admin');
