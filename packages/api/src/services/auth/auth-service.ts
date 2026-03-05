import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
}

export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

export class AuthService {
  private readonly usersByEmail = new Map<string, UserRecord>();
  private readonly usersById = new Map<string, UserRecord>();
  private readonly jwtSecret: string;

  constructor(jwtSecret = process.env.ULTRA_AI_JWT_SECRET ?? 'ultra-ai-dev-secret') {
    this.jwtSecret = jwtSecret;
  }

  register(email: string, password: string): AuthResult {
    const normalizedEmail = email.trim().toLowerCase();
    if (this.usersByEmail.has(normalizedEmail)) {
      throw new Error('User already exists');
    }

    const user: UserRecord = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      passwordHash: this.hashPassword(password),
    };

    this.usersByEmail.set(normalizedEmail, user);
    this.usersById.set(user.id, user);

    return {
      token: this.issueToken(user),
      user: { id: user.id, email: user.email },
    };
  }

  login(email: string, password: string): AuthResult {
    const normalizedEmail = email.trim().toLowerCase();
    const user = this.usersByEmail.get(normalizedEmail);

    if (!user || user.passwordHash !== this.hashPassword(password)) {
      throw new Error('Invalid credentials');
    }

    return {
      token: this.issueToken(user),
      user: { id: user.id, email: user.email },
    };
  }

  verifyToken(token: string): { userId: string; email: string } {
    const payload = jwt.verify(token, this.jwtSecret) as {
      sub: string;
      email: string;
    };

    return {
      userId: payload.sub,
      email: payload.email,
    };
  }

  private issueToken(user: UserRecord): string {
    return jwt.sign({ email: user.email }, this.jwtSecret, {
      subject: user.id,
      expiresIn: '12h',
    });
  }

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }
}
