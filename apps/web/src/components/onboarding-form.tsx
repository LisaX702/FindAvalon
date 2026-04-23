"use client";

import { DEFAULT_PROFILE_INPUT, LOCATION_CATEGORIES } from "@relocateit/constants";
import type { DealBreakers, PreferenceProfile, PreferenceProfileInput } from "@relocateit/types";
import type { Route } from "next";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { fetchCurrentProfile, savePreferenceProfile } from "../lib/api";

const STEP_TITLES = ["Priorities", "Constraints", "Review"] as const;

function createInitialProfile(): PreferenceProfileInput {
  return {
    ...DEFAULT_PROFILE_INPUT,
    weights: { ...DEFAULT_PROFILE_INPUT.weights },
    dealBreakers: { ...DEFAULT_PROFILE_INPUT.dealBreakers }
  };
}

type NumericConstraintField =
  | "maxHousingCostIndex"
  | "maxTaxBurdenIndex"
  | "minSafetyScore"
  | "minJobMarketScore"
  | "minWalkabilityScore"
  | "maxDisasterRiskIndex";

const CONSTRAINT_FIELDS: Array<{
  key: NumericConstraintField;
  label: string;
  help: string;
}> = [
  {
    key: "maxHousingCostIndex",
    label: "Maximum housing cost",
    help: "Lower values filter out expensive markets."
  },
  {
    key: "maxTaxBurdenIndex",
    label: "Maximum tax burden",
    help: "Cap state and local tax pressure."
  },
  {
    key: "minSafetyScore",
    label: "Minimum safety",
    help: "Remove locations that fall below your comfort range."
  },
  {
    key: "minJobMarketScore",
    label: "Minimum job market",
    help: "Useful if career opportunity is non-negotiable."
  },
  {
    key: "minWalkabilityScore",
    label: "Minimum walkability",
    help: "Set this if car-light daily life matters."
  },
  {
    key: "maxDisasterRiskIndex",
    label: "Maximum disaster risk",
    help: "Filter out higher storm, wildfire, or hazard exposure."
  }
];

const CATEGORY_LABELS = Object.fromEntries(
  LOCATION_CATEGORIES.map((category) => [category.key, category.label])
) as Record<keyof PreferenceProfileInput["weights"], string>;

