import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import path from "node:path";
import { AuthModule } from "./auth/auth.module";
import { ComparisonsModule } from "./comparisons/comparisons.module";
import { DatabaseModule } from "./database/database.module";
import { FavoritesModule } from "./favorites/favorites.module";
import { HealthModule } from "./health/health.module";
import { LocationsModule } from "./locations/locations.module";
import { RequestLoggingMiddleware } from "./observability/request-logging.middleware";
import { PreferencesModule } from "./preferences/preferences.module";
import { RecommendationsModule } from "./recommendations/recommendations.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [path.resolve(process.cwd(), "../../.env"), path.resolve(process.cwd(), ".env")]
    }),
    AuthModule,
    ComparisonsModule,
    DatabaseModule,
    FavoritesModule,
    HealthModule,
    LocationsModule,
    PreferencesModule,
    RecommendationsModule
  ]
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggingMiddleware).forRoutes({
      path: "*path",
      method: RequestMethod.ALL
    });
  }
}
