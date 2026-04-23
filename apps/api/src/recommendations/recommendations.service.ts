import { Injectable, NotFoundException } from "@nestjs/common";
import { getRecommendations } from "@relocateit/scoring";
import type { RecommendationFeed, RecommendationRequest } from "@relocateit/types";
import { DatabaseService } from "../database/database.service";
import { FavoritesService } from "../favorites/favorites.service";
import { toLocationMetrics, toLocationSummary } from "../locations/locations.mapper";
import { PreferencesService } from "../preferences/preferences.service";

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly favoritesService: FavoritesService,
    private readonly preferencesService: PreferencesService
  ) {}

  async getRecommendationsForUser(userId: string, limit = 10): Promise<RecommendationFeed> {
    const profile = await this.preferencesService.getCurrentProfile(userId);

    if (!profile) {
      throw new NotFoundException("No current preference profile found for this user.");
    }

    const locations = await this.database.client.location.findMany({
      include: {
        metrics: true
      }
    });
    const savedLocationIds = await this.favoritesService.getSavedLocationIds(userId);

    const persistedLocations = locations
      .filter((entry) => entry.metrics)
      .map((entry) => ({
        location: toLocationSummary(entry, {
          isSaved: savedLocationIds.has(entry.id)
        }),
        metrics: toLocationMetrics(entry.metrics as NonNullable<typeof entry.metrics>)
      }));

    const results = getRecommendations(
      {
        weights: profile.weights,
        dealBreakers: profile.dealBreakers
      } satisfies Pick<RecommendationRequest, "weights" | "dealBreakers">,
      persistedLocations
    ).slice(0, limit);

    return {
      profile,
      totalLocations: persistedLocations.length,
      results
    };
  }
}