function toProfileInput(profile: PreferenceProfile): PreferenceProfileInput {
  return {
    label: profile.label,
    weights: { ...profile.weights },
    dealBreakers: profile.dealBreakers ? { ...profile.dealBreakers } : {}
  };
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatWeightLabel(value: number) {
  if (value >= 0.2) {
    return "Core priority";
  }

  if (value >= 0.12) {
    return "Important";
  }

  if (value >= 0.06) {
    return "Supporting";
  }

  return "Light signal";
}

function formatConstraintSummary(profile: PreferenceProfileInput) {
  const constraints = profile.dealBreakers ?? {};
  const summary: string[] = [];

  if (typeof constraints.maxHousingCostIndex === "number") {
    summary.push(
      `Housing cost must stay at or below ${formatPercent(constraints.maxHousingCostIndex)}.`
    );
  }

  if (typeof constraints.maxTaxBurdenIndex === "number") {
    summary.push(
      `Tax pressure must stay at or below ${formatPercent(constraints.maxTaxBurdenIndex)}.`
    );
  }

  if (typeof constraints.minSafetyScore === "number") {
    summary.push(`Safety must stay at or above ${formatPercent(constraints.minSafetyScore)}.`);
  }

  if (typeof constraints.minJobMarketScore === "number") {
    summary.push(`Job market must stay at or above ${formatPercent(constraints.minJobMarketScore)}.`);
  }

  if (typeof constraints.minWalkabilityScore === "number") {
    summary.push(
      `Walkability must stay at or above ${formatPercent(constraints.minWalkabilityScore)}.`
    );
  }

  if (typeof constraints.maxDisasterRiskIndex === "number") {
    summary.push(
      `Disaster risk must stay at or below ${formatPercent(constraints.maxDisasterRiskIndex)}.`
    );
  }

  if (
    typeof constraints.preferredClimate?.min === "number" ||
    typeof constraints.preferredClimate?.max === "number"
  ) {
    summary.push(
      `Climate should stay between ${typeof constraints.preferredClimate?.min === "number" ? formatPercent(constraints.preferredClimate.min) : "any minimum"} and ${typeof constraints.preferredClimate?.max === "number" ? formatPercent(constraints.preferredClimate.max) : "any maximum"}.`
    );
  }

  return summary;
}

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profileId, setProfileId] = useState<string | undefined>();
  const [profile, setProfile] = useState<PreferenceProfileInput>(createInitialProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    void fetchCurrentProfile()
      .then((currentProfile) => {
        if (cancelled) {
          return;
        }

        if (currentProfile) {
          setProfileId(currentProfile.id);
          setProfile(toProfileInput(currentProfile));
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setError(
            requestError instanceof Error ? requestError.message : "Failed to load current profile."
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
  }, []);

  const totalWeight = useMemo(
    () => Object.values(profile.weights).reduce((sum, value) => sum + value, 0),
    [profile.weights]
  );

  const stepDescription =
    step === 0
      ? "Tell the ranking engine what matters most and what is only a light preference."
      : step === 1
        ? "Set true deal-breakers that can push weak locations down or exclude them entirely."
        : "Review the profile that will guide your next recommendation run.";

  const sortedWeights = useMemo(
    () =>
      Object.entries(profile.weights)
        .sort((left, right) => right[1] - left[1])
        .map(([key, value]) => ({
          key,
          label: CATEGORY_LABELS[key as keyof PreferenceProfileInput["weights"]],
          value
        })),
    [profile.weights]
  );

  const activeConstraints = useMemo(() => formatConstraintSummary(profile), [profile]);

  function updateWeight(key: keyof PreferenceProfileInput["weights"], value: number) {
    setProfile((current) => ({
      ...current,
      weights: {
        ...current.weights,
        [key]: value
      }
    }));
  }

  function updateConstraint(key: NumericConstraintField, rawValue: string) {
    setProfile((current) => {
      const nextDealBreakers: DealBreakers = {
        ...(current.dealBreakers ?? {})
      };

      if (rawValue === "") {
        delete nextDealBreakers[key];
      } else {
        nextDealBreakers[key] = Number(rawValue);
      }

      return {
        ...current,
        dealBreakers: nextDealBreakers
      };
    });
  }

  function updateClimateRange(boundary: "min" | "max", rawValue: string) {
    setProfile((current) => {
      const existingClimate = current.dealBreakers?.preferredClimate ?? {};
      const nextClimate = {
        ...existingClimate
      };

      if (rawValue === "") {
        delete nextClimate[boundary];
      } else {
        nextClimate[boundary] = Number(rawValue);
      }

      return {
        ...current,
        dealBreakers: {
          ...(current.dealBreakers ?? {}),
          preferredClimate: nextClimate
        }
      };
    });
  }

  function handleSubmit() {
    setError(null);

    startTransition(() => {
      void savePreferenceProfile(profile, profileId)
        .then(() => {
          router.push("/results" as Route);
        })
        .catch((requestError) => {
          setError(
            requestError instanceof Error ? requestError.message : "Failed to save your profile."
          );
        });
    });
  }

  if (isLoading) {
    return (
      <div className="panel">
        <p>Loading your current preferences...</p>
      </div>
    );
  }

  return (
    <section className="panel onboarding-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Preferences</p>
          <h2>{STEP_TITLES[step]}</h2>
          <p className="muted">{stepDescription}</p>
        </div>
        <div className="step-indicator" aria-label={`Step ${step + 1} of ${STEP_TITLES.length}`}>
          {STEP_TITLES.map((title, index) => (
            <span key={title} className={index === step ? "step-dot is-active" : "step-dot"} />
          ))}
        </div>
      </div>

      <section className="helper-panel">
        <p className="eyebrow">{profileId ? "Current profile" : "First run"}</p>
        <p className="muted">
          {profileId
            ? "Updating this profile will refresh your recommendations, shortlist context, and compare flow for this account."
            : "Start by setting what matters most. Once this profile is saved, recommendations, saved places, and compare all become personalized."}
        </p>
      </section>

      <label className="field">
        <span>Profile label</span>
        <input
          value={profile.label}
          onChange={(event) =>
            setProfile((current) => ({
              ...current,
              label: event.target.value
            }))
          }
          placeholder="Example: Family-friendly with strong jobs"
        />
      </label>

      {step === 0 ? (
        <div className="stack">
          <section className="preferences-intro-grid">
            <article className="review-card">
              <h3>How priorities work</h3>
              <p className="muted">
                Higher weights push matching locations upward in the ranking. Lower weights still
                matter, but they have less influence.
              </p>
            </article>
            <article className="review-card">
              <h3>Your current emphasis</h3>
              <ul className="plain-list priority-summary-list">
                {sortedWeights.slice(0, 3).map((entry) => (
                  <li key={entry.key}>
                    <span>
                      <strong>{entry.label}</strong>
                      <small>{formatWeightLabel(entry.value)}</small>
                    </span>
                    <strong>{formatPercent(entry.value)}</strong>
                  </li>
                ))}
              </ul>
            </article>
          </section>

          {LOCATION_CATEGORIES.map((category) => (
            <label key={category.key} className="slider-card">
              <div className="slider-copy">
                <strong>{category.label}</strong>
                <p>{category.description}</p>
              </div>
              <div className="slider-meta">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={profile.weights[category.key]}
                  onChange={(event) => updateWeight(category.key, Number(event.target.value))}
                />
                <div className="slider-value">
                  <strong>{formatPercent(profile.weights[category.key])}</strong>
                  <small>{formatWeightLabel(profile.weights[category.key])}</small>
                </div>
              </div>
            </label>
          ))}
          <p className="muted">
            Current total weight: {totalWeight.toFixed(2)}. The API normalizes weights
            automatically, so focus on relative importance rather than making the total equal 1.
          </p>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="stack">
          <section className="preferences-intro-grid">
            <article className="review-card review-card-warning">
              <h3>How deal-breakers work</h3>
              <p className="muted">
                Use these only for rules you mean seriously. Deal-breakers can remove locations
                from contention even if they score well elsewhere.
              </p>
            </article>
            <article className="review-card">
              <h3>Active deal-breakers</h3>
              <ul className="plain-list detail-list">
                {activeConstraints.length > 0 ? (
                  activeConstraints.map((item) => <li key={item}>{item}</li>)
                ) : (
                  <li>
                    No hard constraints are active. The engine will rank flexibly using your
                    priorities.
                  </li>
                )}
              </ul>
            </article>
          </section>

          <div className="constraint-grid">
            {CONSTRAINT_FIELDS.map((field) => (
              <label key={field.key} className="field constraint-card">
                <span>{field.label}</span>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={profile.dealBreakers?.[field.key] ?? ""}
                  onChange={(event) => updateConstraint(field.key, event.target.value)}
                  placeholder="Leave blank if flexible"
                />
                <small>{field.help}</small>
              </label>
            ))}
            <label className="field constraint-card">
              <span>Minimum climate score</span>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={profile.dealBreakers?.preferredClimate?.min ?? ""}
                onChange={(event) => updateClimateRange("min", event.target.value)}
                placeholder="Leave blank if flexible"
              />
              <small>
                Use this if you want to avoid locations with a poor overall climate fit.
              </small>
            </label>
            <label className="field constraint-card">
              <span>Maximum climate score</span>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={profile.dealBreakers?.preferredClimate?.max ?? ""}
                onChange={(event) => updateClimateRange("max", event.target.value)}
                placeholder="Leave blank if flexible"
              />
              <small>Useful if you want to stay within a narrower comfort band.</small>
            </label>
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="review-grid">
          <article className="review-card">
            <h3>Most important priorities</h3>
            <ul className="plain-list priority-summary-list">
              {sortedWeights.slice(0, 4).map((entry) => (
                <li key={entry.key}>
                  <span>
                    <strong>{entry.label}</strong>
                    <small>{formatWeightLabel(entry.value)}</small>
                  </span>
                  <strong>{formatPercent(entry.value)}</strong>
                </li>
              ))}
            </ul>
          </article>
          <article className="review-card">
            <h3>Deal-breakers</h3>
            <ul className="plain-list detail-list">
              {activeConstraints.length > 0 ? (
                activeConstraints.map((item) => <li key={item}>{item}</li>)
              ) : (
                <li>No deal-breakers are active. Results will stay flexible and ranking-based.</li>
              )}
            </ul>
          </article>
          <article className="review-card review-card-next">
            <h3>What happens next</h3>
            <ul className="plain-list detail-list">
              <li>Save this profile and you'll land on recommendations ranked against these priorities.</li>
              <li>From results, save strong candidates to your shortlist.</li>
              <li>Move finalists into compare when you want side-by-side tradeoffs.</li>
            </ul>
          </article>
        </div>
      ) : null}

      {error ? <p className="error-text">{error}</p> : null}

      <div className="button-row">
        <button
          type="button"
          className="secondary-button"
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          disabled={step === 0 || isPending}
        >
          Back
        </button>
        {step < STEP_TITLES.length - 1 ? (
          <button
            type="button"
            className="primary-button"
            onClick={() => setStep((current) => Math.min(STEP_TITLES.length - 1, current + 1))}
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            className="primary-button"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending
              ? "Saving..."
              : profileId
                ? "Save preferences and view recommendations"
                : "Complete preferences and view recommendations"}
          </button>
        )}
      </div>
    </section>
  );
}
