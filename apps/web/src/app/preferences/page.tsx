import { OnboardingForm } from "../../components/onboarding-form";
import { requireCurrentUser } from "../../lib/auth";
import { fetchCurrentProfile } from "../../lib/api";

export default async function PreferencesPage() {
  await requireCurrentUser();
  const profile = await fetchCurrentProfile();

  return (
    <main className="page-shell stack-lg">
      <section className="hero hero-wide">
        <div className="hero-copy">
          <p className="eyebrow">Preferences</p>
          <h1>Keep your relocation priorities current.</h1>
          <p className="lead">
            Adjust the saved profile that powers recommendations, compare context, and the dashboard
            summary for your signed-in account.
          </p>
        </div>
        <aside className="panel hero-aside">
          <p className="eyebrow">{profile ? "Current status" : "First step"}</p>
          <h2>{profile ? profile.label : "Set up your recommendation profile"}</h2>
          <p className="muted">
            {profile
              ? "Review or tighten your saved priorities when you want different recommendation tradeoffs."
              : "Start here after sign-up. Once your profile is saved, recommendations, saved places, and compare all become personalized."}
          </p>
          <div className="helper-panel">
            <p className="eyebrow">How this affects results</p>
            <p className="muted">
              Priorities shape ranking. Deal-breakers act like hard rules. The combination determines what rises to the top and what gets filtered out.
            </p>
          </div>
        </aside>
      </section>

      <OnboardingForm />
    </main>
  );
}
