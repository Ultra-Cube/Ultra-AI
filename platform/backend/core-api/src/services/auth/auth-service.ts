import crypto from 'node:crypto';

import jwt from 'jsonwebtoken';

import { DatabaseUserService, UserRecord } from './db-user-service';

export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

export class AuthService {
  private readonly dbService: DatabaseUserService;
  private readonly jwtSecret: string;

  constructor(
    dbService: DatabaseUserService,
    jwtSecret = process.env.ULTRA_AI_JWT_SECRET ?? 'ultra-ai-dev-secret'
  ) {
    this.dbService = dbService;
    this.jwtSecret = jwtSecret;
  }

  async register(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await this.dbService.getUserByEmail(normalizedEmail);

    if (existingUser) {
      throw new Error('User already exists');
    }

    const passwordHash = this.hashPassword(password);
    const user = await this.dbService.createUser(normalizedEmail, passwordHash);

    return {
      token: this.issueToken(user),
      user: { id: user.id, email: user.email },
    };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.dbService.getUserByEmail(normalizedEmail);

    if (!user || user.passwordHash !== this.hashPassword(password)) {
      throw new Error('Invalid credentials');
    }

    return {
      token: this.issueToken(user),
      user: { id: user.id, email: user.email },
    };
  }

  verifyToken(token: string): { userId: string; email: string; role: string } {
    const payload = jwt.verify(token, this.jwtSecret) as {
      sub: string;
      email: string;
      role: string;
    };

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }

  private issueToken(user: UserRecord): string {
    return jwt.sign({ email: user.email, role: user.role }, this.jwtSecret, {
      subject: user.id,
      expiresIn: '12h',
    });
  }

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }
}
