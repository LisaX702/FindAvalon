import { DashboardOverview } from "../components/dashboard-overview";
import { PublicLanding } from "../components/public-landing";
import { fetchComparisonPayload, fetchCurrentProfile, fetchCurrentUser, fetchSavedFavorites, fetchRecommendations } from "../lib/api";

export default async function HomePage() {
  const currentUser = await fetchCurrentUser();

  if (!currentUser) {
    return <PublicLanding />;
  }

  const profile = await fetchCurrentProfile();
  const [favorites, comparison, recommendations] = await Promise.all([
    fetchSavedFavorites(),
    fetchComparisonPayload(),
    profile ? fetchRecommendations() : Promise.resolve(null)
  ]);

  return (
    <DashboardOverview
      comparisonPayload={comparison}
      currentUserEmail={currentUser.email}
      favorites={favorites}
      profile={profile}
      recommendations={recommendations}
    />
  );
}
