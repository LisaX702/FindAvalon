import { Module } from "@nestjs/common";
import { FavoritesModule } from "../favorites/favorites.module";
import { PreferencesModule } from "../preferences/preferences.module";
import { RecommendationsController } from "./recommendations.controller";
import { RecommendationsService } from "./recommendations.service";

@Module({
  imports: [FavoritesModule, PreferencesModule],
  controllers: [RecommendationsController],
  providers: [RecommendationsService]
})
export class RecommendationsModule {}
