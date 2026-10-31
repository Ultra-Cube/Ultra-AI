import { PrismaClient, UserRole } from '@prisma/client';

export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export class DatabaseUserService {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  async getUserByEmail(email: string): Promise<UserRecord | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    return user as UserRecord | null;
  }

  async getUserById(id: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    return user as UserRecord | null;
  }

  async createUser(email: string, passwordHash: string): Promise<UserRecord> {
    const normalizedEmail = email.trim().toLowerCase();
    // Ensure the default tenant exists so registration works on fresh databases.
    await this.prisma.tenant.upsert({
      where: { id: 'default-tenant' },
      update: {},
      create: {
        id: 'default-tenant',
        name: 'Default Tenant',
        slug: 'default',
        status: 'ACTIVE',
      },
    });
    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        tenant: {
          connect: { id: 'default-tenant' },
        },
      },
    });
    return user as UserRecord;
  }

  async updateUser(id: string, passwordHash: string): Promise<UserRecord> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
    return user as UserRecord;
  }

  async deleteUser(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }
}
