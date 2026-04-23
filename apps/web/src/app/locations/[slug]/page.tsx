import { LOCATION_CATEGORIES } from "@relocateit/constants";
import type { LocationMetrics, RecommendationResult } from "@relocateit/types";
import { CompareButton } from "../../../components/compare-button";
import { FavoriteButton } from "../../../components/favorite-button";
import { requireCurrentUser } from "../../../lib/auth";
import {
  fetchComparisonPayload,
  fetchCurrentComparison,
  fetchCurrentProfile,
  fetchLocationBySlug,
  fetchRecommendations
} from "../../../lib/api";

export const dynamic = "force-dynamic";

type LocationDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const METRIC_DETAILS: Array<{
  key: keyof LocationMetrics;
  label: string;
  help: string;
  format?: "inverse";
}> = [
  {
    key: "housingCostIndex",
    label: "Housing cost pressure",
    help: "Lower is easier on the budget.",
    format: "inverse"
  },
  {
    key: "taxBurdenIndex",
    label: "Tax pressure",
    help: "Lower means less state and local tax drag.",
    format: "inverse"
  },
  {
    key: "jobMarketScore",
    label: "Job market depth",
    help: "Higher means stronger career opportunity."
  },
  {
    key: "climateScore",
    label: "Climate comfort",
    help: "Higher means a stronger climate fit."
  },
  {
    key: "safetyScore",
    label: "Safety",
    help: "Higher means stronger day-to-day safety."
  },
  {
    key: "educationScore",
    label: "Schools",
    help: "Higher means stronger school quality."
  },
  {
    key: "healthcareScore",
    label: "Healthcare access",
    help: "Higher means better healthcare coverage and quality."
  },
  {
    key: "walkabilityScore",
    label: "Walkability",
    help: "Higher means more errands and routines can happen on foot."
  },
  {
    key: "transitScore",
    label: "Transit access",
    help: "Higher means public transportation is more useful."
  },
  {
    key: "recreationScore",
    label: "Recreation",
    help: "Higher means more parks, activities, and outdoor options."
  },
  {
    key: "internetQualityScore",
    label: "Internet quality",
    help: "Higher means stronger reliability for remote work and streaming."
  },
  {
    key: "disasterRiskIndex",
    label: "Disaster risk",
    help: "Lower means less hazard exposure.",
    format: "inverse"
  }
];

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatMetricScore(value: number, format?: "inverse") {
  const normalized = format === "inverse" ? 1 - value : value;
  return formatPercent(normalized);
}

function buildCategoryScores(metrics: LocationMetrics) {
  return LOCATION_CATEGORIES.map((category) => {
    const score =
      category.key === "affordability"
        ? ((1 - metrics.housingCostIndex) + (1 - metrics.taxBurdenIndex)) / 2
        : category.key === "jobs"
          ? metrics.jobMarketScore
          : category.key === "climate"
            ? metrics.climateScore
            : category.key === "safety"
              ? (metrics.safetyScore + (1 - metrics.disasterRiskIndex)) / 2
              : category.key === "schools"
                ? metrics.educationScore
                : category.key === "healthcare"
                  ? metrics.healthcareScore
                  : category.key === "mobility"
                    ? (metrics.walkabilityScore + metrics.transitScore) / 2
                    : (metrics.recreationScore + metrics.internetQualityScore) / 2;

    return {
      key: category.key,
      label: category.label,
      description: category.description,
      score
    };
  });
}

function summarizeFit(result: RecommendationResult | null, derivedCategoryScores: ReturnType<typeof buildCategoryScores>) {
  const scores = result
    ? LOCATION_CATEGORIES.map((category) => ({
        key: category.key,
        label: category.label,
        description: category.description,
        score: result.categoryScores[category.key]
      }))
    : derivedCategoryScores;

  const sorted = [...scores].sort((left, right) => right.score - left.score);

  return {
    strongest: sorted.slice(0, 3),
    weakest: sorted.slice(-3).reverse()
  };
}

