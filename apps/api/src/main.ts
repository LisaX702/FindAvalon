import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { readApiEnv } from "./config/env";
import { ApiExceptionFilter } from "./observability/api-exception.filter";

async function bootstrap() {
  const env = readApiEnv();
  void env.databaseUrl;
  const app = await NestFactory.create(AppModule);
  const logger = new Logger("Bootstrap");

  app.enableCors({
    origin: env.appUrl,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Cookie"]
  });
  app.setGlobalPrefix("api");
  app.useGlobalFilters(new ApiExceptionFilter(env.appUrl));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true
    })
  );

  await app.listen(env.port);
  logger.log(`API listening on port ${env.port} with allowed origin ${env.appUrl}`);
}

void bootstrap().catch((error) => {
  const logger = new Logger("Bootstrap");
  const message = error instanceof Error ? error.message : String(error);
  const failureClass =
    message.toLowerCase().includes("database") ||
    message.toLowerCase().includes("prisma") ||
    message.toLowerCase().includes("connect")
      ? "database"
      : "config";

  logger.error(`API bootstrap failed class=${failureClass} message=${message}`);
  process.exit(1);
});
