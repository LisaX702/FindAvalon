"use client";

import { LOCATION_CATEGORIES } from "@relocateit/constants";
import type { RecommendationFeed, RecommendationResult } from "@relocateit/types";
import { useEffect, useState } from "react";
import { CompareButton } from "./compare-button";
import { FavoriteButton } from "./favorite-button";
import { fetchRecommendations } from "../lib/api";

type ResultsListProps = {
  initialComparedIds: string[];
  initialData?: RecommendationFeed;
};

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function getSortedCategories(result: RecommendationResult) {
  return LOCATION_CATEGORIES.map((category) => ({
    key: category.key,
    label: category.label,
    description: category.description,
    score: result.categoryScores[category.key]
  })).sort((left, right) => right.score - left.score);
}

function buildBestForSummary(result: RecommendationResult) {
  const strongest = getSortedCategories(result).slice(0, 2);

  if (strongest.length === 0) {
    return "Good fit if you want a balanced option across the core decision categories.";
  }

  if (strongest.length === 1) {
    return `Best for people prioritizing ${strongest[0].label.toLowerCase()}.`;
  }

  return `Best for people prioritizing ${strongest[0].label.toLowerCase()} and ${strongest[1].label.toLowerCase()}.`;
}

function getStrengthCategories(result: RecommendationResult) {
  return getSortedCategories(result).slice(0, 3);
}

function getWatchoutCategories(result: RecommendationResult) {
  return getSortedCategories(result).slice(-2).reverse();
}

function buildConstraintSummary(result: RecommendationResult) {
  if (result.blockedBy.length === 0) {
    return null;
  }

  if (result.blockedBy.length === 1) {
    return `Filtered down by one deal-breaker: ${result.blockedBy[0]}`;
  }

  return `Held back by ${result.blockedBy.length} deal-breakers, starting with: ${result.blockedBy[0]}`;
}

function buildLowerRankSummary(result: RecommendationResult, rank: number) {
  const weakest = getWatchoutCategories(result);
  const leadingTradeoff = result.tradeoffs[0];

  if (result.blockedBy.length > 0) {
    return "Strong fit in some areas, but your saved constraints are pushing this lower in the list.";
  }

  if (rank === 0) {
    return "This currently leads because its strongest categories stay aligned without a major constraint dragging it down.";
  }

  if (leadingTradeoff) {
    return `Ranked a bit lower because ${leadingTradeoff.charAt(0).toLowerCase()}${leadingTradeoff.slice(1)}`;
  }

  if (weakest.length > 0) {
    return `Ranked a bit lower because ${weakest[0].label.toLowerCase()} is not keeping up with the strongest matches.`;
  }

  return "Ranked slightly lower because a few practical tradeoffs are softening the overall fit.";
}

