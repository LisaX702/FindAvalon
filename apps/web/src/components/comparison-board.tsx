"use client";

import { LOCATION_CATEGORIES } from "@relocateit/constants";
import type { ComparisonPayload, LocationMetrics } from "@relocateit/types";
import { Fragment, useMemo, useState } from "react";
import { CompareButton } from "./compare-button";

type ComparisonBoardProps = {
  initialData: ComparisonPayload;
};

const METRIC_LABELS: Record<keyof LocationMetrics, string> = {
  housingCostIndex: "Housing cost pressure",
  taxBurdenIndex: "Tax pressure",
  jobMarketScore: "Job market",
  climateScore: "Climate",
  safetyScore: "Safety",
  educationScore: "Schools",
  healthcareScore: "Healthcare",
  walkabilityScore: "Walkability",
  transitScore: "Transit",
  recreationScore: "Recreation",
  internetQualityScore: "Internet quality",
  disasterRiskIndex: "Disaster risk"
};

const METRIC_HELPERS: Record<keyof LocationMetrics, string> = {
  housingCostIndex: "Lower is easier on a housing budget.",
  taxBurdenIndex: "Lower means a lighter tax load.",
  jobMarketScore: "Higher means stronger local job opportunity.",
  climateScore: "Higher means a milder everyday climate fit.",
  safetyScore: "Higher means stronger overall safety conditions.",
  educationScore: "Higher means stronger school quality.",
  healthcareScore: "Higher means stronger access to care.",
  walkabilityScore: "Higher means more errands and daily life on foot.",
  transitScore: "Higher means better public transportation coverage.",
  recreationScore: "Higher means more outdoor and leisure access.",
  internetQualityScore: "Higher means stronger connectivity quality.",
  disasterRiskIndex: "Lower means less disaster exposure."
};

function formatPercent(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "—";
  }

  return `${Math.round(value * 100)}`;
}

function formatMetricValue(value: number) {
  return `${Math.round(value * 100)}`;
}

function getHighlight(values: Array<number | null | undefined>, currentValue: number | null | undefined) {
  if (typeof currentValue !== "number") {
    return "";
  }

  const comparableValues = values.filter((value): value is number => typeof value === "number");

  if (comparableValues.length < 2) {
    return "";
  }

  const max = Math.max(...comparableValues);
  const min = Math.min(...comparableValues);

  if (max === min) {
    return "";
  }

  if (currentValue === max) {
    return "is-best";
  }

  if (currentValue === min) {
    return "is-worst";
  }

  return "";
}

function isLowerBetter(metricKey: keyof LocationMetrics) {
  return metricKey === "housingCostIndex" || metricKey === "taxBurdenIndex" || metricKey === "disasterRiskIndex";
}

function getHighlightForMetric(
  metricKey: keyof LocationMetrics,
  values: Array<number | null | undefined>,
  currentValue: number | null | undefined
) {
  if (!isLowerBetter(metricKey)) {
    return getHighlight(values, currentValue);
  }

  if (typeof currentValue !== "number") {
    return "";
  }

  const comparableValues = values.filter((value): value is number => typeof value === "number");

  if (comparableValues.length < 2) {
    return "";
  }

  const min = Math.min(...comparableValues);
  const max = Math.max(...comparableValues);

  if (min === max) {
    return "";
  }

  if (currentValue === min) {
    return "is-best";
  }

  if (currentValue === max) {
    return "is-worst";
  }

  return "";
}

function getSummaryLabel(categoryKeys: string[]) {
  if (categoryKeys.length === 0) {
    return "No recommendation fit summary yet.";
  }

  if (categoryKeys.length === 1) {
    return `Best for people prioritizing ${categoryKeys[0]}.`;
  }

  return `Best for people prioritizing ${categoryKeys.slice(0, 2).join(" and ")}.`;
}

