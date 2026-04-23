import type { CategoryKey, PreferenceProfileInput } from "@relocateit/types";

export const LOCATION_CATEGORIES: Array<{
  key: CategoryKey;
  label: string;
  description: string;
}> = [
  {
    key: "affordability",
    label: "Affordability",
    description: "Balance housing cost and day-to-day livability."
  },
  {
    key: "jobs",
    label: "Jobs",
    description: "Measure career opportunity and market resilience."
  },
  {
    key: "climate",
    label: "Climate",
    description: "Capture weather comfort and seasonal fit."
  },
  {
    key: "safety",
    label: "Safety",
    description: "Combine daily safety and broader resilience risks."
  },
  {
    key: "schools",
    label: "Schools",
    description: "Show school quality and education access."
  },
  {
    key: "healthcare",
    label: "Healthcare",
    description: "Compare care availability and provider quality."
  },
  {
    key: "mobility",
    label: "Mobility",
    description: "Reflect walkability, commuting ease, and transit access."
  },
  {
    key: "lifestyle",
    label: "Lifestyle",
    description: "Blend recreation, digital connectivity, and everyday quality of life."
  }
];

export const DEFAULT_PROFILE_INPUT: PreferenceProfileInput = {
  label: "Balanced relocation priorities",
  weights: {
    affordability: 0.2,
    jobs: 0.18,
    climate: 0.1,
    safety: 0.16,
    schools: 0.1,
    healthcare: 0.1,
    mobility: 0.08,
    lifestyle: 0.08
  },
  dealBreakers: {
    maxHousingCostIndex: 0.7,
    minSafetyScore: 0.55,
    maxDisasterRiskIndex: 0.7
  }
};
