import { Controller, Get, Logger, ServiceUnavailableException } from "@nestjs/common";
import { DatabaseService } from "../database/database.service";

@Controller("health")
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly database: DatabaseService) {}

  @Get()
  async getHealth() {
    try {
      await this.database.ping();

      return {
        status: "ok",
        service: "relocateit-api",
        database: "ok"
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown database error.";
      this.logger.error(`Health check database probe failed. ${message}`);
      throw new ServiceUnavailableException({
        status: "degraded",
        service: "relocateit-api",
        database: "error",
        message: "Database probe failed."
      });
    }
  }
}