function getCompareTrustSummary(
  entry: ComparisonPayload["entries"][number],
  isLeader: boolean
) {
  if (isLeader) {
    return entry.strengths[0] ?? "This finalist is currently leading on overall fit.";
  }

  if (entry.tradeoffs[0]) {
    return `Currently trailing because ${entry.tradeoffs[0].charAt(0).toLowerCase()}${entry.tradeoffs[0].slice(1)}`;
  }

  return "Currently trailing because its practical tradeoffs are stacking up more than the current leader.";
}

function buildDecisionGapNote(
  entry: ComparisonPayload["entries"][number],
  currentLeader: ComparisonPayload["entries"][number] | undefined
) {
  if (!currentLeader || currentLeader.location.id === entry.location.id) {
    return null;
  }

  const leaderScore = currentLeader.overallScore;
  const currentScore = entry.overallScore;

  if (typeof leaderScore !== "number" || typeof currentScore !== "number") {
    return null;
  }

  const gap = leaderScore - currentScore;

  if (gap >= 0.08) {
    return `Meaningfully behind ${currentLeader.location.name}. Consider removing this finalist after one last detail-page check.`;
  }

  if (gap >= 0.04) {
    return `Slightly behind ${currentLeader.location.name}. Keep it only if its strengths still matter more to you than the tradeoffs.`;
  }

  return `Still close to ${currentLeader.location.name}. Keep comparing before you narrow the set.`;
}

