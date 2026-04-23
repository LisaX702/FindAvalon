import {
  ConflictException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { User } from "@relocateit/types";
import { DatabaseService } from "../database/database.service";
import { SESSION_DURATION_MS } from "./auth.constants";
import {
  createSessionToken,
  hashPassword,
  hashSessionToken,
  verifyPassword
} from "./auth.utils";

@Injectable()
export class AuthService {
  constructor(private readonly database: DatabaseService) {}

  async signUp(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await this.database.client.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser?.passwordHash) {
      throw new ConflictException("An account with that email already exists.");
    }

    const passwordHash = hashPassword(password);
    const user = existingUser
      ? await this.database.client.user.update({
          where: { id: existingUser.id },
          data: { passwordHash }
        })
      : await this.database.client.user.create({
          data: {
            id: randomUUID(),
            email: normalizedEmail,
            passwordHash
          }
        });

    const session = await this.createSession(user.id);

    return {
      user: this.toUser(user),
      ...session
    };
  }

  async signIn(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.database.client.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    const session = await this.createSession(user.id);

    return {
      user: this.toUser(user),
      ...session
    };
  }

  async signOut(sessionToken: string) {
    await this.database.client.session.deleteMany({
      where: {
        sessionTokenHash: hashSessionToken(sessionToken)
      }
    });
  }

  async getCurrentUserBySessionToken(sessionToken: string): Promise<User | null> {
    await this.database.client.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });

    const session = await this.database.client.session.findUnique({
      where: {
        sessionTokenHash: hashSessionToken(sessionToken)
      },
      include: {
        user: true
      }
    });

    if (!session || session.expiresAt <= new Date()) {
      return null;
    }

    return this.toUser(session.user);
  }

  private async createSession(userId: string) {
    const sessionToken = createSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await this.database.client.session.create({
      data: {
        userId,
        sessionTokenHash: hashSessionToken(sessionToken),
        expiresAt
      }
    });

    return {
      sessionToken,
      expiresAt
    };
  }

  private toUser(user: {
    id: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return {
      id: user.id,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  }
}
