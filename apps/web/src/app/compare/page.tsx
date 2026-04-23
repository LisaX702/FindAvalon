import { ComparisonBoard } from "../../components/comparison-board";
import { requireCurrentUser } from "../../lib/auth";
import { fetchComparisonPayload } from "../../lib/api";

export default async function ComparePage() {
  await requireCurrentUser();
  const comparison = await fetchComparisonPayload();

  return (
    <main className="page-shell stack-lg">
      <section className="hero hero-compact">
        <div className="hero-copy">
          <p className="eyebrow">Decision desk</p>
          <h1>Compare your finalists side by side.</h1>
          <p className="lead">
            Use this view to see who is your current leader, who wins by category, where the watchouts
            sit, and which finalist may be ready to drop before you make a confident choice.
          </p>
        </div>
      </section>

      <ComparisonBoard initialData={comparison} />
    </main>
  );
}
