export type CategoryKey =
  | "affordability"
  | "jobs"
  | "climate"
  | "safety"
  | "schools"
  | "healthcare"
  | "mobility"
  | "lifestyle";

export interface CategoryWeightMap {
  affordability: number;
  jobs: number;
  climate: number;
  safety: number;
  schools: number;
  healthcare: number;
  mobility: number;
  lifestyle: number;
}

export interface DealBreakers {
  maxHousingCostIndex?: number;
  maxTaxBurdenIndex?: number;
  minSafetyScore?: number;
  minJobMarketScore?: number;
  minWalkabilityScore?: number;
  maxDisasterRiskIndex?: number;
  preferredClimate?: {
    min?: number;
    max?: number;
  };
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthCredentialsInput {
  email: string;
  password: string;
}

export interface PreferenceProfile {
  id: string;
  userId: string;
  label: string;
  weights: CategoryWeightMap;
  dealBreakers?: DealBreakers;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PreferenceProfileInput {
  label: string;
  weights: CategoryWeightMap;
  dealBreakers?: DealBreakers;
}

export interface Location {
  id: string;
  name: string;
  state: string;
  country: string;
  slug: string;
  population: number;
  description?: string;
}

export interface LocationSummary extends Location {
  isSaved?: boolean;
}

export interface LocationMetrics {
  housingCostIndex: number;
  taxBurdenIndex: number;
  jobMarketScore: number;
  climateScore: number;
  safetyScore: number;
  educationScore: number;
  healthcareScore: number;
  walkabilityScore: number;
  transitScore: number;
  recreationScore: number;
  internetQualityScore: number;
  disasterRiskIndex: number;
}

export interface SavedLocation {
  id: string;
  userId: string;
  locationId: string;
  note?: string;
  createdAt: string;
}

export interface SavedLocationRecord extends SavedLocation {
  location: LocationSummary;
}

export interface LocationDetail {
  location: LocationSummary;
  metrics: LocationMetrics;
  savedFavorite?: SavedLocation;
}

export interface ComparisonSet {
  id?: string;
  userId: string;
  locationIds: string[];
  locations: LocationSummary[];
  count: number;
  minLocations: number;
  maxLocations: number;
}

export interface ComparisonEntry {
  position: number;
  location: LocationSummary;
  metrics: LocationMetrics;
  overallScore?: number | null;
  categoryScores?: Record<CategoryKey, number> | null;
  strengths: string[];
  tradeoffs: string[];
}

export interface ComparisonPayload {
  profile: PreferenceProfile | null;
  selection: ComparisonSet;
  entries: ComparisonEntry[];
}

export interface RecommendationRequest {
  weights: CategoryWeightMap;
  dealBreakers?: DealBreakers;
  locations: Array<Location & { metrics: LocationMetrics }>;
}

export interface RecommendationResult {
  location: LocationSummary;
  overallScore: number;
  categoryScores: Record<CategoryKey, number>;
  reasons: string[];
  tradeoffs: string[];
  blockedBy: string[];
}

export interface RecommendationFeed {
  profile: PreferenceProfile;
  totalLocations: number;
  results: RecommendationResult[];
}
