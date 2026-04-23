import { AuthForm } from "../../components/auth-form";
import { redirectIfAuthenticated } from "../../lib/auth";

export default async function SignUpPage() {
  await redirectIfAuthenticated();

  return (
    <main className="page-shell stack-lg">
      <section className="hero hero-wide">
        <div className="hero-copy">
          <p className="eyebrow">Sign up</p>
          <h1>Create a personal relocation workspace.</h1>
          <p className="lead">
            Start with a simple account, save your preferences, and move through recommendations,
            shortlist building, and compare with one clear workflow.
          </p>
        </div>
        <aside className="panel hero-aside stack">
          <div>
            <p className="eyebrow">First run</p>
            <h2>You will not be dropped into a blank tool.</h2>
            <p className="muted">
              After sign-up, the app guides you into preferences first and then helps you work
              toward a shortlist and a current leader.
            </p>
          </div>
        </aside>
      </section>

      <AuthForm mode="sign-up" />
    </main>
  );
}
