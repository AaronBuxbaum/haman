import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

export interface AuthToken {
  userId: string;
  email: string;
}

/**
 * Authentication service for user security
 */
export class AuthService {
  private jwtSecret: string;
  private tokenExpiry: string;

  constructor(config?: { jwtSecret?: string; tokenExpiry?: string }) {
    this.jwtSecret = config?.jwtSecret || process.env.JWT_SECRET || 'haman-default-secret-change-in-production';
    this.tokenExpiry = config?.tokenExpiry || '7d';
  }

  /**
   * Hash a plain text password
   */
  async hashPassword(plainPassword: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(plainPassword, saltRounds);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Generate JWT token for authenticated user
   */
  generateToken(payload: AuthToken): string {
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.tokenExpiry
    } as jwt.SignOptions);
  }

  /**
   * Verify and decode JWT token
   */
  verifyToken(token: string): AuthToken | null {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as AuthToken;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}
