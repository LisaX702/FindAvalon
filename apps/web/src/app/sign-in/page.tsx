import { AuthForm } from "../../components/auth-form";
import { redirectIfAuthenticated } from "../../lib/auth";

export default async function SignInPage() {
  await redirectIfAuthenticated();

  return (
    <main className="page-shell stack-lg">
      <section className="hero hero-wide">
        <div className="hero-copy">
          <p className="eyebrow">Sign in</p>
          <h1>Open your relocation workspace.</h1>
          <p className="lead">
            Sign in to reopen your saved preferences, recommendations, shortlist, compare finalists,
            and current leader.
          </p>
        </div>
        <aside className="panel hero-aside stack">
          <div>
            <p className="eyebrow">Confidence</p>
            <h2>Pick up exactly where you left off.</h2>
            <p className="muted">
              Your dashboard, shortlist, and finalist comparisons stay tied to your account, so
              you can move straight back into the decision.
            </p>
          </div>
        </aside>
      </section>

      <AuthForm mode="sign-in" />
    </main>
  );
}
