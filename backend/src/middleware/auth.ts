import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    sub: string;
    email: string;
    role: 'Manager' | 'Employee' | 'Admin';
    teamId?: string;
    name?: string;
  };
}

const issuer = process.env.COGNITO_ISSUER || '';
const clientId = process.env.COGNITO_CLIENT_ID || '';
const jwksUri = process.env.COGNITO_JWKS_URI || '';

export async function authenticateJwt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing authorization header' });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || typeof decoded === 'string') {
      throw new Error('Invalid token');
    }

    const payload = decoded.payload as any;
    if (payload.aud !== clientId) {
      return res.status(401).json({ message: 'Invalid token audience' });
    }

    req.user = {
      sub: payload.sub,
      email: payload.email,
      role: payload['custom:role'] || 'Employee',
      teamId: payload['custom:teamId'],
      name: payload.name || payload.email,
    };

    next();
  } catch (error) {
    console.error('JWT verification failed', error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
}