function formatMatchSummary(result: RecommendationResult | null) {
  if (!result) {
    return "Save preferences to see personalized fit explanations for this location.";
  }

  if (result.reasons.length === 0) {
    return `Overall fit ${formatPercent(result.overallScore)} from your current profile.`;
  }

  return `Overall fit ${formatPercent(result.overallScore)} because ${result.reasons[0].charAt(0).toLowerCase()}${result.reasons[0].slice(1)}`;
}

function formatConstraintSummary(result: RecommendationResult | null) {
  if (!result || result.blockedBy.length === 0) {
    return null;
  }

  if (result.blockedBy.length === 1) {
    return `This location is being filtered down by one saved deal-breaker: ${result.blockedBy[0]}`;
  }

  return `This location is being filtered down by ${result.blockedBy.length} saved deal-breakers, starting with: ${result.blockedBy[0]}`;
}

function formatRankingTrustSummary(result: RecommendationResult | null) {
  if (!result) {
    return "Once you save preferences, this page will explain both the fit and the tradeoffs behind the ranking.";
  }

  if (result.blockedBy.length > 0) {
    return "It still has strong fit areas, but your saved constraints are materially holding it back.";
  }

  if (result.tradeoffs.length > 0) {
    return `If it feels lower than expected, the main reason is that ${result.tradeoffs[0].charAt(0).toLowerCase()}${result.tradeoffs[0].slice(1)}`;
  }

  return "Its position is mostly driven by how well the strongest categories stay aligned with your saved priorities.";
}

function buildDecisionFlowSummary(args: {
  isCompared: boolean;
  isCurrentLeader: boolean;
  locationName: string;
  currentLeaderName: string | null;
  trailingReason: string | null;
}) {
  const { currentLeaderName, isCompared, isCurrentLeader, locationName, trailingReason } = args;

  if (!isCompared) {
    return {
      title: "Still outside your finalist set",
      body: "Save it or add it to compare if this still feels like a realistic contender.",
      ctaLabel: "Compare places"
    };
  }

  if (isCurrentLeader) {
    return {
      title: "This place is your current leader",
      body: "Use this page to pressure-test whether its remaining tradeoffs are still acceptable before you make the final call.",
      ctaLabel: "Review current leader"
    };
  }

  if (currentLeaderName) {
    return {
      title: "This finalist is trailing your current leader",
      body: trailingReason
        ? `${locationName} is currently behind ${currentLeaderName} because ${trailingReason.charAt(0).toLowerCase()}${trailingReason.slice(1)}`
        : `${locationName} is currently behind ${currentLeaderName}. Use this page to decide whether its strengths still justify staying in compare.`,
      ctaLabel: "View compare"
    };
  }

  return {
    title: "Still under active review",
    body: "Use this page to decide whether this place should stay in compare or drop back to the wider shortlist.",
    ctaLabel: "View compare"
  };
}

