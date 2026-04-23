import { LOCATION_CATEGORIES } from "@relocateit/constants";
import type {
  ComparisonPayload,
  ComparisonSet,
  PreferenceProfile,
  RecommendationFeed,
  SavedLocationRecord
} from "@relocateit/types";

type DashboardOverviewProps = {
  comparisonPayload: ComparisonPayload;
  currentUserEmail: string;
  favorites: SavedLocationRecord[];
  profile: PreferenceProfile | null;
  recommendations: RecommendationFeed | null;
};

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatProfileHighlights(profile: PreferenceProfile) {
  return Object.entries(profile.weights)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([key, value]) => {
      const category = LOCATION_CATEGORIES.find((entry) => entry.key === key);
      return `${category?.label ?? key} ${formatPercent(value)}`;
    });
}

function formatConstraintSummary(profile: PreferenceProfile) {
  const constraints = profile.dealBreakers ?? {};
  const summary: string[] = [];

  if (typeof constraints.maxHousingCostIndex === "number") {
    summary.push(`Housing max ${formatPercent(constraints.maxHousingCostIndex)}`);
  }

  if (typeof constraints.minSafetyScore === "number") {
    summary.push(`Safety min ${formatPercent(constraints.minSafetyScore)}`);
  }

  if (typeof constraints.maxDisasterRiskIndex === "number") {
    summary.push(`Risk max ${formatPercent(constraints.maxDisasterRiskIndex)}`);
  }

  if (typeof constraints.minJobMarketScore === "number") {
    summary.push(`Jobs min ${formatPercent(constraints.minJobMarketScore)}`);
  }

  return summary.slice(0, 3);
}

function buildNextActions({
  comparisonPayload,
  favorites,
  profile,
  recommendations
}: Omit<DashboardOverviewProps, "currentUserEmail">) {
  const comparisonSet = comparisonPayload.selection;
  const currentLeader = comparisonPayload.entries[0] ?? null;

  if (!profile) {
    return [
      {
        title: "Complete preferences",
        description: "Save a profile first so the app can rank locations around your priorities.",
        href: "/preferences",
        tone: "primary" as const
      },
      {
        title: "Review recommendations",
        description: "After your profile is saved, this becomes the fastest route into ranked matches.",
        href: "/results",
        tone: "secondary" as const
      }
    ];
  }

  const actions: Array<{
    title: string;
    description: string;
    href: string;
    tone: "primary" | "secondary";
  }> = [];

  if (!recommendations || recommendations.results.length === 0) {
    actions.push({
      title: "Review recommendations",
      description: "Generate ranked matches from your saved preferences.",
      href: "/results",
      tone: "primary"
    });
  }

  if (favorites.length === 0) {
    actions.push({
      title: "Build shortlist",
      description: "Save promising matches so you can narrow down a realistic working shortlist.",
      href: "/results",
      tone: actions.length === 0 ? "primary" : "secondary"
    });
  }

  if (comparisonSet.count < comparisonSet.minLocations) {
    actions.push({
      title: "Compare finalists",
      description: "Move at least two shortlisted places into compare to pressure-test tradeoffs.",
      href: favorites.length > 0 ? "/saved" : "/results",
      tone: actions.length === 0 ? "primary" : "secondary"
    });
  }

  if (comparisonSet.count >= comparisonSet.minLocations) {
    actions.push({
      title: "Compare finalists",
      description: currentLeader
        ? `${currentLeader.location.name} is your current leader. Review whether the trailing finalists still deserve to stay in compare.`
        : "Your decision desk is ready. Review the side-by-side leader and category differences.",
      href: "/compare",
      tone: actions.length === 0 ? "primary" : "secondary"
    });
  }

  if (actions.length === 0) {
    actions.push({
      title: "Review current leader",
      description: "Open the current leader and decide whether it still deserves to stay in front.",
      href: currentLeader
        ? `/locations/${currentLeader.location.slug}`
        : recommendations?.results[0]
          ? `/locations/${recommendations.results[0].location.slug}`
        : "/compare",
      tone: "primary"
    });
    actions.push({
      title: "Refine preferences",
      description: "Tighten weights or deal-breakers if you want sharper recommendation tradeoffs.",
      href: "/preferences",
      tone: "secondary"
    });
  }

  return actions.slice(0, 3);
}

