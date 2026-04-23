import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { ComparisonPayload, ComparisonSet, RecommendationRequest } from "@relocateit/types";
import { getRecommendations } from "@relocateit/scoring";
import { DatabaseService } from "../database/database.service";
import { toLocationMetrics, toLocationSummary } from "../locations/locations.mapper";
import { PreferencesService } from "../preferences/preferences.service";

const MAX_COMPARE_LOCATIONS = 4;
const MIN_COMPARE_LOCATIONS = 2;

type CurrentComparisonRecord = Awaited<ReturnType<ComparisonsService["findCurrentComparison"]>>;

@Injectable()
export class ComparisonsService {
  constructor(
    private readonly database: DatabaseService,
    private readonly preferencesService: PreferencesService
  ) {}

  async getCurrentSet(userId: string): Promise<ComparisonSet> {
    const current = await this.findCurrentComparison(userId);

    return this.toComparisonSet(userId, current);
  }

  async addLocation(userId: string, locationId: string): Promise<ComparisonSet> {
    const location = await this.database.client.location.findUnique({
      where: { id: locationId },
      select: { id: true }
    });

    if (!location) {
      throw new NotFoundException("Location not found.");
    }

    await this.database.client.$transaction(async (tx) => {
      let comparison = await tx.comparison.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          rows: {
            orderBy: { position: "asc" }
          }
        }
      });

      if (!comparison) {
        comparison = await tx.comparison.create({
          data: { userId },
          include: {
            rows: {
              orderBy: { position: "asc" }
            }
          }
        });
      }

      if (comparison.rows.some((row) => row.locationId === locationId)) {
        return;
      }

      if (comparison.rows.length >= MAX_COMPARE_LOCATIONS) {
        throw new BadRequestException(
          `You can compare up to ${MAX_COMPARE_LOCATIONS} locations at a time.`
        );
      }

      await tx.comparisonRow.create({
        data: {
          comparisonId: comparison.id,
          locationId,
          position: comparison.rows.length + 1
        }
      });
    });

    return this.getCurrentSet(userId);
  }

  async removeLocation(userId: string, locationId: string): Promise<{ removed: boolean; selection: ComparisonSet }> {
    const current = await this.findCurrentComparison(userId);

    if (!current) {
      return {
        removed: true,
        selection: this.toComparisonSet(userId, null)
      };
    }

    await this.database.client.$transaction(async (tx) => {
      await tx.comparisonRow.deleteMany({
        where: {
          comparisonId: current.id,
          locationId
        }
      });

      const remainingRows = await tx.comparisonRow.findMany({
        where: {
          comparisonId: current.id
        },
        orderBy: {
          position: "asc"
        }
      });

      for (const [index, row] of remainingRows.entries()) {
        if (row.position !== index + 1) {
          await tx.comparisonRow.update({
            where: { id: row.id },
            data: { position: index + 1 }
          });
        }
      }
    });

    return {
      removed: true,
      selection: await this.getCurrentSet(userId)
    };
  }

  async getComparisonPayload(userId: string): Promise<ComparisonPayload> {
    const [current, profile] = await Promise.all([
      this.findCurrentComparison(userId),
      this.preferencesService.getCurrentProfile(userId)
    ]);

    const selection = this.toComparisonSet(userId, current);

    if (!current) {
      return {
        profile,
        selection,
        entries: []
      };
    }

    const inputs = current.rows
      .filter((row) => row.location.metrics)
      .map((row) => {
        const metrics = row.location.metrics as NonNullable<typeof row.location.metrics>;

        return {
          location: toLocationSummary(row.location),
          metrics: toLocationMetrics(metrics)
        };
      });

    const recommendationById = profile
      ? new Map(
          getRecommendations(
            {
              weights: profile.weights,
              dealBreakers: profile.dealBreakers
            } satisfies Pick<RecommendationRequest, "weights" | "dealBreakers">,
            inputs
          ).map((result) => [result.location.id, result])
        )
      : new Map();

    const entries = current.rows
      .filter((row) => row.location.metrics)
      .map((row) => {
        const recommendation = recommendationById.get(row.locationId);
        const metrics = row.location.metrics as NonNullable<typeof row.location.metrics>;

        return {
          position: row.position,
          location: toLocationSummary(row.location),
          metrics: toLocationMetrics(metrics),
          overallScore: recommendation?.overallScore ?? null,
          categoryScores: recommendation?.categoryScores ?? null,
          strengths: recommendation?.reasons ?? [],
          tradeoffs: [
            ...(recommendation?.tradeoffs ?? []),
            ...(recommendation?.blockedBy ?? [])
          ]
        };
      });

    return {
      profile,
      selection,
      entries
    };
  }

  async getComparedLocationIds(userId: string) {
    const current = await this.findCurrentComparison(userId);

    return current ? current.rows.map((row) => row.locationId) : [];
  }

  private async findCurrentComparison(userId: string) {
    return this.database.client.comparison.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        rows: {
          orderBy: { position: "asc" },
          include: {
            location: {
              include: {
                metrics: true
              }
            }
          }
        }
      }
    });
  }

  private toComparisonSet(userId: string, current: CurrentComparisonRecord): ComparisonSet {
    return {
      id: current?.id,
      userId,
      locationIds: current?.rows.map((row) => row.locationId) ?? [],
      locations: current?.rows.map((row) => toLocationSummary(row.location)) ?? [],
      count: current?.rows.length ?? 0,
      minLocations: MIN_COMPARE_LOCATIONS,
      maxLocations: MAX_COMPARE_LOCATIONS
    };
  }
}
