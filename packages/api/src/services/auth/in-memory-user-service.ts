/**
 * In-memory implementation of DatabaseUserService for testing
 * This allows tests to run without requiring a real database connection
 */

import crypto from 'node:crypto';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export class InMemoryUserService {
  private usersByEmail = new Map<string, UserRecord>();
  private usersById = new Map<string, UserRecord>();

  async getUserByEmail(email: string): Promise<UserRecord | null> {
    const normalizedEmail = email.trim().toLowerCase();
    return this.usersByEmail.get(normalizedEmail) || null;
  }

  async getUserById(id: string): Promise<UserRecord | null> {
    return this.usersById.get(id) || null;
  }

  async createUser(email: string, passwordHash: string): Promise<UserRecord> {
    const normalizedEmail = email.trim().toLowerCase();
    const user: UserRecord = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.usersByEmail.set(normalizedEmail, user);
    this.usersById.set(user.id, user);

    return user;
  }

  async updateUser(id: string, passwordHash: string): Promise<UserRecord> {
    const user = this.usersById.get(id);
    if (!user) {
      throw new Error('User not found');
    }

    const updated = { ...user, passwordHash, updatedAt: new Date() };
    this.usersByEmail.set(updated.email, updated);
    this.usersById.set(id, updated);

    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    const user = this.usersById.get(id);
    if (user) {
      this.usersByEmail.delete(user.email);
      this.usersById.delete(id);
    }
  }

  async close(): Promise<void> {
    // No-op for in-memory service
  }

  clear(): void {
    this.usersByEmail.clear();
    this.usersById.clear();
  }
}
