import type {
  LocationDetail,
  LocationMetrics,
  LocationSummary,
  SavedLocation,
  SavedLocationRecord
} from "@relocateit/types";

type LocationRecord = {
  id: string;
  name: string;
  state: string;
  country: string;
  slug: string;
  population: number;
  description: string | null;
};

type MetricsRecord = {
  housingCostIndex: number;
  taxBurdenIndex: number;
  climateScore: number;
  safetyScore: number;
  educationScore: number;
  healthcareScore: number;
  jobMarketScore: number;
  walkabilityScore: number;
  transitScore: number;
  recreationScore: number;
  internetQualityScore: number;
  disasterRiskIndex: number;
};

type SavedLocationRecordRaw = {
  id: string;
  userId: string;
  locationId: string;
  note: string | null;
  createdAt: Date;
};

export function toLocationSummary(
  entry: LocationRecord,
  options?: {
    isSaved?: boolean;
  }
): LocationSummary {
  return {
    id: entry.id,
    name: entry.name,
    state: entry.state,
    country: entry.country,
    slug: entry.slug,
    population: entry.population,
    description: entry.description ?? undefined,
    isSaved: options?.isSaved
  };
}

export function toLocationMetrics(entry: MetricsRecord): LocationMetrics {
  return {
    housingCostIndex: entry.housingCostIndex,
    taxBurdenIndex: entry.taxBurdenIndex,
    climateScore: entry.climateScore,
    safetyScore: entry.safetyScore,
    educationScore: entry.educationScore,
    healthcareScore: entry.healthcareScore,
    jobMarketScore: entry.jobMarketScore,
    walkabilityScore: entry.walkabilityScore,
    transitScore: entry.transitScore,
    recreationScore: entry.recreationScore,
    internetQualityScore: entry.internetQualityScore,
    disasterRiskIndex: entry.disasterRiskIndex
  };
}

export function toSavedLocation(entry: SavedLocationRecordRaw): SavedLocation {
  return {
    id: entry.id,
    userId: entry.userId,
    locationId: entry.locationId,
    note: entry.note ?? undefined,
    createdAt: entry.createdAt.toISOString()
  };
}

export function toSavedLocationRecord(
  entry: SavedLocationRecordRaw & {
    location: LocationRecord;
  }
): SavedLocationRecord {
  return {
    ...toSavedLocation(entry),
    location: toLocationSummary(entry.location, { isSaved: true })
  };
}

export function toLocationDetail(
  entry: LocationRecord & {
    metrics: MetricsRecord;
    savedLocations?: SavedLocationRecordRaw[];
  }
): LocationDetail {
  const savedFavorite = entry.savedLocations?.[0];

  return {
    location: toLocationSummary(entry, { isSaved: Boolean(savedFavorite) }),
    metrics: toLocationMetrics(entry.metrics),
    savedFavorite: savedFavorite ? toSavedLocation(savedFavorite) : undefined
  };
}
