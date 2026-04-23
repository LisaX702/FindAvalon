import { PrismaClient } from "@prisma/client";
import { getRecommendations } from "@relocateit/scoring";

const prisma = new PrismaClient();

const QA_PROFILES = [
  {
    name: "Dense urban / transit-heavy / job-focused",
    weights: {
      affordability: 0.06,
      jobs: 0.26,
      climate: 0.06,
      safety: 0.1,
      schools: 0.06,
      healthcare: 0.1,
      mobility: 0.26,
      lifestyle: 0.1
    },
    dealBreakers: {
      maxHousingCostIndex: 0.95,
      minSafetyScore: 0.45,
      minWalkabilityScore: 0.6
    }
  },
  {
    name: "Affordability-first / flexible lifestyle",
    weights: {
      affordability: 0.3,
      jobs: 0.12,
      climate: 0.08,
      safety: 0.12,
      schools: 0.06,
      healthcare: 0.08,
      mobility: 0.08,
      lifestyle: 0.16
    },
    dealBreakers: {
      maxHousingCostIndex: 0.62,
      minSafetyScore: 0.5
    }
  },
  {
    name: "Outdoor / recreation / lower-cost",
    weights: {
      affordability: 0.22,
      jobs: 0.08,
      climate: 0.12,
      safety: 0.12,
      schools: 0.05,
      healthcare: 0.07,
      mobility: 0.08,
      lifestyle: 0.26
    },
    dealBreakers: {
      maxHousingCostIndex: 0.68,
      maxDisasterRiskIndex: 0.45,
      preferredClimate: {
        min: 0.5
      }
    }
  },
  {
    name: "Family / schools / safety",
    weights: {
      affordability: 0.12,
      jobs: 0.1,
      climate: 0.06,
      safety: 0.24,
      schools: 0.24,
      healthcare: 0.12,
      mobility: 0.04,
      lifestyle: 0.08
    },
    dealBreakers: {
      minSafetyScore: 0.62,
      maxDisasterRiskIndex: 0.4,
      maxHousingCostIndex: 0.78
    }
  },
  {
    name: "Low-tax / lower-cost / car-oriented",
    weights: {
      affordability: 0.3,
      jobs: 0.14,
      climate: 0.1,
      safety: 0.12,
      schools: 0.06,
      healthcare: 0.08,
      mobility: 0.04,
      lifestyle: 0.16
    },
    dealBreakers: {
      maxTaxBurdenIndex: 0.45,
      maxHousingCostIndex: 0.62
    }
  },
  {
    name: "Healthcare-heavy / retiree-ish / calmer pace",
    weights: {
      affordability: 0.14,
      jobs: 0.04,
      climate: 0.14,
      safety: 0.18,
      schools: 0.02,
      healthcare: 0.28,
      mobility: 0.04,
      lifestyle: 0.16
    },
    dealBreakers: {
      minSafetyScore: 0.6,
      maxDisasterRiskIndex: 0.35,
      preferredClimate: {
        min: 0.55
      }
    }
  },
  {
    name: "Walkability-first / moderate affordability",
    weights: {
      affordability: 0.16,
      jobs: 0.12,
      climate: 0.08,
      safety: 0.1,
      schools: 0.06,
      healthcare: 0.08,
      mobility: 0.28,
      lifestyle: 0.12
    },
    dealBreakers: {
      minWalkabilityScore: 0.68,
      maxHousingCostIndex: 0.82
    }
  },
  {
    name: "Climate-sensitive / milder weather preference",
    weights: {
      affordability: 0.12,
      jobs: 0.1,
      climate: 0.28,
      safety: 0.12,
      schools: 0.04,
      healthcare: 0.1,
      mobility: 0.08,
      lifestyle: 0.16
    },
    dealBreakers: {
      preferredClimate: {
        min: 0.7,
        max: 0.9
      },
      maxDisasterRiskIndex: 0.5
    }
  }
];

function summarizeResult(result) {
  return {
    slug: result.location.slug,
    name: `${result.location.name}, ${result.location.state}`,
    overallScore: Number(result.overallScore.toFixed(3)),
    blockedBy: result.blockedBy,
    topReason: result.reasons[0] ?? null,
    topTradeoff: result.tradeoffs[0] ?? null
  };
}

async function main() {
  const locations = await prisma.location.findMany({
    include: {
      metrics: true
    }
  });

  const inputs = locations
    .filter((entry) => entry.metrics)
    .map((entry) => ({
      location: {
        id: entry.id,
        slug: entry.slug,
        name: entry.name,
        state: entry.state,
        country: entry.country,
        population: entry.population,
        description: entry.description ?? undefined
      },
      metrics: {
        housingCostIndex: entry.metrics.housingCostIndex,
        taxBurdenIndex: entry.metrics.taxBurdenIndex,
        climateScore: entry.metrics.climateScore,
        safetyScore: entry.metrics.safetyScore,
        educationScore: entry.metrics.educationScore,
        healthcareScore: entry.metrics.healthcareScore,
        jobMarketScore: entry.metrics.jobMarketScore,
        walkabilityScore: entry.metrics.walkabilityScore,
        transitScore: entry.metrics.transitScore,
        recreationScore: entry.metrics.recreationScore,
        internetQualityScore: entry.metrics.internetQualityScore,
        disasterRiskIndex: entry.metrics.disasterRiskIndex
      }
    }));

  const report = QA_PROFILES.map((profile) => {
    const results = getRecommendations(
      {
        weights: profile.weights,
        dealBreakers: profile.dealBreakers
      },
      inputs
    );

    const topFive = results.slice(0, 5).map(summarizeResult);
    const blockedInTopTen = results.slice(0, 10).filter((item) => item.blockedBy.length > 0).length;
    const blockedFirst = results.findIndex((item) => item.blockedBy.length > 0);

    return {
      profile: profile.name,
      blockedInTopTen,
      firstBlockedIndex: blockedFirst,
      topFive
    };
  });

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
