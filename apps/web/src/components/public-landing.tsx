const FLOW_STEPS = [
  {
    label: "Set preferences",
    detail: "Define the priorities and deal-breakers that actually matter for your move."
  },
  {
    label: "Review recommendations",
    detail: "See ranked places with clearer reasons, tradeoffs, and trust cues."
  },
  {
    label: "Build shortlist",
    detail: "Save realistic options so you can narrow the field without losing context."
  },
  {
    label: "Compare finalists",
    detail: "Pressure-test your strongest options and keep one clear current leader in view."
  }
] as const;

const VALUE_POINTS = [
  "Explainable rankings instead of black-box recommendations",
  "A shortlist and compare flow built for real decision-making",
  "One workspace that keeps your preferences, finalists, and current leader aligned"
] as const;

export function PublicLanding() {
  return (
    <main className="page-shell stack-lg">
      <section className="hero hero-wide landing-hero">
        <div className="hero-copy stack">
          <div>
            <p className="eyebrow">RelocateIt</p>
            <h1>Find the place that fits how you actually want to live.</h1>
            <p className="lead">
              RelocateIt helps you turn relocation priorities into a clearer decision flow:
              set preferences, review recommendations, build a shortlist, and compare finalists
              before you choose.
            </p>
          </div>

          <div className="button-row landing-cta-row">
            <a className="primary-button" href="/sign-up">
              Create account
            </a>
            <a className="secondary-button" href="/sign-in">
              Sign in
            </a>
            <a className="ghost-button" href="/sign-up">
              Start finding your fit
            </a>
          </div>

          <div className="landing-proof-grid">
            {VALUE_POINTS.map((point) => (
              <div key={point} className="panel landing-proof-card">
                <strong>{point}</strong>
              </div>
            ))}
          </div>
        </div>

        <aside className="panel hero-aside stack landing-aside">
          <div>
            <p className="eyebrow">How it works</p>
            <h2>A guided relocation decision workspace.</h2>
            <p className="muted">
              You do not need to figure out the whole move at once. The app gives you a simple
              process and keeps your tradeoffs visible as you narrow down.
            </p>
          </div>

          <div className="landing-flow">
            {FLOW_STEPS.map((step, index) => (
              <div key={step.label} className="landing-step">
                <span className="rank-pill">{index + 1}</span>
                <div>
                  <strong>{step.label}</strong>
                  <p className="muted">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="landing-detail-grid">
        <article className="panel stack">
          <p className="eyebrow">What you get</p>
          <h2>Recommendations you can actually inspect.</h2>
          <ul className="plain-list">
            <li>See why a place is strong for your profile, not just a score.</li>
            <li>Spot deal-breakers and ranking drag before you get attached to a city.</li>
            <li>Carry the same shortlist and compare context through the whole decision.</li>
          </ul>
        </article>

        <article className="panel stack">
          <p className="eyebrow">First step</p>
          <h2>Start by saving a simple preference profile.</h2>
          <p className="muted">
            Once your account is created, the app will guide you into preferences first, then
            move you naturally into recommendations, shortlist building, and finalists review.
          </p>
          <a className="primary-button" href="/sign-up">
            Create account
          </a>
        </article>
      </section>
    </main>
  );
}