export function ComparisonBoard({ initialData }: ComparisonBoardProps) {
  const [data, setData] = useState(initialData);

  const gridTemplateColumns = `minmax(180px, 1.1fr) repeat(${Math.max(data.entries.length, 1)}, minmax(180px, 1fr))`;
  const overallScores = data.entries.map((entry) => entry.overallScore ?? null);
  const comparableOverallScores = overallScores.filter((score): score is number => typeof score === "number");
  const topOverallScore = comparableOverallScores.length > 0 ? Math.max(...comparableOverallScores) : null;

  const categoryValueMap = useMemo(
    () =>
      Object.fromEntries(
        LOCATION_CATEGORIES.map((category) => [
          category.key,
          data.entries.map((entry) => entry.categoryScores?.[category.key] ?? null)
        ])
      ) as Record<string, Array<number | null>>,
    [data.entries]
  );

  const rawMetricMap = useMemo(
    () =>
      Object.fromEntries(
        Object.keys(METRIC_LABELS).map((metricKey) => [
          metricKey,
          data.entries.map((entry) => entry.metrics[metricKey as keyof LocationMetrics])
        ])
      ) as Record<string, number[]>,
    [data.entries]
  );

  const compareCount = data.selection.locationIds.length;
  const rankedEntries = [...data.entries].sort(
    (left, right) => (right.overallScore ?? -1) - (left.overallScore ?? -1)
  );
  const currentLeader = rankedEntries[0];
  const secondPlace = rankedEntries[1];

  return (
    <section className="stack">
      <div className="results-header panel">
        <div>
          <p className="eyebrow">Decision desk</p>
          <h2>{compareCount} selected finalist(s)</h2>
          <p className="muted">
            Compare {data.selection.minLocations} to {data.selection.maxLocations} places side by
            side to see who leads overall, where each finalist is strongest, and which tradeoffs still
            need a closer look.
          </p>
        </div>
        <div className="header-actions">
          <a className="secondary-button" href="/results">
            View recommendations
          </a>
          <a className="secondary-button" href="/saved">
            View saved places
          </a>
        </div>
      </div>

      {compareCount === 0 ? (
        <section className="panel compare-empty">
          <p className="eyebrow">Compare places</p>
          <h3>No locations selected yet.</h3>
          <p className="muted">
            Add locations from recommendations, detail pages, or saved places to start a side-by-side
            decision pass.
          </p>
          <div className="helper-panel">
            <p>
              Compare works best once you have a shortlist of two to four realistic finalists.
              Start by saving a few strong options, then move the best ones here.
            </p>
          </div>
          <div className="button-row">
            <a className="primary-button" href="/results">
              View recommendations
            </a>
            <a className="secondary-button" href="/saved">
              View saved places
            </a>
          </div>
        </section>
      ) : null}

      {compareCount === 1 ? (
        <section className="panel compare-empty">
          <p className="eyebrow">One finalist selected</p>
          <h3>Add one more location to compare.</h3>
          <p className="muted">
            You need at least two selected locations before the side-by-side comparison becomes useful.
          </p>
          <div className="helper-panel">
            <p>
              Keep this finalist if it still feels strong, then add one more shortlist option so you
              can compare strengths, tradeoffs, and practical factors directly.
            </p>
          </div>
          <div className="button-row">
            <a className="primary-button" href="/results">
              Add another place
            </a>
            <a className="secondary-button" href="/saved">
              View saved places
            </a>
          </div>
        </section>
      ) : null}

      {data.entries.length > 0 ? (
        <section className="stack">
          {compareCount >= 2 && currentLeader ? (
            <section className="panel stack">
              <div className="results-header">
                <div>
                  <p className="eyebrow">Current read</p>
                  <h3>
                    {currentLeader.location.name} is your current leader.
                  </h3>
                  <p className="muted">
                    {secondPlace
                      ? `${currentLeader.location.name} currently leads this set. Use the category and tradeoff rows below to decide whether that lead is strong enough to keep or whether another finalist still deserves to stay in the race.`
                      : "Use the rows below to judge whether this finalist still deserves a place in your decision set."}
                  </p>
                </div>
                <div className="header-actions">
                  <a className="secondary-button" href={`/locations/${currentLeader.location.slug}`}>
                    Review current leader
                  </a>
                  <a className="secondary-button" href="/saved">
                    View saved places
                  </a>
                </div>
              </div>
              <div className="dashboard-grid compare-summary-grid">
                {rankedEntries.map((entry, index) => {
                  const strongestCategories = LOCATION_CATEGORIES
                    .map((category) => ({
                      label: category.label.toLowerCase(),
                      value: entry.categoryScores?.[category.key] ?? null
                    }))
                    .filter((category) => typeof category.value === "number")
                    .sort((left, right) => (right.value ?? 0) - (left.value ?? 0))
                    .slice(0, 2)
                    .map((category) => category.label);

                  return (
                    <article
                      key={`${entry.location.id}-summary`}
                      className={`dashboard-card action-card ${index === 0 ? "action-card-primary" : ""}`}
                    >
                      <div className="result-rank-row">
                        <span className={`rank-pill ${index === 0 ? "rank-pill-top" : ""}`}>
                          {index === 0 ? "Leader" : `Option ${entry.position}`}
                        </span>
                        <span className="status-chip">{formatPercent(entry.overallScore)} overall</span>
                      </div>
                      <div>
                        <h3>
                          <a href={`/locations/${entry.location.slug}`}>
                            {entry.location.name}, {entry.location.state}
                          </a>
                        </h3>
                        <p className="muted">{getSummaryLabel(strongestCategories)}</p>
                      </div>
                      <p className={index === 0 ? "trust-note trust-note-success" : "trust-note"}>
                        <strong>{index === 0 ? "Why it leads" : "Why it trails"}</strong>
                        <span>{getCompareTrustSummary(entry, index === 0)}</span>
                      </p>
                      {index > 0 ? (
                        <p className="trust-note trust-note-warning">
                          <strong>Keep or remove?</strong>
                          <span>{buildDecisionGapNote(entry, currentLeader)}</span>
                        </p>
                      ) : null}
                      <p className="muted">
                        {index === 0
                          ? entry.tradeoffs[0] ?? "Open details if you want a deeper read on the remaining tradeoffs."
                          : entry.strengths[0] ?? "Open details if you want a deeper read on what still works here."}
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section className="panel stack">
            <div className="results-header">
              <div>
                <p className="eyebrow">Side-by-side comparison</p>
                <h3>Compare overall fit, strongest categories, watchouts, and practical factors.</h3>
                <p className="muted">
                  Green cells mark the strongest performer in a row. Soft red cells mark the weakest
                  performer when there is a meaningful spread. Use the weaker rows to decide who is ready to drop from compare.
                </p>
              </div>
            </div>
          <div className="compare-grid" style={{ gridTemplateColumns }}>
            <div className="compare-label">Location</div>
            {data.entries.map((entry) => (
              <div
                key={entry.location.id}
                className={`compare-column compare-column-top ${entry.overallScore === topOverallScore ? "compare-column-leader" : ""}`}
              >
                <div className="stack">
                  <div>
                    <div className="result-rank-row">
                      <span className={`rank-pill ${entry.overallScore === topOverallScore ? "rank-pill-top" : ""}`}>
                        {entry.overallScore === topOverallScore ? "Current leader" : `Finalist ${entry.position}`}
                      </span>
                    </div>
                    <h3>
                      <a href={`/locations/${entry.location.slug}`}>{entry.location.name}, {entry.location.state}</a>
                    </h3>
                    <p className="muted">{entry.location.description}</p>
                  </div>
                  <div className="status-row">
                    <span className="status-chip status-chip-active">{formatPercent(entry.overallScore)} overall</span>
                  </div>
                  <div className="saved-card-actions compare-card-actions">
                    <a className="secondary-button" href={`/locations/${entry.location.slug}`}>
                      Open details
                    </a>
                    <CompareButton
                      currentCount={compareCount}
                      initialCompared
                      locationId={entry.location.id}
                      onToggle={(nextCompared) => {
                        if (!nextCompared) {
                          setData((current) => ({
                            ...current,
                            selection: {
                              ...current.selection,
                              locationIds: current.selection.locationIds.filter((id) => id !== entry.location.id),
                              locations: current.selection.locations.filter((location) => location.id !== entry.location.id),
                              count: current.selection.count - 1
                            },
                            entries: current.entries.filter((currentEntry) => currentEntry.location.id !== entry.location.id)
                          }));
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="compare-section-bar" style={{ gridColumn: `1 / span ${data.entries.length + 1}` }}>
              Overall fit
            </div>
            <div className="compare-label">Overall score</div>
            {data.entries.map((entry) => (
              <div
                key={`${entry.location.id}-overall`}
                className={`compare-cell ${getHighlight(overallScores, entry.overallScore)}`}
              >
                <strong>{formatPercent(entry.overallScore)}</strong>
                <small>{entry.overallScore === topOverallScore ? "Current leader in this compare set" : "Overall fit in this compare set"}</small>
                {entry.overallScore !== topOverallScore ? (
                  <small className="compare-cell-note">
                    {entry.tradeoffs[0]
                      ? `Held back mostly by: ${entry.tradeoffs[0]}`
                      : "Trailing because one or two practical categories are weaker."}
                  </small>
                ) : (
                  <small className="compare-cell-note">
                    {entry.strengths[0] ?? "Currently winning on the overall recommendation balance."}
                  </small>
                )}
              </div>
            ))}

            <div className="compare-section-bar" style={{ gridColumn: `1 / span ${data.entries.length + 1}` }}>
              Strongest categories
            </div>
            {LOCATION_CATEGORIES.map((category) => (
              <Fragment key={category.key}>
                <div key={`${category.key}-label`} className="compare-label">
                  <strong>{category.label}</strong>
                  <small>How strongly this place fits that part of your recommendation profile.</small>
                </div>
                {data.entries.map((entry) => (
                  <div
                    key={`${entry.location.id}-${category.key}`}
                    className={`compare-cell ${getHighlight(
                      categoryValueMap[category.key],
                      entry.categoryScores?.[category.key]
                    )}`}
                  >
                    <strong>{formatPercent(entry.categoryScores?.[category.key])}</strong>
                    <small>
                      {getHighlight(categoryValueMap[category.key], entry.categoryScores?.[category.key]) === "is-best"
                        ? "Strongest in this category"
                        : getHighlight(categoryValueMap[category.key], entry.categoryScores?.[category.key]) === "is-worst"
                          ? "Weakest in this category"
                          : "Middle of the pack"}
                    </small>
                  </div>
                ))}
              </Fragment>
            ))}

            <div className="compare-section-bar" style={{ gridColumn: `1 / span ${data.entries.length + 1}` }}>
              Practical factors
            </div>
            {Object.entries(METRIC_LABELS).map(([metricKey, label]) => (
              <Fragment key={metricKey}>
                <div key={`${metricKey}-label`} className="compare-label">
                  <strong>{label}</strong>
                  <small>{METRIC_HELPERS[metricKey as keyof LocationMetrics]}</small>
                </div>
                {data.entries.map((entry) => (
                  <div
                    key={`${entry.location.id}-${metricKey}`}
                    className={`compare-cell compare-cell-metric ${getHighlightForMetric(
                      metricKey as keyof LocationMetrics,
                      rawMetricMap[metricKey],
                      entry.metrics[metricKey as keyof LocationMetrics]
                    )}`}
                  >
                    <strong>{formatMetricValue(entry.metrics[metricKey as keyof LocationMetrics])}</strong>
                    <small>
                      {getHighlightForMetric(
                        metricKey as keyof LocationMetrics,
                        rawMetricMap[metricKey],
                        entry.metrics[metricKey as keyof LocationMetrics]
                      ) === "is-best"
                        ? "Strongest practical reading"
                        : getHighlightForMetric(
                              metricKey as keyof LocationMetrics,
                              rawMetricMap[metricKey],
                              entry.metrics[metricKey as keyof LocationMetrics]
                            ) === "is-worst"
                          ? "Weakest practical reading"
                          : "Comparable option"}
                    </small>
                  </div>
                ))}
              </Fragment>
            ))}

            <div className="compare-section-bar" style={{ gridColumn: `1 / span ${data.entries.length + 1}` }}>
              Strengths and watchouts
            </div>
            <div className="compare-label">
              <strong>Strongest signals</strong>
              <small>Why this finalist may deserve to stay on your shortlist.</small>
            </div>
            {data.entries.map((entry) => (
              <div key={`${entry.location.id}-strengths`} className="compare-cell compare-cell-list">
                <ul className="plain-list">
                  {entry.strengths.length > 0 ? (
                    entry.strengths.map((strength) => <li key={strength}>{strength}</li>)
                  ) : (
                    <li>No recommendation profile is available yet.</li>
                  )}
                </ul>
              </div>
            ))}

            <div className="compare-label">
              <strong>Watchouts and tradeoffs</strong>
              <small>What might make you pause or open details for a closer read.</small>
            </div>
            {data.entries.map((entry) => (
              <div key={`${entry.location.id}-tradeoffs`} className="compare-cell compare-cell-list">
                <ul className="plain-list">
                  {entry.tradeoffs.length > 0 ? (
                    entry.tradeoffs.map((tradeoff) => <li key={tradeoff}>{tradeoff}</li>)
                  ) : (
                    <li>No tradeoff notes available.</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
          {compareCount >= 2 && currentLeader ? (
            <div className="helper-panel">
              <p className="eyebrow">Decision handoff</p>
              <strong>Use compare to narrow to one or two strongest finalists.</strong>
              <p className="muted">
                Review the current leader first, then remove any trailing finalist whose tradeoffs still feel decisive. If the top two remain close, keep them both and open details before choosing.
              </p>
            </div>
          ) : null}
          </section>
        </section>
      ) : null}
    </section>
  );
}
