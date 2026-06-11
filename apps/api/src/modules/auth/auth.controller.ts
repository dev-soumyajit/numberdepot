import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { apiResponse } from '../../utils/helpers';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json(apiResponse(result, 'Registration successful'));
    } catch (error) { next(error); }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.json(apiResponse(result, 'Login successful'));
    } catch (error) { next(error); }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshToken(refreshToken);
      res.json(apiResponse(result, 'Token refreshed'));
    } catch (error) { next(error); }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      await AuthService.logout(refreshToken);
      res.json(apiResponse(null, 'Logged out successfully'));
    } catch (error) { next(error); }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await AuthService.forgotPassword(req.body.email);
      res.json(apiResponse(null, 'If the email exists, a reset link has been sent'));
    } catch (error) { next(error); }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      await AuthService.resetPassword(req.body.token, req.body.password);
      res.json(apiResponse(null, 'Password reset successful'));
    } catch (error) { next(error); }
  }

  static async adminSetup(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.adminSetup(req.body);
      res.status(201).json(apiResponse(result, 'Admin account created'));
    } catch (error) { next(error); }
  }

  static async checkAdminExists(req: Request, res: Response, next: NextFunction) {
    try {
      const exists = await AuthService.checkAdminExists();
      res.json(apiResponse({ exists }));
    } catch (error) { next(error); }
  }
}
