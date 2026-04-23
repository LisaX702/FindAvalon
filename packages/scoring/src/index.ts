import type {
  CategoryKey,
  CategoryWeightMap,
  DealBreakers,
  Location,
  LocationMetrics,
  RecommendationRequest,
  RecommendationResult
} from "@relocateit/types";

type ScoringInput = {
  location: Location;
  metrics: LocationMetrics;
};

type WeightedCategoryScore = {
  key: CategoryKey;
  score: number;
  weight: number;
};

const CATEGORY_METRICS: Record<
  CategoryKey,
  (metrics: LocationMetrics, location: Location) => number
> = {
  affordability: (metrics) => ((1 - metrics.housingCostIndex) + (1 - metrics.taxBurdenIndex)) / 2,
  jobs: (metrics, location) => (metrics.jobMarketScore + getPopulationOpportunityScore(location.population)) / 2,
  climate: (metrics) => metrics.climateScore,
  safety: (metrics) => (metrics.safetyScore + (1 - metrics.disasterRiskIndex)) / 2,
  schools: (metrics) => metrics.educationScore,
  healthcare: (metrics) => metrics.healthcareScore,
  mobility: (metrics) => (metrics.walkabilityScore + metrics.transitScore) / 2,
  lifestyle: (metrics) => (metrics.recreationScore + metrics.internetQualityScore) / 2
};

function clampScore(value: number) {
  return Math.max(0, Math.min(1, value));
}

function getPopulationOpportunityScore(population: number) {
  const minPopulation = 50_000;
  const maxPopulation = 5_000_000;
  const bounded = Math.max(minPopulation, Math.min(maxPopulation, population));

  return clampScore(
    (Math.log10(bounded) - Math.log10(minPopulation)) /
      (Math.log10(maxPopulation) - Math.log10(minPopulation))
  );
}

function normalizeWeights(weights: CategoryWeightMap): CategoryWeightMap {
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  const safeTotal = total === 0 ? 1 : total;

  return {
    affordability: weights.affordability / safeTotal,
    jobs: weights.jobs / safeTotal,
    climate: weights.climate / safeTotal,
    safety: weights.safety / safeTotal,
    schools: weights.schools / safeTotal,
    healthcare: weights.healthcare / safeTotal,
    mobility: weights.mobility / safeTotal,
    lifestyle: weights.lifestyle / safeTotal
  };
}

function evaluateDealBreakers(metrics: LocationMetrics, dealBreakers?: DealBreakers) {
  const blockedBy: string[] = [];

  if (!dealBreakers) {
    return blockedBy;
  }

  if (
    typeof dealBreakers.maxHousingCostIndex === "number" &&
    metrics.housingCostIndex > dealBreakers.maxHousingCostIndex
  ) {
    blockedBy.push("Housing costs exceed your maximum threshold.");
  }

  if (
    typeof dealBreakers.maxTaxBurdenIndex === "number" &&
    metrics.taxBurdenIndex > dealBreakers.maxTaxBurdenIndex
  ) {
    blockedBy.push("State and local taxes exceed your preferred threshold.");
  }

  if (
    typeof dealBreakers.minSafetyScore === "number" &&
    metrics.safetyScore < dealBreakers.minSafetyScore
  ) {
    blockedBy.push("Safety score falls below your minimum requirement.");
  }

  if (
    typeof dealBreakers.minJobMarketScore === "number" &&
    metrics.jobMarketScore < dealBreakers.minJobMarketScore
  ) {
    blockedBy.push("Job market strength is below your minimum requirement.");
  }

  if (
    typeof dealBreakers.minWalkabilityScore === "number" &&
    metrics.walkabilityScore < dealBreakers.minWalkabilityScore
  ) {
    blockedBy.push("Walkability is below your minimum requirement.");
  }

  if (
    typeof dealBreakers.preferredClimate?.min === "number" &&
    metrics.climateScore < dealBreakers.preferredClimate.min
  ) {
    blockedBy.push("Climate score is below your preferred range.");
  }

  if (
    typeof dealBreakers.preferredClimate?.max === "number" &&
    metrics.climateScore > dealBreakers.preferredClimate.max
  ) {
    blockedBy.push("Climate score is above your preferred range.");
  }

  if (
    typeof dealBreakers.maxDisasterRiskIndex === "number" &&
    metrics.disasterRiskIndex > dealBreakers.maxDisasterRiskIndex
  ) {
    blockedBy.push("Disaster risk is above your preferred maximum.");
  }

  return blockedBy;
}

