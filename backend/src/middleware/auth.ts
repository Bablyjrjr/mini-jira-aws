import { Request, Response, NextFunction } from 'express';
import jwt, { JwtHeader, JwtPayload, SigningKeyCallback, VerifyOptions } from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';

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

const jwksClient = jwksUri
  ? jwksRsa({
      jwksUri,
      cache: true,
      cacheMaxEntries: 5,
      cacheMaxAge: 10 * 60 * 1000,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    })
  : null;

type CognitoPayload = JwtPayload & {
  sub: string;
  email: string;
  name?: string;
  aud?: string;
  client_id?: string;
  'custom:role'?: 'Manager' | 'Employee' | 'Admin';
  'custom:teamId'?: string;
};

function getSigningKey(header: JwtHeader, callback: SigningKeyCallback) {
  if (!jwksClient) {
    callback(new Error('JWKS client is not configured'));
    return;
  }

  if (!header.kid) {
    callback(new Error('Token header is missing kid'));
    return;
  }

  jwksClient.getSigningKey(header.kid, (error, key) => {
    if (error || !key) {
      callback(error || new Error('Unable to fetch signing key'));
      return;
    }

    callback(null, key.getPublicKey());
  });
}

export async function authenticateJwt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing authorization header' });
  }

  if (!jwksClient || !clientId) {
    console.error('JWT verification is not configured');
    return res.status(500).json({ message: 'Authentication is not configured' });
  }

  const token = authHeader.substring(7);
  try {
    const verifyOptions: VerifyOptions = {
      algorithms: ['RS256'],
      audience: clientId,
    };
    if (issuer) {
      verifyOptions.issuer = issuer;
    }

    const payload = await new Promise<CognitoPayload>((resolve, reject) => {
      jwt.verify(token, getSigningKey, verifyOptions, (error, decoded) => {
        if (error) {
          reject(error);
          return;
        }
        if (!decoded || typeof decoded === 'string') {
          reject(new Error('Invalid token payload'));
          return;
        }
        resolve(decoded as CognitoPayload);
      });
    });

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