export default async function LocationDetailPage({ params }: LocationDetailPageProps) {
  await requireCurrentUser();
  const { slug } = await params;
  const [detail, profile, comparisonSet, comparisonPayload] = await Promise.all([
    fetchLocationBySlug(slug),
    fetchCurrentProfile(),
    fetchCurrentComparison(),
    fetchComparisonPayload()
  ]);
  const recommendations = profile ? await fetchRecommendations() : null;
  const recommendationContext =
    recommendations?.results.find((result) => result.location.slug === slug) ?? null;
  const categoryScores = buildCategoryScores(detail.metrics);
  const fitSummary = summarizeFit(recommendationContext, categoryScores);
  const isCompared = comparisonSet.locationIds.includes(detail.location.id);
  const isSaved = Boolean(detail.location.isSaved);
  const constraintSummary = formatConstraintSummary(recommendationContext);
  const rankingTrustSummary = formatRankingTrustSummary(recommendationContext);
  const currentLeader = comparisonPayload.entries[0] ?? null;
  const leaderSlug = currentLeader?.location.slug ?? null;
  const leaderName = currentLeader?.location.name ?? null;
  const currentEntry =
    comparisonPayload.entries.find((entry) => entry.location.slug === slug) ?? null;
  const decisionFlowSummary = buildDecisionFlowSummary({
    currentLeaderName: leaderName,
    isCurrentLeader: leaderSlug === slug,
    isCompared,
    locationName: detail.location.name,
    trailingReason: currentEntry?.tradeoffs[0] ?? recommendationContext?.tradeoffs[0] ?? null
  });

  return (
    <main className="page-shell stack-lg">
      <section className="hero hero-wide detail-hero">
        <div className="hero-copy stack">
          <div>
            <p className="eyebrow">Location detail</p>
            <h1>
              {detail.location.name}, {detail.location.state}
            </h1>
            <p className="lead">{detail.location.description}</p>
            <p className="muted">
              Population {detail.location.population.toLocaleString()} {" | "} {detail.location.country}
            </p>
          </div>

          <section className="panel helper-panel">
            <p className="eyebrow">Overview</p>
            <h2>Why this place fits your shortlist</h2>
            <p className="muted">{formatMatchSummary(recommendationContext)}</p>
            <div className="result-trust-stack">
              <p className={constraintSummary ? "trust-note trust-note-warning" : "trust-note"}>
                <strong>{constraintSummary ? "Constraint signal" : "Ranking context"}</strong>
                <span>{constraintSummary ?? rankingTrustSummary}</span>
              </p>
              {constraintSummary ? (
                <p className="trust-note">
                  <strong>What is holding it down</strong>
                  <span>{rankingTrustSummary}</span>
                </p>
              ) : null}
            </div>
            <div className="status-row">
              <span className={isSaved ? "status-chip status-chip-active" : "status-chip"}>
                {isSaved ? "Saved to shortlist" : "Not saved yet"}
              </span>
              <span className={isCompared ? "status-chip status-chip-active" : "status-chip"}>
                {isCompared ? "In compare set" : "Not in compare yet"}
              </span>
              {leaderSlug === slug ? (
                <span className="status-chip status-chip-active">Current leader</span>
              ) : null}
            </div>
            <p className={leaderSlug === slug ? "trust-note trust-note-success" : "trust-note"}>
              <strong>{decisionFlowSummary.title}</strong>
              <span>{decisionFlowSummary.body}</span>
            </p>
          </section>
        </div>

        <aside className="panel detail-actions stack">
          <div>
            <p className="eyebrow">Next actions</p>
            <h2>Keep this decision moving.</h2>
            <p className="muted">
              Save strong candidates, add finalists to compare, and use the current leader as your reference point when you narrow the field.
            </p>
          </div>
          <FavoriteButton initialSaved={isSaved} locationId={detail.location.id} />
          <CompareButton
            currentCount={comparisonSet.count}
            initialCompared={isCompared}
            locationId={detail.location.id}
          />
          <div className="action-list">
            <a className="action-card action-card-primary" href="/results">
              <strong>Back to results</strong>
              <span className="muted">Return to your ranked recommendation list.</span>
            </a>
            <a className="action-card" href="/saved">
              <strong>View saved places</strong>
              <span className="muted">
                {isSaved
                  ? "Review this place alongside the rest of your shortlist."
                  : "Open your shortlist and see what already made the cut."}
              </span>
            </a>
            <a className="action-card" href="/compare">
              <strong>{comparisonSet.count >= comparisonSet.minLocations ? "View compare" : decisionFlowSummary.ctaLabel}</strong>
              <span className="muted">
                {comparisonSet.count >= comparisonSet.minLocations
                  ? leaderSlug === slug
                    ? "This place is currently leading your finalist set. Use compare to decide whether any trailing option still deserves to stay."
                    : leaderName
                      ? `${leaderName} is currently leading your finalist set. Use compare to decide whether this place still deserves to stay.`
                      : `You already have ${comparisonSet.count} place(s) ready for side-by-side review.`
                  : `Add ${Math.max(comparisonSet.minLocations - comparisonSet.count, 1)} more place(s) to unlock side-by-side review.`}
              </span>
            </a>
          </div>
        </aside>
      </section>

      <section className="detail-summary-grid">
        <article className="panel dashboard-card">
          <p className="eyebrow">Recommendation fit</p>
          <h2>
            {recommendationContext ? formatPercent(recommendationContext.overallScore) : "Profile needed"}
          </h2>
          <p className="muted">
            {recommendationContext
              ? "This is the overall fit score for your current saved preferences."
              : "Save preferences to generate a personalized fit score for this location."}
          </p>
        </article>

        <article className="panel dashboard-card">
          <p className="eyebrow">Strongest categories</p>
          <ul className="plain-list detail-list">
            {fitSummary.strongest.map((entry) => (
              <li key={entry.key}>
                <span>
                  <strong>{entry.label}</strong>
                  <small>{entry.description}</small>
                </span>
                <strong>{formatPercent(entry.score)}</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel dashboard-card">
          <p className="eyebrow">Watchouts</p>
          <ul className="plain-list detail-list">
            {fitSummary.weakest.map((entry) => (
              <li key={entry.key}>
                <span>
                  <strong>{entry.label}</strong>
                  <small>{entry.description}</small>
                </span>
                <strong>{formatPercent(entry.score)}</strong>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="detail-content-grid">
        <article className="panel stack">
          <div>
            <p className="eyebrow">Why this matches</p>
            <h2>Readable recommendation context</h2>
            <p className="muted">
              {recommendationContext
                ? "These notes come from the same recommendation engine used on your results page."
                : "You can still review the location profile below, but personalized match explanations appear after preferences are saved."}
            </p>
          </div>

          <div className="detail-section-grid">
            <section className="detail-subsection">
              <h3>Strengths</h3>
              <ul className="plain-list detail-list">
                {(recommendationContext?.reasons.length
                  ? recommendationContext.reasons
                  : fitSummary.strongest.map(
                      (entry) => `${entry.label} looks strong here for this location.`
                    )
                ).map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </section>

            <section className="detail-subsection">
              <h3>Tradeoffs</h3>
              {constraintSummary ? (
                <p className="trust-note trust-note-warning">
                  <strong>Held back by your saved rules</strong>
                  <span>{constraintSummary}</span>
                </p>
              ) : null}
              {isCompared && leaderSlug !== slug && leaderName ? (
                <p className="trust-note">
                  <strong>Decision flow</strong>
                  <span>
                    {detail.location.name} is trailing {leaderName} right now. If the tradeoffs below still feel decisive, this may be the finalist to remove next.
                  </span>
                </p>
              ) : null}
              <ul className="plain-list detail-list">
                {(
                  recommendationContext && recommendationContext.tradeoffs.length > 0
                    ? recommendationContext.tradeoffs
                    : fitSummary.weakest.map(
                        (entry) => `${entry.label} is a weaker part of the fit for this location.`
                      )
                ).map((tradeoff) => (
                  <li key={tradeoff}>{tradeoff}</li>
                ))}
                {recommendationContext?.blockedBy.map((blocked) => (
                  <li key={blocked} className="warning-text">
                    {blocked}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </article>

        <article className="panel stack">
          <div>
            <p className="eyebrow">Category view</p>
            <h2>Where this place is strongest and weaker</h2>
            <p className="muted">
              Each category rolls up the lower-level metrics into a simpler fit view.
            </p>
          </div>
          <div className="category-score-grid">
            {(recommendationContext
              ? LOCATION_CATEGORIES.map((category) => ({
                  key: category.key,
                  label: category.label,
                  description: category.description,
                  score: recommendationContext.categoryScores[category.key]
                }))
              : categoryScores
            ).map((category) => (
              <div key={category.key} className="mini-score detail-category-card">
                <span>{category.label}</span>
                <strong>{formatPercent(category.score)}</strong>
                <small>{category.description}</small>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel stack">
        <div>
          <p className="eyebrow">Metrics</p>
          <h2>Plain-English metric readout</h2>
          <p className="muted">
            These are the seeded inputs behind the score, translated into labels that are easier to scan.
          </p>
        </div>
        <div className="detail-metrics-grid detail-metrics-grid-rich">
          {METRIC_DETAILS.map((metric) => (
            <div key={metric.key} className="detail-metric detail-metric-rich">
              <span>{metric.label}</span>
              <strong>{formatMetricScore(detail.metrics[metric.key], metric.format)}</strong>
              <small>{metric.help}</small>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
