import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { DataStore } from '../storage/DataStore';
import { AuthService } from '../auth/AuthService';
import { LotteryService } from '../lotteryService';

export interface WebServerConfig {
  port: number;
  dataStore: DataStore;
  authService: AuthService;
  lotteryService: LotteryService;
}

/**
 * Web server for Haman lottery application
 */
export class WebServer {
  private app: express.Application;
  private config: WebServerConfig;

  constructor(config: WebServerConfig) {
    this.config = config;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ status: 'healthy', timestamp: new Date().toISOString() });
    });

    // Auth routes
    this.app.post('/api/auth/register', this.handleRegister.bind(this));
    this.app.post('/api/auth/login', this.handleLogin.bind(this));

    // User routes (protected)
    this.app.get('/api/user/profile', this.authenticate.bind(this), this.handleGetProfile.bind(this));
    this.app.put('/api/user/profile', this.authenticate.bind(this), this.handleUpdateProfile.bind(this));
    this.app.put('/api/user/preferences', this.authenticate.bind(this), this.handleUpdatePreferences.bind(this));

    // Lottery routes (protected)
    this.app.get('/api/lottery/history', this.authenticate.bind(this), this.handleGetHistory.bind(this));
    this.app.post('/api/lottery/apply', this.authenticate.bind(this), this.handleApplyLottery.bind(this));
  }

  private async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;
    const token = this.config.authService.extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const decoded = this.config.authService.verifyToken(token);
    if (!decoded) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }

    // Attach user info to request
    (req as Request & { userId: string }).userId = decoded.userId;
    next();
  }

  private async handleRegister(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, firstName, lastName, preferences } = req.body;

      if (!email || !password || !preferences) {
        res.status(400).json({ error: 'Email, password, and preferences are required' });
        return;
      }

      // Check if user already exists
      const existingUser = await this.config.dataStore.findUserByEmailAddress(email);
      if (existingUser) {
        res.status(409).json({ error: 'User with this email already exists' });
        return;
      }

      // Hash password
      const passwordHash = await this.config.authService.hashPassword(password);

      // Create user
      const user = await this.config.dataStore.persistUser({
        email,
        passwordHash,
        firstName,
        lastName,
        preferences
      });

      // Generate token
      const token = this.config.authService.generateToken({
        userId: user.id,
        email: user.email
      });

      res.status(201).json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        },
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  private async handleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      // Find user
      const user = await this.config.dataStore.findUserByEmailAddress(email);
      if (!user || !user.passwordHash) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Verify password
      const isValid = await this.config.authService.verifyPassword(password, user.passwordHash);
      if (!isValid) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Generate token
      const token = this.config.authService.generateToken({
        userId: user.id,
        email: user.email
      });

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        },
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  private async handleGetProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as Request & { userId: string }).userId;
      const user = await this.config.dataStore.findUserById(userId);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        preferences: user.preferences,
        parsedPreferences: user.parsedPreferences,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }

  private async handleUpdateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as Request & { userId: string }).userId;
      const { firstName, lastName } = req.body;

      const updatedUser = await this.config.dataStore.modifyUser(userId, {
        firstName,
        lastName
      });

      if (!updatedUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  private async handleUpdatePreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as Request & { userId: string }).userId;
      const { preferences } = req.body;

      if (!preferences) {
        res.status(400).json({ error: 'Preferences are required' });
        return;
      }

      // This would be handled by lottery service in a real implementation
      const updatedUser = await this.config.dataStore.modifyUser(userId, {
        preferences
      });

      if (!updatedUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        preferences: updatedUser.preferences,
        parsedPreferences: updatedUser.parsedPreferences
      });
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  }

  private async handleGetHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as Request & { userId: string }).userId;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const entries = await this.config.dataStore.queryUserLotteryHistory(userId, limit);

      res.json({ entries });
    } catch (error) {
      console.error('Get history error:', error);
      res.status(500).json({ error: 'Failed to get lottery history' });
    }
  }

  private async handleApplyLottery(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as Request & { userId: string }).userId;
      
      // This would trigger the lottery application process
      res.json({ message: 'Lottery application initiated', userId });
    } catch (error) {
      console.error('Apply lottery error:', error);
      res.status(500).json({ error: 'Failed to apply to lottery' });
    }
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(this.config.port, () => {
        console.log(`Haman web server running on port ${this.config.port}`);
        resolve();
      });
    });
  }
}