function buildDecisionStatus({
  comparisonPayload,
  favorites,
  profile,
  recommendations
}: Omit<DashboardOverviewProps, "currentUserEmail">) {
  const comparisonSet = comparisonPayload.selection;
  const currentLeader = comparisonPayload.entries[0] ?? null;

  if (!profile) {
    return {
      stage: "Set your decision criteria",
      summary: "You have not saved a preference profile yet, so the app cannot meaningfully rank locations.",
      helper: "Complete preferences first, then move into results and start building a shortlist."
    };
  }

  if (!favorites.length) {
    return {
      stage: "Build your shortlist",
      summary: "Your profile is ready, but you have not saved any finalists yet.",
      helper: "Review recommendations and save two or three realistic options before you compare."
    };
  }

  if (comparisonSet.count < comparisonSet.minLocations) {
    return {
      stage: "Move from shortlist into compare",
      summary: `${favorites.length} saved place(s), but only ${comparisonSet.count} in compare right now.`,
      helper: "Pick your strongest shortlist options and move at least two into compare for a real side-by-side decision."
    };
  }

  return {
    stage: "Review finalists and narrow down",
    summary: `${comparisonSet.count} finalists are already in compare and ready for a decision pass.`,
    helper: currentLeader
      ? `Use compare to confirm whether ${currentLeader.location.name} still deserves to stay your current leader, then drop weaker finalists one by one.`
      : recommendations?.results[0]
        ? `Use compare to confirm whether ${recommendations.results[0].location.name} still deserves the lead, then open details for the closest finalists.`
      : "Use compare to pressure-test tradeoffs, then open details for the closest finalists."
  };
}

function buildDecisionNudge(comparisonPayload: ComparisonPayload) {
  const [currentLeader, runnerUp, trailingOption] = comparisonPayload.entries;

  if (!currentLeader || comparisonPayload.selection.count < comparisonPayload.selection.minLocations) {
    return null;
  }

  if (!runnerUp || typeof currentLeader.overallScore !== "number" || typeof runnerUp.overallScore !== "number") {
    return {
      title: "Current leader is in place",
      body: `Use ${currentLeader.location.name} as your reference point and open details before you remove any finalist.`
    };
  }

  const runnerUpGap = currentLeader.overallScore - runnerUp.overallScore;

  if (runnerUpGap >= 0.08 && trailingOption) {
    return {
      title: "A weaker finalist may be ready to drop",
      body: `${trailingOption.location.name} is clearly behind the current leader. Open its detail page once more, then remove it if the tradeoffs still feel real.`
    };
  }

  if (runnerUpGap >= 0.05) {
    return {
      title: "Leader is pulling ahead",
      body: `${currentLeader.location.name} has a meaningful edge right now. Focus your next review on the closest trailing finalist before you narrow the set.`
    };
  }

  return {
    title: "Top finalists are still close",
    body: `Your current leader is only slightly ahead. Keep comparing the top two and use location details to make the final call.`
  };
}

