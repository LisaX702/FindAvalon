import { Injectable, NotFoundException } from "@nestjs/common";
import type { LocationDetail } from "@relocateit/types";
import { DatabaseService } from "../database/database.service";
import { toLocationDetail } from "./locations.mapper";

@Injectable()
export class LocationsService {
  constructor(private readonly database: DatabaseService) {}

  async getLocationBySlug(slug: string, userId: string): Promise<LocationDetail> {
    const location = await this.database.client.location.findUnique({
      where: { slug },
      include: {
        metrics: true,
        savedLocations: {
          where: { userId },
          take: 1
        }
      }
    });

    if (!location?.metrics) {
      throw new NotFoundException("Location not found.");
    }

    return toLocationDetail({
      ...location,
      metrics: location.metrics,
      savedLocations: location.savedLocations
    });
  }

  async getLocationById(id: string, userId: string): Promise<LocationDetail> {
    const location = await this.database.client.location.findUnique({
      where: { id },
      include: {
        metrics: true,
        savedLocations: {
          where: { userId },
          take: 1
        }
      }
    });

    if (!location?.metrics) {
      throw new NotFoundException("Location not found.");
    }

    return toLocationDetail({
      ...location,
      metrics: location.metrics,
      savedLocations: location.savedLocations
    });
  }
}
