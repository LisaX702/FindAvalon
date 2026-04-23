import { requireCurrentUser } from "../../lib/auth";
import { fetchCurrentComparison, fetchCurrentProfile, fetchRecommendations } from "../../lib/api";
import { ResultsList } from "../../components/results-list";

export default async function ResultsPage() {
  await requireCurrentUser();
  const profile = await fetchCurrentProfile();
  const comparisonSet = await fetchCurrentComparison();
  const initialData = profile ? await fetchRecommendations() : undefined;

  return (
    <main className="page-shell stack-lg">
      <section className="hero hero-compact">
        <div className="hero-copy">
          <p className="eyebrow">Recommendation results</p>
          <h1>Ranked matches generated from your saved profile.</h1>
          <p className="lead">
            These results come from the persisted `PreferenceProfile` and seeded location metrics in
            the API database.
          </p>
        </div>
      </section>

      {!profile ? (
        <section className="panel empty-panel">
          <p className="eyebrow">Complete preferences first</p>
          <h2>You need a saved profile before recommendations can be ranked.</h2>
          <p className="muted">
            Save your priorities and any hard constraints first. Once that is in place, this page
            becomes your ranked recommendation workspace.
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
      ) : (
        <ResultsList initialComparedIds={comparisonSet.locationIds} initialData={initialData} />
      )}
    </main>
  );
}