export function DashboardOverview({
  comparisonPayload,
  currentUserEmail,
  favorites,
  profile,
  recommendations
}: DashboardOverviewProps) {
  const comparisonSet = comparisonPayload.selection;
  const topRecommendation = recommendations?.results[0] ?? null;
  const profileHighlights = profile ? formatProfileHighlights(profile) : [];
  const constraintSummary = profile ? formatConstraintSummary(profile) : [];
  const compareLeader = comparisonSet.count >= comparisonSet.minLocations ? comparisonPayload.entries[0] ?? null : null;
  const nextActions = buildNextActions({
    comparisonPayload,
    favorites,
    profile,
    recommendations
  });
  const decisionStatus = buildDecisionStatus({
    comparisonPayload,
    favorites,
    profile,
    recommendations
  });
  const decisionNudge = buildDecisionNudge(comparisonPayload);

  return (
    <main className="page-shell stack-lg">
      <section className="hero hero-wide">
        <div className="hero-copy">
          <p className="eyebrow">Dashboard</p>
          <h1>Your relocation decision workspace.</h1>
          <p className="lead">
            Keep track of your profile, shortlist, compare set, and current leader so you always
            know what stage you are in and what to do next.
          </p>
          <div className="hero-account panel">
            <p className="eyebrow">Account</p>
            <strong>{currentUserEmail}</strong>
            <p className="muted">
              This dashboard is scoped to your signed-in account and saved decisions.
            </p>
          </div>
        </div>

        <aside className="panel hero-aside stack">
          <div>
            <p className="eyebrow">Current decision status</p>
            <h2>{decisionStatus.stage}</h2>
            <p className="muted">{decisionStatus.summary}</p>
            <div className="helper-panel">
              <p>{decisionStatus.helper}</p>
            </div>
          </div>
          <div className="action-list">
            {nextActions.map((action) => (
              <a
                key={action.title}
                className={action.tone === "primary" ? "action-card action-card-primary" : "action-card"}
                href={action.href}
              >
                <strong>{action.title}</strong>
                <span className="muted">{action.description}</span>
              </a>
            ))}
          </div>
        </aside>
      </section>

      <section className="dashboard-grid">
        <article className="panel dashboard-card">
          <p className="eyebrow">Current preference profile</p>
          {profile ? (
            <div className="stack">
              <div>
                <h2>{profile.label}</h2>
                <p className="muted">
                  Top priorities: {profileHighlights.join(" | ")}
                </p>
              </div>
              <div>
                <h3>Notable deal-breakers</h3>
                <ul className="plain-list">
                  {constraintSummary.length > 0 ? (
                    constraintSummary.map((item) => <li key={item}>{item}</li>)
                  ) : (
                    <li>No hard constraints are active right now.</li>
                  )}
                </ul>
              </div>
              <a className="secondary-button" href="/preferences">
                Edit preferences
              </a>
            </div>
          ) : (
            <div className="stack">
              <p className="muted">
                You have not saved a current preference profile yet. Complete preferences first so
                recommendations, saved places, and compare all use the same priorities.
              </p>
              <a className="primary-button" href="/preferences">
                Complete preferences
              </a>
            </div>
          )}
        </article>

        <article className="panel dashboard-card">
          <p className="eyebrow">Shortlist</p>
          <h2>{favorites.length}</h2>
          <p className="muted">
            {favorites.length > 0
              ? `${favorites.length} shortlisted place(s). ${comparisonSet.count > 0 ? `${comparisonSet.count} already in compare.` : "None in compare yet."}`
              : "No shortlisted places yet. Save strong candidates from recommendations or detail pages."}
          </p>
          <a className={favorites.length > 0 ? "secondary-button" : "primary-button"} href={favorites.length > 0 ? "/saved" : "/results"}>
            {favorites.length > 0 ? "View saved places" : "Build shortlist"}
          </a>
        </article>

        <article className="panel dashboard-card">
          <p className="eyebrow">Compare finalists</p>
          <h2>{comparisonSet.count}</h2>
          <p className="muted">
            {comparisonSet.count >= comparisonSet.minLocations
              ? `${comparisonSet.count} finalist(s) are ready in compare for a side-by-side decision pass.`
              : comparisonSet.count === 1
                ? "One finalist is selected. Add one more to unlock a useful side-by-side compare."
                : `Add ${comparisonSet.minLocations} to ${comparisonSet.maxLocations} shortlisted places to start compare.`}
          </p>
          <a
            className={comparisonSet.count >= comparisonSet.minLocations ? "primary-button" : "secondary-button"}
            href={comparisonSet.count >= comparisonSet.minLocations ? "/compare" : favorites.length > 0 ? "/saved" : "/results"}
          >
            {comparisonSet.count >= comparisonSet.minLocations ? "Compare finalists" : "Build compare set"}
          </a>
        </article>
      </section>

      <section className="panel dashboard-card dashboard-featured">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Current leader</p>
            <h2>
              {comparisonSet.count >= comparisonSet.minLocations && compareLeader
                ? `${compareLeader.location.name}, ${compareLeader.location.state}`
                : topRecommendation
                  ? `${topRecommendation.location.name}, ${topRecommendation.location.state}`
                : "No recommendation yet"}
            </h2>
            <p className="muted">
              {comparisonSet.count >= comparisonSet.minLocations && compareLeader
                ? `${comparisonSet.count} finalists are already in compare. ${compareLeader.location.name} is leading right now, but you should still pressure-test that lead before you choose.`
                : topRecommendation
                  ? `Overall score ${formatPercent(topRecommendation.overallScore)} based on your current saved profile.`
                : profile
                  ? "View recommendations to generate ranked matches from your saved profile."
                  : "Complete preferences first to generate ranked matches."}
            </p>
          </div>
          {comparisonSet.count >= comparisonSet.minLocations && topRecommendation ? (
            <div className="score-pill">{formatPercent(topRecommendation.overallScore)}</div>
          ) : topRecommendation ? (
            <div className="score-pill">{formatPercent(topRecommendation.overallScore)}</div>
          ) : null}
        </div>

        {comparisonSet.count >= comparisonSet.minLocations ? (
          <div className="result-grid">
            <section>
              <h3>Where you are now</h3>
              <ul className="plain-list">
                <li>{comparisonSet.count} finalist(s) are already in compare.</li>
                <li>Saved places still act as the wider shortlist around those finalists.</li>
                <li>Use details for the current leader and the closest challenger before you make a final call.</li>
              </ul>
            </section>
            <section>
              <h3>Recommended next move</h3>
              <ul className="plain-list">
                <li>Open compare to confirm whether the current leader still holds up category by category.</li>
                <li>Review leader details before you remove a trailing finalist.</li>
                <li>Return to saved places if you need to swap finalists in or out.</li>
              </ul>
            </section>
          </div>
        ) : topRecommendation ? (
          <div className="result-grid">
            <section>
              <h3>Why it stands out</h3>
              <ul className="plain-list">
                {topRecommendation.reasons.slice(0, 3).map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </section>
            <section>
              <h3>Tradeoffs to watch</h3>
              <ul className="plain-list">
                {(topRecommendation.tradeoffs.length > 0
                  ? topRecommendation.tradeoffs.slice(0, 3)
                  : ["No major tradeoff notes for the current profile."]).map((tradeoff) => (
                  <li key={tradeoff}>{tradeoff}</li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}

        {decisionNudge ? (
          <div className="helper-panel">
            <p className="eyebrow">Decision nudge</p>
            <strong>{decisionNudge.title}</strong>
            <p className="muted">{decisionNudge.body}</p>
          </div>
        ) : null}

        <div className="button-row">
          <a
            className="primary-button"
            href={
              !profile
                ? "/preferences"
                : comparisonSet.count >= comparisonSet.minLocations
                  ? "/compare"
                  : favorites.length > 0
                    ? "/saved"
                    : "/results"
            }
          >
            {!profile
              ? "Complete preferences"
              : comparisonSet.count >= comparisonSet.minLocations
                ? "Compare finalists"
                : favorites.length > 0
                  ? "View saved places"
                  : "Review recommendations"}
          </a>
          {comparisonSet.count >= comparisonSet.minLocations && compareLeader ? (
            <a
              className="secondary-button"
              href={`/locations/${compareLeader.location.slug}`}
            >
              Review current leader
            </a>
          ) : topRecommendation ? (
            <a
              className="secondary-button"
              href={`/locations/${topRecommendation.location.slug}`}
            >
              Open details
            </a>
          ) : (
            <a className="secondary-button" href="/preferences">
              Edit preferences
            </a>
          )}
        </div>
      </section>
    </main>
  );
}
