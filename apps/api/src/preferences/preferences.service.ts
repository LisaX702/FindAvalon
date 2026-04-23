import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { PreferenceProfileInput } from "@relocateit/types";
import { DatabaseService } from "../database/database.service";
import { toPreferenceProfile } from "./preferences.mapper";

@Injectable()
export class PreferencesService {
  constructor(private readonly database: DatabaseService) {}

  async getCurrentProfile(userId: string) {
    const profile = await this.database.client.preferenceProfile.findFirst({
      where: { userId },
      orderBy: [{ isCurrent: "desc" }, { updatedAt: "desc" }]
    });

    return profile ? toPreferenceProfile(profile) : null;
  }

  async createProfile(userId: string, input: PreferenceProfileInput) {
    const profile = await this.database.client.$transaction(async (tx) => {
      await tx.preferenceProfile.updateMany({
        where: { userId, isCurrent: true },
        data: { isCurrent: false }
      });

      return tx.preferenceProfile.create({
        data: {
          userId,
          label: input.label,
          isCurrent: true,
          weightsJson: input.weights as unknown as Prisma.InputJsonValue,
          constraintsJson: input.dealBreakers
            ? (input.dealBreakers as Prisma.InputJsonValue)
            : Prisma.JsonNull
        }
      });
    });

    return toPreferenceProfile(profile);
  }

  async updateProfile(userId: string, profileId: string, input: PreferenceProfileInput) {
    const existing = await this.database.client.preferenceProfile.findUnique({
      where: { id: profileId }
    });

    if (!existing || existing.userId !== userId) {
      throw new NotFoundException("Preference profile not found for this user.");
    }

    const profile = await this.database.client.$transaction(async (tx) => {
      await tx.preferenceProfile.updateMany({
        where: { userId, isCurrent: true },
        data: { isCurrent: false }
      });

      return tx.preferenceProfile.update({
        where: { id: profileId },
        data: {
          label: input.label,
          isCurrent: true,
          weightsJson: input.weights as unknown as Prisma.InputJsonValue,
          constraintsJson: input.dealBreakers
            ? (input.dealBreakers as Prisma.InputJsonValue)
            : Prisma.JsonNull
        }
      });
    });

    return toPreferenceProfile(profile);
  }
}
