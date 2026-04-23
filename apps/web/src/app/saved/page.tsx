import { requireCurrentUser } from "../../lib/auth";
import { SavedPlacesList } from "../../components/saved-places-list";
import { fetchCurrentComparison, fetchSavedFavorites } from "../../lib/api";

export default async function SavedPage() {
  await requireCurrentUser();
  const [favorites, comparisonSet] = await Promise.all([
    fetchSavedFavorites(),
    fetchCurrentComparison()
  ]);

  return (
    <main className="page-shell stack-lg">
      <section className="hero hero-compact">
        <div className="hero-copy">
          <p className="eyebrow">Shortlist workspace</p>
          <h1>Your saved places, ready for a decision pass.</h1>
          <p className="lead">
            Keep your best candidates here, move finalists into compare, and use details when you
            need more context before narrowing down.
          </p>
        </div>
      </section>

      <div className="results-header panel">
        <div>
          <h2>Shortlist summary</h2>
          <p className="muted">
            {favorites.length} saved place(s) and {comparisonSet.count} currently in compare.
          </p>
        </div>
        <div className="header-actions">
          <a
            className={comparisonSet.count >= 2 ? "primary-button" : "secondary-button"}
            href="/compare"
          >
            {comparisonSet.count >= 2
              ? `Continue compare (${comparisonSet.count})`
              : `View compare (${comparisonSet.count})`}
          </a>
          <a className="secondary-button" href="/results">
            View recommendations
          </a>
        </div>
      </div>

      <SavedPlacesList initialComparedIds={comparisonSet.locationIds} initialItems={favorites} />
    </main>
  );
}
