import type { PreferenceProfile } from "@relocateit/types";

type PreferenceProfileRecord = {
  id: string;
  userId: string;
  label: string;
  isCurrent: boolean;
  weightsJson: unknown;
  constraintsJson: unknown;
  createdAt: Date;
  updatedAt: Date;
};

export function toPreferenceProfile(record: PreferenceProfileRecord): PreferenceProfile {
  return {
    id: record.id,
    userId: record.userId,
    label: record.label,
    isCurrent: record.isCurrent,
    weights: record.weightsJson as PreferenceProfile["weights"],
    dealBreakers: (record.constraintsJson ?? undefined) as PreferenceProfile["dealBreakers"],
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString()
  };
}