function buildCategoryScores(location: Location, metrics: LocationMetrics): Record<CategoryKey, number> {
  return Object.fromEntries(
    Object.entries(CATEGORY_METRICS).map(([key, evaluator]) => [
      key,
      clampScore(evaluator(metrics, location))
    ])
  ) as Record<CategoryKey, number>;
}

function sortCategoriesForReasons(
  scores: Record<CategoryKey, number>,
  weights: CategoryWeightMap
): WeightedCategoryScore[] {
  return (Object.entries(scores) as Array<[CategoryKey, number]>)
    .map(([key, score]) => ({
      key,
      score,
      weight: weights[key]
    }))
    .sort((left, right) => {
      const leftStrength = left.score * 0.72 + left.weight * 0.28;
      const rightStrength = right.score * 0.72 + right.weight * 0.28;
      return rightStrength - leftStrength;
    });
}

function sortCategoriesForTradeoffs(
  scores: Record<CategoryKey, number>,
  weights: CategoryWeightMap
): WeightedCategoryScore[] {
  return (Object.entries(scores) as Array<[CategoryKey, number]>)
    .map(([key, score]) => ({
      key,
      score,
      weight: weights[key]
    }))
    .sort((left, right) => {
      const leftConcern = (1 - left.score) * 0.68 + left.weight * 0.32;
      const rightConcern = (1 - right.score) * 0.68 + right.weight * 0.32;
      return rightConcern - leftConcern;
    });
}

function getTopPriorityKeys(weights: CategoryWeightMap) {
  return (Object.entries(weights) as Array<[CategoryKey, number]>)
    .sort((left, right) => right[1] - left[1])
    .map(([key]) => key);
}

function getLocationStyle(location: Location, metrics: LocationMetrics) {
  const denseUrban =
    location.population > 700_000 && metrics.walkabilityScore > 0.62 && metrics.transitScore > 0.45;
  const outdoorFocused = metrics.recreationScore > 0.82 && metrics.walkabilityScore < 0.62;
  const institutionDriven = metrics.educationScore > 0.82 && metrics.healthcareScore > 0.8;
  const growthMarket = metrics.jobMarketScore > 0.8 && location.population > 250_000;
  const valueMetro = metrics.housingCostIndex < 0.48 && metrics.taxBurdenIndex < 0.58;

  if (denseUrban) {
    return "dense-urban";
  }

  if (outdoorFocused) {
    return "outdoor-focused";
  }

  if (institutionDriven) {
    return "institution-driven";
  }

  if (growthMarket) {
    return "growth-market";
  }

  if (valueMetro) {
    return "value-leaning";
  }

  return "balanced";
}