export function ResultsList({ initialComparedIds, initialData }: ResultsListProps) {
  const [comparedIds, setComparedIds] = useState(initialComparedIds);
  const [data, setData] = useState<RecommendationFeed | null>(initialData ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(!initialData);

  useEffect(() => {
    let cancelled = false;

    if (initialData) {
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    void fetchRecommendations()
      .then((response) => {
        if (!cancelled) {
          setData(response);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error ? requestError.message : "Failed to load recommendations."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialData]);

  if (isLoading) {
    return (
      <section className="panel">
        <p>Scoring locations from persisted profile data...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="panel">
        <p className="error-text">{error}</p>
        <div className="button-row">
          <a className="secondary-button" href="/preferences">
            Complete preferences
          </a>
          <a className="secondary-button" href="/">
            Open dashboard
          </a>
        </div>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="panel empty-panel">
        <p className="eyebrow">Recommendations</p>
        <h2>No recommendations yet.</h2>
        <p className="muted">
          Save a preference profile first, then come back here to rank seeded locations against
          your priorities.
        </p>
        <div className="button-row">
          <a className="primary-button" href="/preferences">
            Complete preferences
          </a>
          <a className="secondary-button" href="/">
            Open dashboard
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="stack">
      <div className="results-header panel">
        <div>
          <p className="eyebrow">Results</p>
          <h2>{data.profile.label}</h2>
          <p className="muted">
            Ranked from {data.totalLocations} seeded locations using your saved current profile.
          </p>
        </div>
        <div className="header-actions">
          <a className="secondary-button" href="/compare">
            View compare ({comparedIds.length})
          </a>
          <a className="secondary-button" href="/saved">
            View saved places
          </a>
          <a className="secondary-button" href="/">
            Open dashboard
          </a>
          <a className="secondary-button" href="/preferences">
            Edit preferences
          </a>
        </div>
      </div>

      {data.results.map((result, index) => {
        const strongestCategories = getStrengthCategories(result);
        const weakestCategories = getWatchoutCategories(result);
        const constraintSummary = buildConstraintSummary(result);
        const rankSummary = buildLowerRankSummary(result, index);

        return (
          <article
            key={result.location.id}
            className={index === 0 ? "panel result-card result-card-top" : "panel result-card"}
          >
            <div className="result-topline">
              <div className="result-heading">
                <div className="result-rank-row">
                  <span className={index === 0 ? "rank-pill rank-pill-top" : "rank-pill"}>
                    #{index + 1}
                  </span>
                  {index === 0 ? (
                    <span className="status-chip status-chip-active">Top match</span>
                  ) : null}
                  {Boolean(result.location.isSaved) ? (
                    <span className="status-chip status-chip-active">Saved</span>
                  ) : null}
                  {comparedIds.includes(result.location.id) ? (
                    <span className="status-chip status-chip-active">In compare</span>
                  ) : null}
                </div>

                <div>
                  <h3>
                    <a href={`/locations/${result.location.slug}`}>
                      {result.location.name}, {result.location.state}
                    </a>
                  </h3>
                  <p className="muted">
                    Population {result.location.population.toLocaleString()} {" | "}{" "}
                    {result.location.description}
                  </p>
                </div>

                <p className="result-fit-copy">{buildBestForSummary(result)}</p>
                <p className="muted helper-copy">
                  Save strong candidates, compare finalists, or open details when you want the full breakdown.
                </p>
                <div className="result-trust-stack">
                  <p className={constraintSummary ? "trust-note trust-note-warning" : "trust-note"}>
                    <strong>{constraintSummary ? "Constraint signal" : "Why it sits here"}</strong>
                    <span>{constraintSummary ?? rankSummary}</span>
                  </p>
                  {constraintSummary ? (
                    <p className="trust-note">
                      <strong>Ranking context</strong>
                      <span>{rankSummary}</span>
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="result-actions result-actions-prominent">
                <FavoriteButton
                  initialSaved={Boolean(result.location.isSaved)}
                  locationId={result.location.id}
                />
                <CompareButton
                  currentCount={comparedIds.length}
                  initialCompared={comparedIds.includes(result.location.id)}
                  locationId={result.location.id}
                  onToggle={(nextCompared) => {
                    setComparedIds((current) =>
                      nextCompared
                        ? [...current, result.location.id]
                        : current.filter((entry) => entry !== result.location.id)
                    );
                  }}
                />
                <a className="secondary-button" href={`/locations/${result.location.slug}`}>
                  Open details
                </a>
                <div className="score-pill result-score-pill">
                  <small>Fit</small>
                  <strong>{formatPercent(result.overallScore)}</strong>
                </div>
              </div>
            </div>

            <div className="result-grid result-grid-polished">
              <section className="detail-subsection">
                <h4>Why it ranks highly</h4>
                <ul className="plain-list detail-list">
                  {(result.reasons.length > 0
                    ? result.reasons.slice(0, 3)
                    : strongestCategories.map(
                        (entry) => `${entry.label} is one of this location's strongest categories.`
                      )
                  ).map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </section>

              <section className="detail-subsection">
                <h4>Watchouts</h4>
                <ul className="plain-list detail-list">
                  {(result.tradeoffs.length > 0
                    ? result.tradeoffs.slice(0, 3)
                    : weakestCategories.map(
                        (entry) => `${entry.label} is a weaker part of the fit for this location.`
                      )
                  ).map((tradeoff) => (
                    <li key={tradeoff}>{tradeoff}</li>
                  ))}
                  {result.blockedBy.map((blocked) => (
                    <li key={blocked} className="warning-text">
                      {blocked}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="detail-subsection">
                <h4>Strongest categories</h4>
                <div className="result-category-summary">
                  {strongestCategories.map((category) => (
                    <div key={category.key} className="result-category-chip">
                      <span>{category.label}</span>
                      <strong>{formatPercent(category.score)}</strong>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="category-score-grid">
              {LOCATION_CATEGORIES.map((category) => (
                <div
                  key={category.key}
                  className={
                    strongestCategories.some((entry) => entry.key === category.key)
                      ? "mini-score mini-score-highlight"
                      : "mini-score"
                  }
                >
                  <span>{category.label}</span>
                  <strong>{formatPercent(result.categoryScores[category.key])}</strong>
                </div>
              ))}
            </div>
          </article>
        );
      })}
    </section>
  );
}
