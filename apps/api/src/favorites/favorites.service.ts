import { Injectable, NotFoundException } from "@nestjs/common";
import type { SavedLocation, SavedLocationRecord } from "@relocateit/types";
import { DatabaseService } from "../database/database.service";
import { toSavedLocation, toSavedLocationRecord } from "../locations/locations.mapper";

@Injectable()
export class FavoritesService {
  constructor(private readonly database: DatabaseService) {}

  async listFavorites(userId: string): Promise<SavedLocationRecord[]> {
    const favorites = await this.database.client.savedLocation.findMany({
      where: { userId },
      include: {
        location: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return favorites.map((favorite) => toSavedLocationRecord(favorite));
  }

  async saveFavorite(userId: string, input: {
    locationId: string;
    note?: string;
  }): Promise<SavedLocation> {
    const location = await this.database.client.location.findUnique({
      where: { id: input.locationId },
      select: { id: true }
    });

    if (!location) {
      throw new NotFoundException("Location not found.");
    }

    const favorite = await this.database.client.savedLocation.upsert({
      where: {
        userId_locationId: {
          userId,
          locationId: input.locationId
        }
      },
      update: {
        note: input.note ?? null
      },
      create: {
        userId,
        locationId: input.locationId,
        note: input.note ?? null
      }
    });

    return toSavedLocation(favorite);
  }

  async removeFavorite(userId: string, locationId: string): Promise<{ removed: boolean }> {
    await this.database.client.savedLocation.deleteMany({
      where: {
        userId,
        locationId
      }
    });

    return { removed: true };
  }

  async getSavedLocationIds(userId: string) {
    const favorites = await this.database.client.savedLocation.findMany({
      where: { userId },
      select: { locationId: true }
    });

    return new Set(favorites.map((favorite) => favorite.locationId));
  }
}