function describeCategoryStrength(
  key: CategoryKey,
  location: Location,
  metrics: LocationMetrics
) {
  switch (key) {
    case "affordability":
      if (metrics.housingCostIndex < 0.42 && metrics.taxBurdenIndex < 0.45) {
        return "keeps both housing pressure and tax burden relatively manageable";
      }

      if (metrics.housingCostIndex < 0.45) {
        return "keeps housing costs more manageable than many peer markets";
      }

      if (metrics.taxBurdenIndex < 0.42) {
        return "pairs everyday costs with lighter tax pressure";
      }

      return "lands on the more manageable end of the cost spectrum";
    case "jobs":
      if (metrics.jobMarketScore > 0.84 && location.population > 700_000) {
        return "offers broad job depth and enough metro scale to support career moves";
      }

      if (metrics.jobMarketScore > 0.82) {
        return "shows stronger job momentum than most similar-sized markets";
      }

      return "still gives you a reasonably steady opportunity base";
    case "climate":
      if (metrics.climateScore > 0.8) {
        return "keeps day-to-day weather comfort high for most movers";
      }

      if (metrics.climateScore > 0.68) {
        return "offers a climate profile that stays broadly comfortable year-round";
      }

      return "stays within a workable climate range even if it is not a major draw";
    case "safety":
      if (metrics.safetyScore > 0.78 && metrics.disasterRiskIndex < 0.24) {
        return "combines better everyday safety with relatively contained disruption risk";
      }

      if (metrics.safetyScore > 0.73) {
        return "feels steadier on everyday safety than many peer locations";
      }

      return "avoids the sharper risk profile seen in weaker markets";
    case "schools":
      if (metrics.educationScore > 0.84) {
        return "has school-quality signals that stand out nationally";
      }

      if (metrics.educationScore > 0.76) {
        return "brings stronger schools than many comparable cities";
      }

      return "stays serviceable for households who still want decent school access";
    case "healthcare":
      if (metrics.healthcareScore > 0.86) {
        return "has unusually deep healthcare access and provider quality";
      }

      if (metrics.healthcareScore > 0.78) {
        return "keeps healthcare access stronger than many regional peers";
      }

      return "still offers workable healthcare coverage for routine needs";
    case "mobility":
      if (metrics.walkabilityScore > 0.75 && metrics.transitScore > 0.68) {
        return "supports a genuinely car-light routine with strong walkability and transit";
      }

      if (metrics.walkabilityScore > 0.68) {
        return "makes everyday errands easier to do on foot than most U.S. metros";
      }

      if (metrics.transitScore > 0.52) {
        return "gives you more transit support than many similarly sized places";
      }

      return "still holds up better on mobility than its peer group";
    case "lifestyle":
      if (metrics.recreationScore > 0.86 && metrics.internetQualityScore > 0.8) {
        return "blends outdoor or cultural access with dependable daily infrastructure";
      }

      if (metrics.recreationScore > 0.84) {
        return "makes lifestyle and recreation easier to prioritize week to week";
      }

      if (metrics.internetQualityScore > 0.82) {
        return "pairs daily convenience with stronger digital infrastructure";
      }

      return "still gives you a solid quality-of-life floor";
    default:
      return `${location.name} performs well here`;
  }
}

function describeCategoryTradeoff(
  key: CategoryKey,
  metrics: LocationMetrics,
  location: Location
) {
  switch (key) {
    case "affordability":
      if (metrics.housingCostIndex > 0.82 && metrics.taxBurdenIndex > 0.62) {
        return "Housing and tax pressure both run high, so affordability is a real drag on the fit.";
      }

      if (metrics.housingCostIndex > 0.8) {
        return "Housing costs are doing a lot of the work against this match.";
      }

      return "Taxes and day-to-day cost pressure make the value story less convincing.";
    case "jobs":
      if (location.population < 160_000 || metrics.jobMarketScore < 0.58) {
        return "The job market is narrower here, so career flexibility may feel limited.";
      }

      return "Job depth is not as broad as the stronger career markets in the set.";
    case "climate":
      if (metrics.climateScore < 0.38) {
        return "Climate fit is a real watchout, with a seasonal pattern that may feel uncomfortable for your profile.";
      }

      return "Climate comfort is workable, but it is not doing much to help this location pull ahead.";
    case "safety":
      if (metrics.safetyScore < 0.58 && metrics.disasterRiskIndex > 0.45) {
        return "Both everyday safety and broader disruption risk need a closer look here.";
      }

      if (metrics.disasterRiskIndex > 0.48) {
        return "Climate or disaster exposure is one of the clearer risks to weigh here.";
      }

      return "Safety is more mixed here than in the strongest finalists.";
    case "schools":
      return "Schools are more middle-of-the-pack, so families may want a closer read before committing.";
    case "healthcare":
      return "Healthcare access is thinner here than in the markets with the strongest provider base.";
    case "mobility":
      if (metrics.walkabilityScore < 0.42 && metrics.transitScore < 0.3) {
        return "Daily life will likely stay car-dependent, which limits the mobility fit.";
      }

      if (metrics.transitScore < 0.28) {
        return "Transit support is limited enough that most routines will still depend on driving.";
      }

      return "Mobility is serviceable, but it does not offer the flexibility of the more connected cities.";
    case "lifestyle":
      if (metrics.recreationScore < 0.62) {
        return "Lifestyle upside feels thinner here, especially if you want easy recreation access.";
      }

      return "The quality-of-life story is steadier than standout, so it may feel less distinctive day to day.";
    default:
      return `${key} is a weaker area here.`;
  }
}

