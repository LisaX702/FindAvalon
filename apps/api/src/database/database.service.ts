import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { prisma } from "@relocateit/database";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  readonly client = prisma;

  async onModuleInit() {
    try {
      await this.client.$connect();
      this.logger.log("Database connection ready.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown database error.";
      this.logger.error(
        `Database connection failed. Check DATABASE_URL, database availability, and migrations. ${message}`
      );
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }

  async ping() {
    await this.client.$queryRawUnsafe("SELECT 1");
  }
}