function buildReasonSentence(
  location: Location,
  metrics: LocationMetrics,
  item: WeightedCategoryScore,
  topPriorityKeys: CategoryKey[]
) {
  const emphasis =
    topPriorityKeys[0] === item.key
      ? "This lines up especially well with your top priority because it "
      : topPriorityKeys[1] === item.key
        ? "This also supports one of your biggest priorities because it "
        : item.score > 0.82
          ? "One of the clearest reasons it rises is that it "
          : "It helps the match because it ";

  const locationStyle = getLocationStyle(location, metrics);
  let styleTail = "";

  if (item.key === "jobs" && locationStyle === "growth-market") {
    styleTail = " for a market that is still expanding.";
  } else if (item.key === "mobility" && locationStyle === "dense-urban") {
    styleTail = " in a truly urban way.";
  } else if (item.key === "lifestyle" && locationStyle === "outdoor-focused") {
    styleTail = " without losing day-to-day practicality.";
  } else if ((item.key === "schools" || item.key === "healthcare") && locationStyle === "institution-driven") {
    styleTail = " thanks to its institution-heavy base.";
  } else if (item.key === "affordability" && locationStyle === "value-leaning") {
    styleTail = " for a market that still feels comparatively attainable.";
  } else {
    styleTail = ".";
  }

  return `${emphasis}${describeCategoryStrength(item.key, location, metrics)}${styleTail}`;
}

function buildReasons(
  location: Location,
  metrics: LocationMetrics,
  scores: Record<CategoryKey, number>,
  weights: CategoryWeightMap
) {
  const topPriorityKeys = getTopPriorityKeys(weights);

  return sortCategoriesForReasons(scores, weights)
    .slice(0, 3)
    .map((item) => buildReasonSentence(location, metrics, item, topPriorityKeys));
}

function buildTradeoffs(
  location: Location,
  metrics: LocationMetrics,
  scores: Record<CategoryKey, number>,
  weights: CategoryWeightMap,
  blockedBy: string[]
) {
  const tradeoffs: string[] = [];

  if (blockedBy.length > 0) {
    tradeoffs.push(...blockedBy.slice(0, 2));
  }

  for (const item of sortCategoriesForTradeoffs(scores, weights)) {
    const nextTradeoff = describeCategoryTradeoff(item.key, metrics, location);

    if (!tradeoffs.includes(nextTradeoff)) {
      tradeoffs.push(nextTradeoff);
    }

    if (tradeoffs.length >= 3) {
      break;
    }
  }

  return tradeoffs.slice(0, 3);
}

export function getRecommendations(
  request: Pick<RecommendationRequest, "weights" | "dealBreakers">,
  inputs: ScoringInput[]
): RecommendationResult[] {
  const weights = normalizeWeights(request.weights);

  return inputs
    .map(({ location, metrics }) => {
      const categoryScores = buildCategoryScores(location, metrics);
      const blockedBy = evaluateDealBreakers(metrics, request.dealBreakers);
      const weightedScore = (Object.entries(weights) as Array<[CategoryKey, number]>).reduce(
        (sum, [category, weight]) => sum + categoryScores[category] * weight,
        0
      );
      const penalty =
        blockedBy.length > 0
          ? Math.min(0.78, 0.42 + Math.max(0, blockedBy.length - 1) * 0.14)
          : 0;

      return {
        location,
        categoryScores,
        overallScore: clampScore(weightedScore - penalty),
        reasons: buildReasons(location, metrics, categoryScores, weights),
        tradeoffs: buildTradeoffs(location, metrics, categoryScores, weights, blockedBy),
        blockedBy
      };
    })
    .sort((left, right) => {
      const blockedDelta = left.blockedBy.length - right.blockedBy.length;

      if (blockedDelta !== 0) {
        return blockedDelta;
      }

      return right.overallScore - left.overallScore;
    });
}
