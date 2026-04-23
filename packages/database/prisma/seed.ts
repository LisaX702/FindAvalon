type SeedLocation = {
  slug: string;
  name: string;
  state: string;
  country: string;
  population: number;
  description: string;
  latitude: string;
  longitude: string;
  metrics: {
    housingCostIndex: number;
    taxBurdenIndex: number;
    climateScore: number;
    safetyScore: number;
    educationScore: number;
    healthcareScore: number;
    jobMarketScore: number;
    walkabilityScore: number;
    transitScore: number;
    recreationScore: number;
    internetQualityScore: number;
    disasterRiskIndex: number;
    sourceSummary: string;
  };
};

type MetricSet = Omit<SeedLocation["metrics"], "sourceSummary">;

type ProfileKey =
  | "northeastAnchor"
  | "midAtlanticCorridor"
  | "greatLakesHub"
  | "collegeBalanced"
  | "sunbeltGrowth"
  | "texasScale"
  | "floridaCoastal"
  | "mountainOutdoor"
  | "westCoastPremium"
  | "plainsValue";

type CityBlueprint = {
  slug: string;
  name: string;
  state: string;
  population: number;
  latitude: string;
  longitude: string;
  profile: ProfileKey;
  highlights: string;
  tradeoffs: string;
  summaryNote: string;
  tweaks?: Partial<MetricSet>;
};

const { PrismaClient } = require("@prisma/client");
const { DEFAULT_PROFILE_INPUT } = require("@relocateit/constants");

const prisma = new PrismaClient();
const SEED_PROFILE_USER_ID = "seed-demo-user";
const SEED_PROFILE_USER_EMAIL = "demo@relocateit.local";

const PROFILE_BASELINES: Record<ProfileKey, { metrics: MetricSet; narrative: string }> = {
  northeastAnchor: {
    narrative: "Dense Northeast anchor with standout institutions, strong mobility, and heavy cost pressure.",
    metrics: {
      housingCostIndex: 0.9,
      taxBurdenIndex: 0.68,
      climateScore: 0.46,
      safetyScore: 0.69,
      educationScore: 0.9,
      healthcareScore: 0.92,
      jobMarketScore: 0.91,
      walkabilityScore: 0.84,
      transitScore: 0.8,
      recreationScore: 0.73,
      internetQualityScore: 0.88,
      disasterRiskIndex: 0.16
    }
  },
  midAtlanticCorridor: {
    narrative: "East Coast corridor profile with solid institutions, better transit, and moderate-to-high costs.",
    metrics: {
      housingCostIndex: 0.68,
      taxBurdenIndex: 0.58,
      climateScore: 0.58,
      safetyScore: 0.58,
      educationScore: 0.72,
      healthcareScore: 0.84,
      jobMarketScore: 0.82,
      walkabilityScore: 0.72,
      transitScore: 0.68,
      recreationScore: 0.7,
      internetQualityScore: 0.82,
      disasterRiskIndex: 0.24
    }
  },
  greatLakesHub: {
    narrative: "Affordable Great Lakes or Midwest city profile with steadier costs, colder seasons, and solid healthcare access.",
    metrics: {
      housingCostIndex: 0.45,
      taxBurdenIndex: 0.55,
      climateScore: 0.43,
      safetyScore: 0.64,
      educationScore: 0.69,
      healthcareScore: 0.79,
      jobMarketScore: 0.72,
      walkabilityScore: 0.58,
      transitScore: 0.45,
      recreationScore: 0.68,
      internetQualityScore: 0.77,
      disasterRiskIndex: 0.17
    }
  },
  collegeBalanced: {
    narrative: "University-led market with stronger schools and healthcare, but a smaller labor market than a major metro.",
    metrics: {
      housingCostIndex: 0.58,
      taxBurdenIndex: 0.56,
      climateScore: 0.55,
      safetyScore: 0.79,
      educationScore: 0.86,
      healthcareScore: 0.82,
      jobMarketScore: 0.68,
      walkabilityScore: 0.67,
      transitScore: 0.45,
      recreationScore: 0.82,
      internetQualityScore: 0.79,
      disasterRiskIndex: 0.16
    }
  },
  sunbeltGrowth: {
    narrative: "Fast-growing Sun Belt market with warmer weather, moderate taxes, and lighter transit infrastructure.",
    metrics: {
      housingCostIndex: 0.57,
      taxBurdenIndex: 0.45,
      climateScore: 0.75,
      safetyScore: 0.62,
      educationScore: 0.67,
      healthcareScore: 0.76,
      jobMarketScore: 0.8,
      walkabilityScore: 0.42,
      transitScore: 0.31,
      recreationScore: 0.76,
      internetQualityScore: 0.79,
      disasterRiskIndex: 0.32
    }
  },
  texasScale: {
    narrative: "Large Texas market with strong job depth, lower taxes, and an everyday bias toward driving.",
    metrics: {
      housingCostIndex: 0.55,
      taxBurdenIndex: 0.39,
      climateScore: 0.7,
      safetyScore: 0.57,
      educationScore: 0.61,
      healthcareScore: 0.77,
      jobMarketScore: 0.85,
      walkabilityScore: 0.36,
      transitScore: 0.27,
      recreationScore: 0.74,
      internetQualityScore: 0.81,
      disasterRiskIndex: 0.38
    }
  },
  floridaCoastal: {
    narrative: "Florida coastal profile with lifestyle and tax upside, but meaningful hurricane and insurance exposure.",
    metrics: {
      housingCostIndex: 0.7,
      taxBurdenIndex: 0.37,
      climateScore: 0.84,
      safetyScore: 0.57,
      educationScore: 0.6,
      healthcareScore: 0.79,
      jobMarketScore: 0.73,
      walkabilityScore: 0.51,
      transitScore: 0.34,
      recreationScore: 0.88,
      internetQualityScore: 0.79,
      disasterRiskIndex: 0.73
    }
  },
  mountainOutdoor: {
    narrative: "Mountain West profile with standout recreation, decent safety, and moderate wildfire or drought exposure.",
    metrics: {
      housingCostIndex: 0.64,
      taxBurdenIndex: 0.43,
      climateScore: 0.63,
      safetyScore: 0.74,
      educationScore: 0.7,
      healthcareScore: 0.74,
      jobMarketScore: 0.73,
      walkabilityScore: 0.48,
      transitScore: 0.36,
      recreationScore: 0.92,
      internetQualityScore: 0.79,
      disasterRiskIndex: 0.28
    }
  },
  westCoastPremium: {
    narrative: "Premium West Coast market with top-tier opportunity and climate upside, offset by steep cost pressure.",
    metrics: {
      housingCostIndex: 0.9,
      taxBurdenIndex: 0.65,
      climateScore: 0.72,
      safetyScore: 0.63,
      educationScore: 0.75,
      healthcareScore: 0.86,
      jobMarketScore: 0.91,
      walkabilityScore: 0.72,
      transitScore: 0.66,
      recreationScore: 0.87,
      internetQualityScore: 0.87,
      disasterRiskIndex: 0.3
    }
  },
  plainsValue: {
    narrative: "Value-oriented central U.S. market with lower costs, steadier day-to-day living, and lighter transit.",
    metrics: {
      housingCostIndex: 0.36,
      taxBurdenIndex: 0.5,
      climateScore: 0.5,
      safetyScore: 0.68,
      educationScore: 0.65,
      healthcareScore: 0.73,
      jobMarketScore: 0.67,
      walkabilityScore: 0.31,
      transitScore: 0.2,
      recreationScore: 0.62,
      internetQualityScore: 0.74,
      disasterRiskIndex: 0.25
    }
  }
};

const CITY_BLUEPRINTS: CityBlueprint[] = [
  { slug: "madison-wi", name: "Madison", state: "Wisconsin", population: 280305, latitude: "43.07305", longitude: "-89.40123", profile: "collegeBalanced", highlights: "Strong public schools, lakeside recreation, and stable healthcare access", tradeoffs: "higher Midwest taxes and a colder winter pattern", summaryNote: "State government and university employment keep the floor relatively steady.", tweaks: { housingCostIndex: 0, recreationScore: -0.02, climateScore: -0.11 } },
  { slug: "minneapolis-mn", name: "Minneapolis", state: "Minnesota", population: 429954, latitude: "44.97775", longitude: "-93.26501", profile: "greatLakesHub", highlights: "Diverse employers, biking infrastructure, and strong park access", tradeoffs: "long winters and a higher local tax burden", summaryNote: "Urban mobility and healthcare stay better than many peer metros.", tweaks: { jobMarketScore: 0.09, walkabilityScore: 0.1, transitScore: 0.21, recreationScore: 0.15, healthcareScore: 0.05, climateScore: -0.05 } },
  { slug: "austin-tx", name: "Austin", state: "Texas", population: 979882, latitude: "30.26715", longitude: "-97.74306", profile: "texasScale", highlights: "Fast-growing tech jobs, lively neighborhoods, and warm-weather recreation", tradeoffs: "rising housing costs and weaker transit outside the core", summaryNote: "Creative-economy growth pushes jobs and lifestyle higher than most Texas peers.", tweaks: { housingCostIndex: 0.15, walkabilityScore: 0.16, transitScore: 0.15, recreationScore: 0.13, climateScore: 0.08, safetyScore: 0.06 } },
  { slug: "raleigh-nc", name: "Raleigh", state: "North Carolina", population: 482295, latitude: "35.77959", longitude: "-78.63818", profile: "sunbeltGrowth", highlights: "Research Triangle access, good schools, and steady professional job growth", tradeoffs: "suburban mobility patterns and a smaller downtown transit footprint", summaryNote: "The region stays balanced for households prioritizing jobs without going fully big-city.", tweaks: { educationScore: 0.13, safetyScore: 0.1, walkabilityScore: 0.04, transitScore: 0.06, healthcareScore: 0.02, disasterRiskIndex: -0.01 } },
  { slug: "pittsburgh-pa", name: "Pittsburgh", state: "Pennsylvania", population: 302971, latitude: "40.44062", longitude: "-79.99589", profile: "greatLakesHub", highlights: "Healthcare and university anchors with relatively attainable housing", tradeoffs: "hillier terrain and an older-feeling economic profile in some corridors", summaryNote: "Institutional strength keeps healthcare and education high relative to price.", tweaks: { housingCostIndex: -0.02, healthcareScore: 0.09, educationScore: 0.07, walkabilityScore: 0.09, transitScore: 0.17, climateScore: 0.05, recreationScore: 0.01 } },
  { slug: "boise-id", name: "Boise", state: "Idaho", population: 235684, latitude: "43.61502", longitude: "-116.20231", profile: "mountainOutdoor", highlights: "Trail access, good safety, and strong day-to-day livability for its size", tradeoffs: "a smaller job market and limited transit coverage", summaryNote: "The market is smaller than Denver or Salt Lake City, but the outdoors pull is similar.", tweaks: { safetyScore: 0.08, jobMarketScore: -0.08, transitScore: -0.08, walkabilityScore: -0.07, healthcareScore: -0.05, housingCostIndex: -0.02, disasterRiskIndex: -0.06 } },
  { slug: "denver-co", name: "Denver", state: "Colorado", population: 715522, latitude: "39.73924", longitude: "-104.99025", profile: "mountainOutdoor", highlights: "Broad job depth, immediate recreation access, and a strong urban core for the region", tradeoffs: "elevated housing costs and moderate climate-risk exposure", summaryNote: "Denver stays one of the broadest all-around Mountain West job and lifestyle markets.", tweaks: { jobMarketScore: 0.13, walkabilityScore: 0.13, transitScore: 0.21, healthcareScore: 0.04, housingCostIndex: 0.08, disasterRiskIndex: 0.08 } },
  { slug: "salt-lake-city-ut", name: "Salt Lake City", state: "Utah", population: 209593, latitude: "40.76078", longitude: "-111.89105", profile: "mountainOutdoor", highlights: "Access to skiing and trails with a growing economy and better-than-expected regional transit", tradeoffs: "winter inversions and housing costs that keep rising", summaryNote: "Compared with peer outdoor metros, transit and economic breadth hold up well.", tweaks: { transitScore: 0.27, walkabilityScore: 0.07, jobMarketScore: 0.06, recreationScore: 0.02, climateScore: -0.01, housingCostIndex: 0.02, disasterRiskIndex: -0.01 } },
  { slug: "seattle-wa", name: "Seattle", state: "Washington", population: 755078, latitude: "47.60621", longitude: "-122.33207", profile: "westCoastPremium", highlights: "Top-tier tech opportunity, strong healthcare access, and better core mobility than most U.S. metros", tradeoffs: "very high housing costs and more muted sunshine than many migrants expect", summaryNote: "Few cities match the combination of income potential, transit, and outdoor access.", tweaks: { taxBurdenIndex: -0.29, jobMarketScore: 0.04, transitScore: 0.12, walkabilityScore: 0.02, climateScore: -0.14, housingCostIndex: -0.02, disasterRiskIndex: 0.01 } },
  { slug: "portland-or", name: "Portland", state: "Oregon", population: 630498, latitude: "45.51523", longitude: "-122.67839", profile: "westCoastPremium", highlights: "Walkable districts, strong recreation access, and a distinctly urban everyday feel", tradeoffs: "a mixed safety picture and one of the higher tax burdens in the West", summaryNote: "Lifestyle and mobility remain strong even when the civic tradeoffs feel more visible.", tweaks: { housingCostIndex: -0.21, taxBurdenIndex: 0.03, safetyScore: -0.06, educationScore: -0.05, healthcareScore: -0.1, jobMarketScore: -0.18, walkabilityScore: 0, transitScore: 0.03, recreationScore: 0.02, internetQualityScore: -0.05, disasterRiskIndex: -0.01 } },
  { slug: "san-diego-ca", name: "San Diego", state: "California", population: 1386932, latitude: "32.71574", longitude: "-117.16108", profile: "westCoastPremium", highlights: "Exceptional climate, coastal recreation, and strong healthcare presence", tradeoffs: "very high housing costs and meaningful wildfire and drought exposure", summaryNote: "The weather-and-healthcare combination stays unusually strong, even for California.", tweaks: { climateScore: 0.22, healthcareScore: -0.01, educationScore: -0.03, recreationScore: 0.08, transitScore: -0.12, taxBurdenIndex: 0.07, housingCostIndex: 0.02, disasterRiskIndex: 0.04 } },
  { slug: "sacramento-ca", name: "Sacramento", state: "California", population: 528001, latitude: "38.58157", longitude: "-121.4944", profile: "westCoastPremium", highlights: "Government and healthcare employment with more attainable housing than the Bay or coast", tradeoffs: "warmer inland summers and only moderate urban mobility", summaryNote: "It offers a practical California compromise rather than a premium coastal lifestyle.", tweaks: { housingCostIndex: -0.2, jobMarketScore: -0.18, walkabilityScore: -0.23, transitScore: -0.21, recreationScore: -0.12, climateScore: 0, taxBurdenIndex: 0.07, healthcareScore: -0.06, disasterRiskIndex: 0.03 } },
  { slug: "phoenix-az", name: "Phoenix", state: "Arizona", population: 1650070, latitude: "33.44838", longitude: "-112.07404", profile: "sunbeltGrowth", highlights: "Rapid population growth, broad housing stock, and a large labor market", tradeoffs: "extreme summer heat and an auto-heavy daily rhythm", summaryNote: "Scale and access help it compete, but climate and infrastructure tradeoffs stay visible.", tweaks: { housingCostIndex: 0.02, jobMarketScore: -0.01, walkabilityScore: -0.06, transitScore: 0.02, recreationScore: 0.02, climateScore: -0.17, safetyScore: -0.04, disasterRiskIndex: 0.09 } },
  { slug: "tucson-az", name: "Tucson", state: "Arizona", population: 547239, latitude: "32.22261", longitude: "-110.97471", profile: "sunbeltGrowth", highlights: "More affordable desert living with strong outdoor access and a university presence", tradeoffs: "a smaller job market and weaker transit than bigger Sun Belt peers", summaryNote: "Tucson feels calmer and cheaper than Phoenix, but opportunity is thinner.", tweaks: { housingCostIndex: -0.12, jobMarketScore: -0.19, walkabilityScore: 0, transitScore: 0, recreationScore: 0.1, safetyScore: -0.07, healthcareScore: -0.09, disasterRiskIndex: -0.03 } },
  { slug: "charlotte-nc", name: "Charlotte", state: "North Carolina", population: 897720, latitude: "35.22709", longitude: "-80.84313", profile: "sunbeltGrowth", highlights: "Banking, logistics, and professional services jobs with moderate costs", tradeoffs: "car dependence and a less distinctive urban core than older East Coast peers", summaryNote: "It is one of the more career-friendly Southern metros without going fully high-cost.", tweaks: { jobMarketScore: 0.02, healthcareScore: 0.01, walkabilityScore: -0.03, transitScore: 0.02, safetyScore: -0.02, recreationScore: -0.05, climateScore: -0.01, disasterRiskIndex: -0.04 } },
  { slug: "nashville-tn", name: "Nashville", state: "Tennessee", population: 687788, latitude: "36.16266", longitude: "-86.7816", profile: "sunbeltGrowth", highlights: "Healthcare and entertainment jobs with an energetic lifestyle scene", tradeoffs: "rising housing costs and very limited transit reach", summaryNote: "Job growth and culture outpace infrastructure in the current phase of growth.", tweaks: { taxBurdenIndex: -0.06, jobMarketScore: 0, healthcareScore: 0.05, recreationScore: 0.05, safetyScore: -0.05, walkabilityScore: 0, transitScore: -0.06, housingCostIndex: 0.06, disasterRiskIndex: 0.02 } },
  { slug: "atlanta-ga", name: "Atlanta", state: "Georgia", population: 510823, latitude: "33.74900", longitude: "-84.38798", profile: "sunbeltGrowth", highlights: "Deep job market, major-airport connectivity, and strong healthcare access", tradeoffs: "traffic, uneven safety, and a mostly car-dependent metro footprint", summaryNote: "Atlanta is a major opportunity engine, but the day-to-day feel varies sharply by area.", tweaks: { jobMarketScore: 0.08, healthcareScore: 0.04, climateScore: -0.07, safetyScore: -0.08, walkabilityScore: 0.02, transitScore: 0.08, recreationScore: -0.03, internetQualityScore: 0.03 } },
  { slug: "tampa-fl", name: "Tampa", state: "Florida", population: 403364, latitude: "27.95058", longitude: "-82.45718", profile: "floridaCoastal", highlights: "Warm-water lifestyle, no state income tax, and solid healthcare access", tradeoffs: "hurricane exposure and mostly car-oriented daily life", summaryNote: "Florida tax appeal is real here, but insurance and storm risk matter.", tweaks: { housingCostIndex: -0.06, safetyScore: 0.02, healthcareScore: 0, jobMarketScore: -0.02, walkabilityScore: -0.1, transitScore: -0.11, recreationScore: -0.04, disasterRiskIndex: -0.01 } },
  { slug: "miami-fl", name: "Miami", state: "Florida", population: 449514, latitude: "25.76168", longitude: "-80.19179", profile: "floridaCoastal", highlights: "International connectivity, dense urban neighborhoods, and standout lifestyle energy", tradeoffs: "very high housing costs, hurricane exposure, and a more uneven safety profile", summaryNote: "Urban intensity and global connectivity are strengths, but cost and risk are front and center.", tweaks: { housingCostIndex: 0.16, walkabilityScore: 0.18, transitScore: 0.21, recreationScore: 0.04, climateScore: 0.03, safetyScore: -0.05, disasterRiskIndex: 0.08, jobMarketScore: 0.05 } },
  { slug: "boston-ma", name: "Boston", state: "Massachusetts", population: 653833, latitude: "42.36008", longitude: "-71.05888", profile: "northeastAnchor", highlights: "Elite education, healthcare, and rail access in a compact urban footprint", tradeoffs: "some of the highest housing costs in the country and colder winters", summaryNote: "Few cities rival Boston for institutions and mobility, but affordability remains extreme.", tweaks: { educationScore: 0.03, healthcareScore: 0.03, housingCostIndex: 0.05, safetyScore: 0.05, transitScore: 0.02, climateScore: 0 } },
  { slug: "philadelphia-pa", name: "Philadelphia", state: "Pennsylvania", population: 1567442, latitude: "39.95258", longitude: "-75.16522", profile: "midAtlanticCorridor", highlights: "Walkable urban neighborhoods, strong healthcare, and East Coast rail access", tradeoffs: "a mixed safety picture and older infrastructure in some areas", summaryNote: "Philadelphia offers big-city access at a lower cost than New York or Boston, with more visible tradeoffs.", tweaks: { housingCostIndex: -0.11, jobMarketScore: -0.03, safetyScore: -0.09, healthcareScore: 0.03, walkabilityScore: 0.1, transitScore: 0.11, recreationScore: -0.02, disasterRiskIndex: -0.06 } },
  { slug: "chicago-il", name: "Chicago", state: "Illinois", population: 2664452, latitude: "41.87811", longitude: "-87.62980", profile: "greatLakesHub", highlights: "Deep job diversity and excellent transit with genuinely urban day-to-day living", tradeoffs: "higher taxes, a colder climate, and neighborhood-level safety tradeoffs", summaryNote: "Chicago remains one of the strongest big-city value propositions for mobility and career breadth.", tweaks: { housingCostIndex: 0.17, taxBurdenIndex: 0.14, climateScore: -0.07, safetyScore: -0.12, educationScore: 0.02, healthcareScore: 0.09, jobMarketScore: 0.18, walkabilityScore: 0.26, transitScore: 0.43, recreationScore: 0.06, internetQualityScore: 0.07, disasterRiskIndex: -0.03 } },
  { slug: "columbus-oh", name: "Columbus", state: "Ohio", population: 913175, latitude: "39.96118", longitude: "-82.99879", profile: "greatLakesHub", highlights: "Growing state-capital economy with accessible costs and steady healthcare access", tradeoffs: "limited transit and only moderate neighborhood walkability", summaryNote: "Columbus feels broad and stable rather than flashy, which helps recommendation variety.", tweaks: { housingCostIndex: 0.02, climateScore: 0.06, jobMarketScore: 0.06, walkabilityScore: -0.19, transitScore: -0.16, recreationScore: -0.02, safetyScore: -0.01 } },
  { slug: "cincinnati-oh", name: "Cincinnati", state: "Ohio", population: 309317, latitude: "39.10312", longitude: "-84.51202", profile: "greatLakesHub", highlights: "Affordable urban neighborhoods with decent schools and healthcare", tradeoffs: "less transit reach and a smaller opportunity base than the biggest Midwest metros", summaryNote: "It offers good fundamentals for price-sensitive households that still want city texture.", tweaks: { housingCostIndex: -0.04, educationScore: 0.02, healthcareScore: 0, jobMarketScore: -0.04, walkabilityScore: -0.04, transitScore: -0.15, climateScore: 0.07, recreationScore: 0 } },
  { slug: "kansas-city-mo", name: "Kansas City", state: "Missouri", population: 510704, latitude: "39.09973", longitude: "-94.57857", profile: "plainsValue", highlights: "Lower-cost living with expanding corporate and tech employment", tradeoffs: "modest transit and more suburban day-to-day movement", summaryNote: "Kansas City remains a value-oriented metro rather than a walkable one.", tweaks: { jobMarketScore: 0.04, healthcareScore: 0.02, recreationScore: 0.05, walkabilityScore: 0.05, transitScore: 0.07, safetyScore: -0.12, climateScore: 0.01, disasterRiskIndex: 0.03 } },
  { slug: "st-louis-mo", name: "St. Louis", state: "Missouri", population: 281754, latitude: "38.62700", longitude: "-90.19940", profile: "greatLakesHub", highlights: "Major medical and university anchors with very low housing costs", tradeoffs: "a sharper safety divide and slower-feeling job growth", summaryNote: "Institutional depth helps the fundamentals, but neighborhood conditions vary more than in many peers.", tweaks: { housingCostIndex: -0.1, safetyScore: -0.19, healthcareScore: 0.03, educationScore: -0.03, jobMarketScore: -0.05, walkabilityScore: -0.02, transitScore: -0.1, climateScore: 0.11, recreationScore: 0.02, disasterRiskIndex: 0.07 } },
  { slug: "san-antonio-tx", name: "San Antonio", state: "Texas", population: 1492510, latitude: "29.42412", longitude: "-98.49363", profile: "texasScale", highlights: "Family-oriented neighborhoods with moderate housing costs and a solid healthcare base", tradeoffs: "hot summers and very limited transit coverage", summaryNote: "San Antonio is steadier and cheaper than Austin, but less dynamic for jobs.", tweaks: { housingCostIndex: -0.06, jobMarketScore: -0.16, healthcareScore: -0.02, recreationScore: -0.02, walkabilityScore: -0.03, transitScore: -0.06, climateScore: 0.01, disasterRiskIndex: 0.01 } },
  { slug: "dallas-tx", name: "Dallas", state: "Texas", population: 1304379, latitude: "32.77666", longitude: "-96.79699", profile: "texasScale", highlights: "Large corporate job base with major airport access and broad housing supply", tradeoffs: "car dependence and only moderate neighborhood walkability", summaryNote: "The economy is deep, but the urban experience is less cohesive than in older metros.", tweaks: { housingCostIndex: 0.03, jobMarketScore: 0.04, healthcareScore: 0.02, internetQualityScore: 0.01, safetyScore: -0.01, transitScore: 0.02, climateScore: -0.01 } },
  { slug: "richmond-va", name: "Richmond", state: "Virginia", population: 229247, latitude: "37.54072", longitude: "-77.43605", profile: "midAtlanticCorridor", highlights: "Compact historic core, steady healthcare access, and improving neighborhood walkability", tradeoffs: "modest transit and a smaller labor market than Northern Virginia", summaryNote: "Richmond sits between true corridor cities and Southern growth markets.", tweaks: { housingCostIndex: -0.17, taxBurdenIndex: -0.09, safetyScore: 0.06, educationScore: -0.05, jobMarketScore: -0.14, walkabilityScore: -0.16, transitScore: -0.36, recreationScore: 0.02, disasterRiskIndex: -0.03 } },
  { slug: "ann-arbor-mi", name: "Ann Arbor", state: "Michigan", population: 123851, latitude: "42.28083", longitude: "-83.74304", profile: "collegeBalanced", highlights: "Top-tier education and healthcare with strong walkability for a smaller city", tradeoffs: "premium pricing for the region and less job depth outside university-linked sectors", summaryNote: "Ann Arbor scores like a small, high-functioning institution-driven market.", tweaks: { housingCostIndex: 0.08, climateScore: -0.12, safetyScore: 0.04, educationScore: 0.06, healthcareScore: 0.09, walkabilityScore: 0.07, transitScore: 0.06, internetQualityScore: 0.03, disasterRiskIndex: -0.04 } }
];

// Extend the seed with a large, deterministic, and regionally varied set of U.S. cities.
CITY_BLUEPRINTS.push(
  { slug: "burlington-vt", name: "Burlington", state: "Vermont", population: 44743, latitude: "44.47588", longitude: "-73.21207", profile: "collegeBalanced", highlights: "Lakeside living, strong recreation, and a safer small-city feel", tradeoffs: "a much smaller job market and heavier tax burden", summaryNote: "It offers outdoor quality of life first, with career depth as the main compromise.", tweaks: { housingCostIndex: 0.1, taxBurdenIndex: 0.15, climateScore: -0.21, safetyScore: 0.06, jobMarketScore: -0.19, transitScore: -0.14, recreationScore: 0.1, healthcareScore: -0.1, internetQualityScore: -0.07, disasterRiskIndex: -0.05 } },
  { slug: "omaha-ne", name: "Omaha", state: "Nebraska", population: 486051, latitude: "41.25654", longitude: "-95.93450", profile: "plainsValue", highlights: "Affordable living, stable employers, and reliable healthcare", tradeoffs: "limited transit and only modest urban intensity", summaryNote: "Omaha is one of the steadier lower-cost metros in the central U.S.", tweaks: { taxBurdenIndex: 0.06, healthcareScore: 0.03, jobMarketScore: 0.03, recreationScore: -0.01, transitScore: -0.01, climateScore: -0.04, disasterRiskIndex: 0.01 } },
  { slug: "albany-ny", name: "Albany", state: "New York", population: 101228, latitude: "42.65258", longitude: "-73.75623", profile: "midAtlanticCorridor", highlights: "Government and education stability with relatively manageable housing costs", tradeoffs: "colder weather and a smaller metro feel than the larger Northeast corridor", summaryNote: "It is more practical than prestige-driven, which makes it useful in recommendation variety.", tweaks: { housingCostIndex: -0.2, taxBurdenIndex: 0.09, climateScore: -0.18, safetyScore: 0.1, educationScore: 0.02, healthcareScore: -0.06, jobMarketScore: -0.19, walkabilityScore: -0.14, transitScore: -0.31, recreationScore: 0.01, disasterRiskIndex: -0.1 } },
  { slug: "new-york-ny", name: "New York", state: "New York", population: 8258035, latitude: "40.71278", longitude: "-74.00600", profile: "northeastAnchor", highlights: "Unmatched job depth, transit reach, and urban lifestyle density", tradeoffs: "the highest housing pressure in the country and relentless cost of living", summaryNote: "No other U.S. city matches New York for sheer breadth, but the affordability tradeoff is extreme.", tweaks: { housingCostIndex: 0.09, taxBurdenIndex: 0.03, climateScore: 0.08, safetyScore: -0.02, educationScore: 0.02, healthcareScore: 0.02, jobMarketScore: 0.05, walkabilityScore: 0.12, transitScore: 0.15, recreationScore: 0.03, internetQualityScore: 0.03, disasterRiskIndex: 0.06 } },
  { slug: "jersey-city-nj", name: "Jersey City", state: "New Jersey", population: 292449, latitude: "40.71775", longitude: "-74.04314", profile: "northeastAnchor", highlights: "Fast access to Manhattan jobs with more neighborhood variety and waterfront living", tradeoffs: "high costs and a still-urban price tag despite slightly more space", summaryNote: "It scores like a New York-adjacent option rather than a true lower-cost alternative.", tweaks: { housingCostIndex: -0.03, taxBurdenIndex: 0.02, safetyScore: 0, jobMarketScore: 0.02, walkabilityScore: 0.05, transitScore: 0.08, recreationScore: 0.01, healthcareScore: -0.03 } },
  { slug: "san-francisco-ca", name: "San Francisco", state: "California", population: 808988, latitude: "37.77493", longitude: "-122.41942", profile: "westCoastPremium", highlights: "Dense neighborhoods, elite job access, and the strongest walk-transit mix on the West Coast", tradeoffs: "extreme housing costs and a more visibly strained street-level environment", summaryNote: "San Francisco remains one of the clearest opportunity-versus-cost tradeoff markets in the country.", tweaks: { housingCostIndex: 0.07, taxBurdenIndex: 0.07, climateScore: 0.16, safetyScore: -0.08, educationScore: 0.02, healthcareScore: 0.01, jobMarketScore: 0.05, walkabilityScore: 0.17, transitScore: 0.16, recreationScore: 0.04, internetQualityScore: 0.03, disasterRiskIndex: 0.05 } },
  { slug: "providence-ri", name: "Providence", state: "Rhode Island", population: 190934, latitude: "41.82400", longitude: "-71.41283", profile: "midAtlanticCorridor", highlights: "Walkable neighborhoods, good healthcare, and easier access to the Northeast than its cost suggests", tradeoffs: "smaller-city job depth and a middling tax burden", summaryNote: "Providence works well for users who want corridor access without Boston pricing.", tweaks: { housingCostIndex: -0.09, taxBurdenIndex: 0.04, climateScore: -0.05, safetyScore: 0.06, educationScore: 0.03, healthcareScore: 0, jobMarketScore: -0.12, walkabilityScore: 0.05, transitScore: -0.03, recreationScore: 0.02, disasterRiskIndex: -0.02 } },
  { slug: "new-haven-ct", name: "New Haven", state: "Connecticut", population: 134023, latitude: "41.30827", longitude: "-72.92788", profile: "collegeBalanced", highlights: "Institutional healthcare, rail access, and a compact urban form", tradeoffs: "a smaller labor market and uneven neighborhood conditions", summaryNote: "Yale-linked institutions keep education and healthcare notably high for size.", tweaks: { housingCostIndex: 0.08, taxBurdenIndex: 0.08, climateScore: -0.09, safetyScore: -0.08, educationScore: 0.04, healthcareScore: 0.08, jobMarketScore: 0.02, walkabilityScore: 0.03, transitScore: 0.15, recreationScore: -0.08, disasterRiskIndex: -0.01 } },
  { slug: "stamford-ct", name: "Stamford", state: "Connecticut", population: 136188, latitude: "41.05343", longitude: "-73.53873", profile: "northeastAnchor", highlights: "Strong commuter-rail access and corporate jobs with a safer suburban-urban mix", tradeoffs: "high housing costs and a less distinctive cultural core than the biggest Northeast cities", summaryNote: "It fits users who want access to New York without living fully inside it.", tweaks: { housingCostIndex: -0.02, taxBurdenIndex: 0.03, climateScore: 0.02, safetyScore: 0.1, educationScore: -0.02, healthcareScore: -0.02, jobMarketScore: -0.04, walkabilityScore: -0.1, transitScore: -0.08, recreationScore: -0.03, disasterRiskIndex: 0.02 } },
  { slug: "buffalo-ny", name: "Buffalo", state: "New York", population: 276486, latitude: "42.88645", longitude: "-78.87837", profile: "greatLakesHub", highlights: "Low housing costs, legacy infrastructure, and improving neighborhood vitality", tradeoffs: "heavy winter weather and a smaller high-opportunity job base", summaryNote: "Buffalo offers one of the lowest-cost entries into an urban Great Lakes lifestyle.", tweaks: { housingCostIndex: -0.12, taxBurdenIndex: 0.08, climateScore: -0.17, safetyScore: -0.03, educationScore: -0.02, healthcareScore: -0.02, jobMarketScore: -0.14, walkabilityScore: 0.04, transitScore: 0.03, recreationScore: 0.01, disasterRiskIndex: -0.02 } },
  { slug: "rochester-ny", name: "Rochester", state: "New York", population: 211328, latitude: "43.15658", longitude: "-77.60885", profile: "greatLakesHub", highlights: "Reasonable housing, stable healthcare, and a compact urban core", tradeoffs: "weaker job momentum and colder weather", summaryNote: "It is less dynamic than Buffalo or Pittsburgh, but often steadier on everyday costs.", tweaks: { housingCostIndex: -0.08, taxBurdenIndex: 0.07, climateScore: -0.15, safetyScore: -0.02, educationScore: 0.01, healthcareScore: 0.01, jobMarketScore: -0.13, walkabilityScore: 0.01, transitScore: -0.03, recreationScore: -0.02, disasterRiskIndex: -0.03 } },
  { slug: "milwaukee-wi", name: "Milwaukee", state: "Wisconsin", population: 561385, latitude: "43.03890", longitude: "-87.90647", profile: "greatLakesHub", highlights: "Great Lakes waterfront access, lower housing costs than Chicago, and legacy urban neighborhoods", tradeoffs: "higher winter drag and a more uneven safety picture", summaryNote: "Milwaukee adds another transit-capable, value-oriented Midwest finalist option.", tweaks: { housingCostIndex: -0.02, taxBurdenIndex: 0.05, climateScore: -0.09, safetyScore: -0.11, educationScore: -0.02, healthcareScore: 0.01, jobMarketScore: -0.05, walkabilityScore: 0.08, transitScore: 0.06, recreationScore: 0.03, disasterRiskIndex: -0.03 } },
  { slug: "baltimore-md", name: "Baltimore", state: "Maryland", population: 565708, latitude: "39.29038", longitude: "-76.61219", profile: "midAtlanticCorridor", highlights: "Powerful healthcare institutions and historic rowhouse neighborhoods", tradeoffs: "a more uneven safety landscape and patchier public-space quality", summaryNote: "Baltimore is institution-rich and more affordable than nearby D.C., but the tradeoffs are visible.", tweaks: { housingCostIndex: -0.1, taxBurdenIndex: -0.02, climateScore: 0.05, safetyScore: -0.16, healthcareScore: 0.09, educationScore: -0.05, jobMarketScore: -0.01, walkabilityScore: 0.05, transitScore: 0.01, recreationScore: -0.05, disasterRiskIndex: -0.02 } },
  { slug: "washington-dc", name: "Washington", state: "District of Columbia", population: 678972, latitude: "38.90719", longitude: "-77.03687", profile: "midAtlanticCorridor", highlights: "Policy, healthcare, and professional jobs with some of the strongest urban mobility in the country", tradeoffs: "high housing costs and a more expensive everyday baseline than most peers", summaryNote: "D.C. behaves like a premium corridor city even when it is not fully Northeast-priced.", tweaks: { housingCostIndex: 0.17, taxBurdenIndex: -0.01, safetyScore: 0.03, educationScore: 0.08, healthcareScore: 0.04, jobMarketScore: 0.08, walkabilityScore: 0.12, transitScore: 0.15, recreationScore: 0.04, internetQualityScore: 0.03, disasterRiskIndex: -0.02 } },
  { slug: "alexandria-va", name: "Alexandria", state: "Virginia", population: 159467, latitude: "38.80484", longitude: "-77.04692", profile: "midAtlanticCorridor", highlights: "High walkability, rail access, and a polished urban-suburban balance", tradeoffs: "high housing prices and a commuter-market cost structure", summaryNote: "Alexandria works best for users prioritizing D.C. access with a calmer neighborhood feel.", tweaks: { housingCostIndex: 0.11, taxBurdenIndex: -0.08, climateScore: 0.05, safetyScore: 0.16, educationScore: 0.1, healthcareScore: 0.02, jobMarketScore: 0, walkabilityScore: 0.11, transitScore: 0.1, recreationScore: 0.01, disasterRiskIndex: -0.03 } },
  { slug: "portland-me", name: "Portland", state: "Maine", population: 68408, latitude: "43.65910", longitude: "-70.25682", profile: "collegeBalanced", highlights: "Coastal charm, strong food and recreation access, and a compact center", tradeoffs: "higher costs for a smaller market and long winters", summaryNote: "Portland, Maine feels lifestyle-rich but opportunity-light relative to larger metros.", tweaks: { housingCostIndex: 0.09, taxBurdenIndex: 0.08, climateScore: -0.16, safetyScore: 0.05, educationScore: -0.02, healthcareScore: -0.04, jobMarketScore: -0.18, walkabilityScore: 0.03, transitScore: -0.09, recreationScore: 0.03, internetQualityScore: -0.03, disasterRiskIndex: -0.04 } },
  { slug: "durham-nc", name: "Durham", state: "North Carolina", population: 296186, latitude: "35.99403", longitude: "-78.89862", profile: "sunbeltGrowth", highlights: "Research Triangle jobs, stronger urban neighborhoods, and good healthcare access", tradeoffs: "a smaller footprint and less polished transit than major East Coast cities", summaryNote: "Durham leans a little more urban and healthcare-heavy than Raleigh.", tweaks: { housingCostIndex: 0.01, taxBurdenIndex: 0.02, safetyScore: -0.01, educationScore: 0.08, healthcareScore: 0.08, jobMarketScore: 0.02, walkabilityScore: 0.09, transitScore: 0.02, recreationScore: 0.02, disasterRiskIndex: -0.02 } },
  { slug: "chapel-hill-nc", name: "Chapel Hill", state: "North Carolina", population: 61960, latitude: "35.91320", longitude: "-79.05584", profile: "collegeBalanced", highlights: "Strong education and healthcare with a more compact college-town feel", tradeoffs: "a small labor market outside university-linked sectors and higher prices than many nearby towns", summaryNote: "It is a high-functioning small market for users prioritizing institutions over size.", tweaks: { housingCostIndex: 0.04, climateScore: 0.15, safetyScore: 0.04, educationScore: 0.04, healthcareScore: 0.05, jobMarketScore: 0.02, transitScore: -0.02, recreationScore: -0.02, disasterRiskIndex: -0.03 } },
  { slug: "savannah-ga", name: "Savannah", state: "Georgia", population: 147780, latitude: "32.08090", longitude: "-81.09120", profile: "sunbeltGrowth", highlights: "Historic urban fabric, coastal lifestyle, and a more walkable core than many Southern peers", tradeoffs: "modest job depth and storm-season exposure", summaryNote: "Savannah is more lifestyle-first than career-first, which makes it distinct in the South.", tweaks: { housingCostIndex: -0.01, taxBurdenIndex: 0.02, climateScore: 0.06, safetyScore: -0.05, educationScore: -0.07, healthcareScore: -0.08, jobMarketScore: -0.17, walkabilityScore: 0.17, transitScore: -0.01, recreationScore: 0.08, disasterRiskIndex: 0.2 } },
  { slug: "charleston-sc", name: "Charleston", state: "South Carolina", population: 155369, latitude: "32.77647", longitude: "-79.93105", profile: "sunbeltGrowth", highlights: "Distinctive historic core, strong coastal lifestyle, and growing professional demand", tradeoffs: "higher housing costs for the South and hurricane exposure", summaryNote: "Charleston blends charm and growth, but coastal pricing and risk are real.", tweaks: { housingCostIndex: 0.11, taxBurdenIndex: 0, climateScore: 0.07, safetyScore: 0.02, educationScore: -0.01, healthcareScore: -0.03, jobMarketScore: -0.02, walkabilityScore: 0.13, transitScore: -0.03, recreationScore: 0.11, disasterRiskIndex: 0.22 } },
  { slug: "greenville-sc", name: "Greenville", state: "South Carolina", population: 74485, latitude: "34.85262", longitude: "-82.39401", profile: "sunbeltGrowth", highlights: "Fast-growing downtown, lower housing pressure, and a polished small-city feel", tradeoffs: "a smaller labor market and limited transit breadth", summaryNote: "Greenville fills the gap between large Southern growth hubs and much smaller towns.", tweaks: { housingCostIndex: -0.1, taxBurdenIndex: 0, climateScore: -0.01, safetyScore: 0.05, educationScore: -0.03, healthcareScore: -0.06, jobMarketScore: -0.11, walkabilityScore: 0.09, transitScore: -0.08, recreationScore: 0.03, internetQualityScore: -0.02, disasterRiskIndex: -0.05 } },
  { slug: "chattanooga-tn", name: "Chattanooga", state: "Tennessee", population: 187030, latitude: "35.04563", longitude: "-85.30968", profile: "sunbeltGrowth", highlights: "Outdoor access, strong internet infrastructure, and a manageable-sized downtown", tradeoffs: "smaller job depth and limited transit", summaryNote: "Its digital-infrastructure story is stronger than most similar-sized Southern cities.", tweaks: { housingCostIndex: -0.07, taxBurdenIndex: -0.06, climateScore: -0.02, safetyScore: -0.01, educationScore: -0.04, healthcareScore: -0.05, jobMarketScore: -0.13, walkabilityScore: 0.07, transitScore: -0.04, recreationScore: 0.11, internetQualityScore: 0.08, disasterRiskIndex: -0.04 } },
  { slug: "knoxville-tn", name: "Knoxville", state: "Tennessee", population: 198162, latitude: "35.96064", longitude: "-83.92074", profile: "sunbeltGrowth", highlights: "Lower housing costs, access to the Smokies, and a calmer growth profile", tradeoffs: "more limited urban mobility and a smaller professional job market", summaryNote: "Knoxville is a practical lower-cost outdoor option in the Southeast.", tweaks: { housingCostIndex: -0.11, taxBurdenIndex: -0.06, climateScore: -0.01, safetyScore: 0.02, educationScore: -0.05, healthcareScore: -0.04, jobMarketScore: -0.16, walkabilityScore: -0.02, transitScore: -0.08, recreationScore: 0.08, disasterRiskIndex: -0.03 } },
  { slug: "huntsville-al", name: "Huntsville", state: "Alabama", population: 235688, latitude: "34.73037", longitude: "-86.58610", profile: "sunbeltGrowth", highlights: "Aerospace and engineering jobs with better safety and schools than many Southern peers", tradeoffs: "modest urban density and limited transit", summaryNote: "Huntsville stands out in the South for technical jobs without coastal pricing.", tweaks: { housingCostIndex: -0.09, taxBurdenIndex: 0, climateScore: -0.02, safetyScore: 0.09, educationScore: 0.05, healthcareScore: -0.03, jobMarketScore: 0.05, walkabilityScore: -0.08, transitScore: -0.1, recreationScore: -0.03, disasterRiskIndex: -0.08 } },
  { slug: "birmingham-al", name: "Birmingham", state: "Alabama", population: 196910, latitude: "33.51859", longitude: "-86.81036", profile: "sunbeltGrowth", highlights: "Healthcare depth, lower housing costs, and a more urban street grid than many peer metros", tradeoffs: "a more uneven safety picture and lighter job diversity", summaryNote: "The city remains healthcare-led, with value upside but more visible tradeoffs.", tweaks: { housingCostIndex: -0.14, taxBurdenIndex: 0.01, climateScore: -0.02, safetyScore: -0.15, educationScore: -0.06, healthcareScore: 0.06, jobMarketScore: -0.12, walkabilityScore: 0.08, transitScore: -0.04, recreationScore: -0.02, disasterRiskIndex: -0.02 } },
  { slug: "st-petersburg-fl", name: "St. Petersburg", state: "Florida", population: 261256, latitude: "27.76760", longitude: "-82.64029", profile: "floridaCoastal", highlights: "Waterfront lifestyle, arts energy, and more walkable neighborhoods than much of Florida", tradeoffs: "storm exposure and a tourism-influenced housing market", summaryNote: "It feels more lifestyle-forward and urban than many Florida peers of similar size.", tweaks: { housingCostIndex: 0.02, safetyScore: 0.03, educationScore: -0.03, healthcareScore: -0.01, jobMarketScore: -0.05, walkabilityScore: 0.12, transitScore: -0.02, recreationScore: 0.03, disasterRiskIndex: 0 } },
  { slug: "orlando-fl", name: "Orlando", state: "Florida", population: 316081, latitude: "28.53834", longitude: "-81.37924", profile: "floridaCoastal", highlights: "Broad tourism and service employment with newer infrastructure and family amenities", tradeoffs: "hotter inland conditions and weaker transit than the density suggests", summaryNote: "Orlando is more economy-diverse than a theme-park stereotype, but still climate- and car-heavy.", tweaks: { housingCostIndex: -0.03, climateScore: -0.01, safetyScore: 0, educationScore: -0.02, healthcareScore: -0.04, jobMarketScore: 0, walkabilityScore: -0.06, transitScore: -0.07, recreationScore: -0.02, disasterRiskIndex: -0.05 } },
  { slug: "jacksonville-fl", name: "Jacksonville", state: "Florida", population: 985843, latitude: "30.33218", longitude: "-81.65565", profile: "floridaCoastal", highlights: "A larger labor market and more attainable housing than South Florida", tradeoffs: "very spread-out daily life and ongoing hurricane exposure", summaryNote: "Jacksonville is practical rather than polished, which gives it a different Florida profile.", tweaks: { housingCostIndex: -0.12, safetyScore: 0.01, educationScore: -0.02, healthcareScore: -0.02, jobMarketScore: -0.04, walkabilityScore: -0.15, transitScore: -0.14, recreationScore: -0.03, disasterRiskIndex: -0.02 } },
  { slug: "fort-lauderdale-fl", name: "Fort Lauderdale", state: "Florida", population: 184255, latitude: "26.12244", longitude: "-80.13732", profile: "floridaCoastal", highlights: "Warm-water lifestyle, international connections, and more walkable waterfront districts", tradeoffs: "high housing costs and pronounced storm risk", summaryNote: "It performs like a slightly calmer but still expensive South Florida option.", tweaks: { housingCostIndex: 0.1, safetyScore: 0, educationScore: -0.01, healthcareScore: 0.01, jobMarketScore: 0.02, walkabilityScore: 0.12, transitScore: 0.08, recreationScore: 0.05, disasterRiskIndex: 0.05 } },
  { slug: "saint-paul-mn", name: "Saint Paul", state: "Minnesota", population: 311527, latitude: "44.95370", longitude: "-93.08996", profile: "greatLakesHub", highlights: "Stable public-sector and healthcare presence with calmer neighborhoods than many major metros", tradeoffs: "cold winters and a smaller downtown job core than Minneapolis", summaryNote: "Saint Paul behaves like a steadier, slightly quieter twin to Minneapolis.", tweaks: { housingCostIndex: -0.03, climateScore: -0.07, safetyScore: 0.08, educationScore: 0.04, healthcareScore: 0.03, jobMarketScore: -0.06, walkabilityScore: 0.05, transitScore: 0.08, recreationScore: 0.07, disasterRiskIndex: -0.01 } },
  { slug: "detroit-mi", name: "Detroit", state: "Michigan", population: 633218, latitude: "42.33143", longitude: "-83.04575", profile: "greatLakesHub", highlights: "Major employers, cultural depth, and low housing costs for a large metro", tradeoffs: "a sharper safety divide and a still-recovering neighborhood fabric", summaryNote: "Detroit can score surprisingly well on value, but local conditions vary widely.", tweaks: { housingCostIndex: -0.14, taxBurdenIndex: 0.03, climateScore: -0.02, safetyScore: -0.22, educationScore: -0.06, healthcareScore: 0.02, jobMarketScore: 0.02, walkabilityScore: -0.06, transitScore: -0.16, recreationScore: 0.01, disasterRiskIndex: -0.05 } },
  { slug: "grand-rapids-mi", name: "Grand Rapids", state: "Michigan", population: 198917, latitude: "42.96336", longitude: "-85.66809", profile: "greatLakesHub", highlights: "Moderate costs, solid healthcare, and a steadier safety profile than many legacy cities", tradeoffs: "less transit and smaller job depth than the top-tier Midwest metros", summaryNote: "Grand Rapids works well as a practical, medium-sized Midwest compromise.", tweaks: { housingCostIndex: -0.04, taxBurdenIndex: 0.02, climateScore: -0.04, safetyScore: 0.07, educationScore: 0.01, healthcareScore: 0.02, jobMarketScore: -0.03, walkabilityScore: -0.08, transitScore: -0.18, recreationScore: 0.01, disasterRiskIndex: -0.03 } },
  { slug: "cleveland-oh", name: "Cleveland", state: "Ohio", population: 362656, latitude: "41.49932", longitude: "-81.69436", profile: "greatLakesHub", highlights: "Top-tier healthcare institutions and attainable housing", tradeoffs: "colder weather, slower growth, and a more uneven safety picture", summaryNote: "Healthcare is the standout advantage in a metro that otherwise feels slower-paced.", tweaks: { housingCostIndex: -0.09, climateScore: -0.03, safetyScore: -0.09, healthcareScore: 0.11, jobMarketScore: -0.06, walkabilityScore: -0.02, transitScore: -0.03, recreationScore: -0.02 } },
  { slug: "indianapolis-in", name: "Indianapolis", state: "Indiana", population: 879293, latitude: "39.76838", longitude: "-86.15804", profile: "plainsValue", highlights: "Central location, moderate costs, and a stable healthcare and logistics economy", tradeoffs: "limited transit and a mostly car-first metro shape", summaryNote: "Indianapolis is broad and practical rather than urban and transit-rich.", tweaks: { housingCostIndex: 0.06, taxBurdenIndex: -0.02, safetyScore: -0.03, educationScore: -0.01, healthcareScore: 0.04, jobMarketScore: 0.03, walkabilityScore: 0.02, transitScore: 0.05, recreationScore: 0.03, disasterRiskIndex: -0.04 } },
  { slug: "louisville-ky", name: "Louisville", state: "Kentucky", population: 622981, latitude: "38.25266", longitude: "-85.75846", profile: "plainsValue", highlights: "Lower housing costs, logistics access, and stronger urban neighborhoods than many peer metros", tradeoffs: "modest transit and mixed safety depending on neighborhood", summaryNote: "Louisville lands between Midwest value metros and Southern growth cities.", tweaks: { housingCostIndex: 0, climateScore: 0.05, safetyScore: -0.08, educationScore: -0.01, healthcareScore: 0.03, jobMarketScore: 0.01, walkabilityScore: 0.08, transitScore: 0.03, recreationScore: 0.04, disasterRiskIndex: -0.02 } },
  { slug: "des-moines-ia", name: "Des Moines", state: "Iowa", population: 214133, latitude: "41.58684", longitude: "-93.62496", profile: "plainsValue", highlights: "Insurance and finance employers with low housing pressure and a steady pace of life", tradeoffs: "smaller-city amenities and limited transit", summaryNote: "Des Moines is one of the cleaner low-cost options for users prioritizing stability over urban intensity.", tweaks: { housingCostIndex: 0.01, taxBurdenIndex: 0.04, climateScore: -0.03, safetyScore: 0.06, educationScore: 0.02, healthcareScore: -0.01, jobMarketScore: 0.02, walkabilityScore: 0.02, transitScore: 0.03, recreationScore: -0.01, disasterRiskIndex: 0.01 } },
  { slug: "houston-tx", name: "Houston", state: "Texas", population: 2304580, latitude: "29.76043", longitude: "-95.36980", profile: "texasScale", highlights: "Huge job diversity, top healthcare access, and broad housing supply", tradeoffs: "heat, flooding exposure, and an extremely car-dependent footprint", summaryNote: "Houston combines scale and value better than many peers, but climate risk is very real.", tweaks: { housingCostIndex: -0.01, taxBurdenIndex: -0.01, climateScore: -0.05, safetyScore: -0.04, educationScore: 0.02, healthcareScore: 0.1, jobMarketScore: 0.05, walkabilityScore: -0.08, transitScore: 0.04, recreationScore: -0.01, disasterRiskIndex: 0.18 } },
  { slug: "fort-worth-tx", name: "Fort Worth", state: "Texas", population: 956709, latitude: "32.75549", longitude: "-97.33077", profile: "texasScale", highlights: "Lower housing pressure than Dallas with steady job access and a growing urban core", tradeoffs: "lighter transit and less walkability than the region's biggest peers", summaryNote: "Fort Worth gives up some big-metro polish in exchange for slightly easier daily costs.", tweaks: { housingCostIndex: -0.05, safetyScore: 0.01, educationScore: 0.01, healthcareScore: -0.02, jobMarketScore: -0.04, walkabilityScore: -0.02, transitScore: -0.04, recreationScore: 0, disasterRiskIndex: -0.01 } },
  { slug: "el-paso-tx", name: "El Paso", state: "Texas", population: 678958, latitude: "31.76188", longitude: "-106.48502", profile: "texasScale", highlights: "Lower housing costs and a calmer pace than the state's biggest metros", tradeoffs: "a smaller labor market and lighter big-city amenities", summaryNote: "El Paso is more affordable and stable than fast-growth Texas metros, but less broad for career moves.", tweaks: { housingCostIndex: -0.15, climateScore: -0.04, safetyScore: 0.12, educationScore: -0.03, healthcareScore: -0.04, jobMarketScore: -0.23, walkabilityScore: 0.02, transitScore: 0.05, recreationScore: 0.02, internetQualityScore: -0.03, disasterRiskIndex: -0.07 } },
  { slug: "boulder-co", name: "Boulder", state: "Colorado", population: 105673, latitude: "40.01499", longitude: "-105.27055", profile: "mountainOutdoor", highlights: "High education levels, elite recreation access, and a very strong quality-of-life feel", tradeoffs: "premium housing costs and a smaller labor market than Denver", summaryNote: "Boulder is an outdoor and education standout, but the price tag is correspondingly steep.", tweaks: { housingCostIndex: 0.2, taxBurdenIndex: 0.02, climateScore: 0.05, safetyScore: 0.12, educationScore: 0.12, healthcareScore: 0.01, jobMarketScore: -0.01, walkabilityScore: 0.13, transitScore: 0.12, recreationScore: 0.04, internetQualityScore: 0.05, disasterRiskIndex: 0.04 } },
  { slug: "colorado-springs-co", name: "Colorado Springs", state: "Colorado", population: 491628, latitude: "38.83388", longitude: "-104.82136", profile: "mountainOutdoor", highlights: "Front Range recreation, military and defense jobs, and somewhat easier housing than Denver", tradeoffs: "less transit and a more suburban daily pattern", summaryNote: "It is one of the broader lower-cost Mountain West alternatives to Denver.", tweaks: { housingCostIndex: -0.01, safetyScore: 0.02, educationScore: 0, healthcareScore: -0.03, jobMarketScore: 0.01, walkabilityScore: -0.11, transitScore: -0.14, recreationScore: 0.01, disasterRiskIndex: 0.02 } },
  { slug: "albuquerque-nm", name: "Albuquerque", state: "New Mexico", population: 564559, latitude: "35.08439", longitude: "-106.65042", profile: "mountainOutdoor", highlights: "Lower housing costs, desert mountain access, and a distinctive cultural identity", tradeoffs: "a mixed safety picture and a smaller opportunity base", summaryNote: "Albuquerque brings outdoor access at a much lower cost, but tradeoffs show up in safety and jobs.", tweaks: { housingCostIndex: -0.14, taxBurdenIndex: 0.03, climateScore: 0.04, safetyScore: -0.14, educationScore: -0.07, healthcareScore: -0.05, jobMarketScore: -0.13, walkabilityScore: -0.02, transitScore: -0.02, recreationScore: 0.01, internetQualityScore: -0.04, disasterRiskIndex: -0.01 } },
  { slug: "santa-fe-nm", name: "Santa Fe", state: "New Mexico", population: 89228, latitude: "35.68700", longitude: "-105.93780", profile: "mountainOutdoor", highlights: "Arts and culture, scenery, and a calmer small-city pace", tradeoffs: "a smaller labor market and premium housing for its size", summaryNote: "Santa Fe is lifestyle-rich but opportunity-light, making it distinct from bigger Southwestern metros.", tweaks: { housingCostIndex: 0.08, taxBurdenIndex: 0.04, climateScore: 0.07, safetyScore: 0.09, educationScore: 0.03, healthcareScore: -0.04, jobMarketScore: -0.24, walkabilityScore: 0.12, transitScore: -0.09, recreationScore: 0.03, internetQualityScore: -0.05, disasterRiskIndex: -0.03 } },
  { slug: "oklahoma-city-ok", name: "Oklahoma City", state: "Oklahoma", population: 702767, latitude: "35.46756", longitude: "-97.51643", profile: "plainsValue", highlights: "Low housing costs, steady growth, and a more manageable large-metro price point", tradeoffs: "lighter transit and higher severe-weather exposure", summaryNote: "It stays attractive on cost, but disaster risk is a real scoring consideration.", tweaks: { housingCostIndex: 0.01, taxBurdenIndex: -0.01, climateScore: 0, safetyScore: -0.06, educationScore: -0.04, healthcareScore: 0, jobMarketScore: 0.02, walkabilityScore: 0.01, transitScore: 0.02, recreationScore: 0.01, disasterRiskIndex: 0.14 } },
  { slug: "missoula-mt", name: "Missoula", state: "Montana", population: 77457, latitude: "46.87215", longitude: "-113.99400", profile: "mountainOutdoor", highlights: "Outdoor access, small-city livability, and a strong sense of place", tradeoffs: "a much smaller job market and limited transit", summaryNote: "Missoula is a lifestyle pick first, not a broad-opportunity metro.", tweaks: { housingCostIndex: 0.02, taxBurdenIndex: 0.02, climateScore: -0.08, safetyScore: 0.08, educationScore: 0.01, healthcareScore: -0.08, jobMarketScore: -0.24, walkabilityScore: 0.04, transitScore: -0.11, recreationScore: 0.03, internetQualityScore: -0.06, disasterRiskIndex: -0.04 } },
  { slug: "flagstaff-az", name: "Flagstaff", state: "Arizona", population: 76939, latitude: "35.19828", longitude: "-111.65130", profile: "mountainOutdoor", highlights: "Cooler mountain climate, trail access, and a safer small-city feel", tradeoffs: "limited job depth and higher housing costs than many expect for Arizona", summaryNote: "Flagstaff is a niche outdoor-and-climate option rather than a broad labor market.", tweaks: { housingCostIndex: 0.04, taxBurdenIndex: 0.03, climateScore: 0.1, safetyScore: 0.07, educationScore: 0.01, healthcareScore: -0.05, jobMarketScore: -0.23, walkabilityScore: 0.07, transitScore: -0.01, recreationScore: 0.03, internetQualityScore: -0.02, disasterRiskIndex: -0.02 } },
  { slug: "bellevue-wa", name: "Bellevue", state: "Washington", population: 154600, latitude: "47.61010", longitude: "-122.20152", profile: "westCoastPremium", highlights: "High-paying jobs, polished public realm, and strong safety by regional standards", tradeoffs: "premium housing costs and a more corporate than eclectic feel", summaryNote: "Bellevue behaves like a top-tier opportunity market with a calmer everyday experience than Seattle.", tweaks: { taxBurdenIndex: -0.29, climateScore: -0.12, safetyScore: 0.14, educationScore: 0.1, healthcareScore: 0.01, jobMarketScore: 0.05, walkabilityScore: -0.09, transitScore: -0.02, recreationScore: -0.01, internetQualityScore: 0.04, disasterRiskIndex: -0.01 } },
  { slug: "spokane-wa", name: "Spokane", state: "Washington", population: 229447, latitude: "47.65878", longitude: "-117.42605", profile: "mountainOutdoor", highlights: "Lower costs than the Puget Sound with access to lakes, trails, and a moderate healthcare base", tradeoffs: "less job depth and weaker transit than Seattle or Portland", summaryNote: "It is one of the more accessible Inland Northwest entries for users priced out of the coast.", tweaks: { housingCostIndex: -0.12, taxBurdenIndex: -0.07, climateScore: -0.08, safetyScore: -0.01, educationScore: -0.04, healthcareScore: -0.03, jobMarketScore: -0.14, walkabilityScore: -0.04, transitScore: -0.08, recreationScore: -0.01, internetQualityScore: -0.03, disasterRiskIndex: -0.02 } },
  { slug: "eugene-or", name: "Eugene", state: "Oregon", population: 177899, latitude: "44.05207", longitude: "-123.08675", profile: "collegeBalanced", highlights: "Bikeable neighborhoods, university energy, and easy outdoor access", tradeoffs: "a smaller labor market and higher taxes than many Western peers", summaryNote: "Eugene is lifestyle- and education-friendly, but less economically broad than Portland.", tweaks: { housingCostIndex: 0.04, taxBurdenIndex: 0.12, climateScore: 0.01, safetyScore: -0.04, educationScore: 0.01, healthcareScore: -0.06, jobMarketScore: -0.16, walkabilityScore: 0.02, transitScore: -0.01, recreationScore: 0.04, internetQualityScore: -0.03, disasterRiskIndex: -0.01 } },
  { slug: "bend-or", name: "Bend", state: "Oregon", population: 104557, latitude: "44.05817", longitude: "-121.31531", profile: "mountainOutdoor", highlights: "Elite outdoor access, strong small-city lifestyle appeal, and good internet quality", tradeoffs: "premium housing costs and a narrower job market", summaryNote: "Bend is a pure lifestyle market, which makes it rank differently than broader metros.", tweaks: { housingCostIndex: 0.14, taxBurdenIndex: 0.08, climateScore: 0.06, safetyScore: 0.06, educationScore: -0.01, healthcareScore: -0.06, jobMarketScore: -0.19, walkabilityScore: -0.01, transitScore: -0.11, recreationScore: 0.03, internetQualityScore: 0.02, disasterRiskIndex: 0.02 } },
  { slug: "san-jose-ca", name: "San Jose", state: "California", population: 971233, latitude: "37.33821", longitude: "-121.88633", profile: "westCoastPremium", highlights: "Elite tech jobs, strong schools, and a highly educated labor market", tradeoffs: "extreme housing costs and a more expensive suburban pattern than San Francisco proper", summaryNote: "San Jose maximizes income potential but asks users to absorb very high housing pressure.", tweaks: { housingCostIndex: 0.07, taxBurdenIndex: 0.07, climateScore: 0.11, safetyScore: 0.11, educationScore: 0.13, healthcareScore: 0.01, jobMarketScore: 0.04, walkabilityScore: -0.12, transitScore: -0.08, recreationScore: -0.01, internetQualityScore: 0.03, disasterRiskIndex: 0.04 } },
  { slug: "oakland-ca", name: "Oakland", state: "California", population: 436504, latitude: "37.80436", longitude: "-122.27111", profile: "westCoastPremium", highlights: "Bay Area job access, better neighborhood walkability, and diverse urban energy", tradeoffs: "high costs and a more uneven safety profile than the highest-priced suburbs", summaryNote: "Oakland trades some polish for more texture and relative access inside the Bay.", tweaks: { housingCostIndex: -0.05, taxBurdenIndex: 0.07, climateScore: 0.07, safetyScore: -0.12, educationScore: -0.01, healthcareScore: -0.03, jobMarketScore: 0.03, walkabilityScore: 0.11, transitScore: 0.11, recreationScore: 0.01, internetQualityScore: -0.01, disasterRiskIndex: 0.04 } },
  { slug: "long-beach-ca", name: "Long Beach", state: "California", population: 466742, latitude: "33.77005", longitude: "-118.19374", profile: "westCoastPremium", highlights: "Coastal access, denser neighborhoods, and a more attainable Southern California option than the beach elite", tradeoffs: "still-high housing costs and only moderate job depth compared with Los Angeles proper", summaryNote: "Long Beach works as a lifestyle-heavy compromise rather than a cheap California outlier.", tweaks: { housingCostIndex: -0.08, taxBurdenIndex: 0.07, climateScore: 0.18, safetyScore: -0.03, educationScore: -0.04, healthcareScore: -0.04, jobMarketScore: -0.1, walkabilityScore: 0.04, transitScore: -0.02, recreationScore: 0.06, disasterRiskIndex: 0.02 } },
  { slug: "las-vegas-nv", name: "Las Vegas", state: "Nevada", population: 656274, latitude: "36.16994", longitude: "-115.13983", profile: "sunbeltGrowth", highlights: "No state income tax, big hospitality and logistics employment, and relatively broad housing supply", tradeoffs: "extreme summer heat and weaker schools than many peer metros", summaryNote: "Las Vegas has clear tax and cost appeal, but quality-of-life signals are mixed.", tweaks: { housingCostIndex: -0.01, taxBurdenIndex: -0.1, climateScore: -0.18, safetyScore: -0.07, educationScore: -0.08, healthcareScore: -0.08, jobMarketScore: -0.04, walkabilityScore: -0.06, transitScore: -0.03, recreationScore: 0.02, internetQualityScore: -0.01, disasterRiskIndex: 0.04 } },
  { slug: "reno-nv", name: "Reno", state: "Nevada", population: 274915, latitude: "39.52963", longitude: "-119.81380", profile: "mountainOutdoor", highlights: "Lower taxes, improving job diversity, and access to Tahoe-region recreation", tradeoffs: "rising housing costs and moderate wildfire or smoke exposure", summaryNote: "Reno has become more dynamic, but housing pressure has followed the growth.", tweaks: { housingCostIndex: 0.02, taxBurdenIndex: -0.08, climateScore: 0, safetyScore: -0.01, educationScore: -0.04, healthcareScore: -0.03, jobMarketScore: 0.01, walkabilityScore: -0.06, transitScore: -0.07, recreationScore: 0.01, internetQualityScore: -0.01, disasterRiskIndex: 0.04 } },
  { slug: "asheville-nc", name: "Asheville", state: "North Carolina", population: 96243, latitude: "35.59506", longitude: "-82.55149", profile: "mountainOutdoor", highlights: "Blue Ridge recreation, strong tourism appeal, and a more walkable small-city core", tradeoffs: "a narrower labor market and housing costs that run high for the region", summaryNote: "Asheville behaves like a lifestyle-first mountain city with a smaller economic base.", tweaks: { housingCostIndex: 0.03, taxBurdenIndex: 0.04, climateScore: 0.05, safetyScore: 0.02, educationScore: -0.01, healthcareScore: -0.04, jobMarketScore: -0.18, walkabilityScore: 0.08, transitScore: -0.05, recreationScore: 0.02, internetQualityScore: -0.03, disasterRiskIndex: -0.01 } },
  { slug: "new-orleans-la", name: "New Orleans", state: "Louisiana", population: 364136, latitude: "29.95107", longitude: "-90.07153", profile: "sunbeltGrowth", highlights: "Distinctive culture, walkable historic neighborhoods, and strong food and music identity", tradeoffs: "elevated storm exposure, uneven safety, and a more fragile local economy", summaryNote: "New Orleans brings unique lifestyle value, but risk and infrastructure tradeoffs remain large.", tweaks: { housingCostIndex: -0.02, taxBurdenIndex: 0.06, climateScore: 0.03, safetyScore: -0.18, educationScore: -0.1, healthcareScore: -0.06, jobMarketScore: -0.15, walkabilityScore: 0.18, transitScore: 0.05, recreationScore: 0.03, internetQualityScore: -0.04, disasterRiskIndex: 0.38 } }
);

CITY_BLUEPRINTS.push(
  { slug: "memphis-tn", name: "Memphis", state: "Tennessee", population: 618639, latitude: "35.14953", longitude: "-90.04898", profile: "sunbeltGrowth", highlights: "Logistics strength, musical identity, and lower housing costs than many Southern peers", tradeoffs: "a much weaker safety profile and lighter transit and school performance", summaryNote: "Memphis adds value variety to the South, but safety remains a major constraint.", tweaks: { housingCostIndex: -0.14, taxBurdenIndex: -0.06, safetyScore: -0.25, educationScore: -0.12, healthcareScore: -0.03, jobMarketScore: -0.06, walkabilityScore: 0.02, transitScore: -0.03, recreationScore: -0.03, disasterRiskIndex: 0 } },
  { slug: "fort-collins-co", name: "Fort Collins", state: "Colorado", population: 169810, latitude: "40.58526", longitude: "-105.08442", profile: "collegeBalanced", highlights: "Strong biking, outdoor access, and a highly livable college-town environment", tradeoffs: "premium housing for the region and less labor-market depth than Denver", summaryNote: "Fort Collins is a polished smaller option for users prioritizing lifestyle and education.", tweaks: { housingCostIndex: 0.1, taxBurdenIndex: -0.05, climateScore: -0.01, safetyScore: 0.04, educationScore: 0.03, healthcareScore: -0.02, jobMarketScore: -0.01, walkabilityScore: -0.01, transitScore: 0.02, recreationScore: 0.09, disasterRiskIndex: 0.02 } },
  { slug: "spartanburg-sc", name: "Spartanburg", state: "South Carolina", population: 38118, latitude: "34.94957", longitude: "-81.93205", profile: "sunbeltGrowth", highlights: "Lower housing costs and manufacturing-adjacent jobs with a small-city pace", tradeoffs: "lighter healthcare depth and less urban fabric than bigger Carolinas metros", summaryNote: "This is intentionally a smaller-market Southern option for recommendation breadth.", tweaks: { housingCostIndex: -0.16, taxBurdenIndex: 0, climateScore: -0.02, safetyScore: 0.02, educationScore: -0.08, healthcareScore: -0.11, jobMarketScore: -0.14, walkabilityScore: -0.1, transitScore: -0.12, recreationScore: -0.05, internetQualityScore: -0.05, disasterRiskIndex: -0.05 } },
  { slug: "provo-ut", name: "Provo", state: "Utah", population: 115162, latitude: "40.23384", longitude: "-111.65853", profile: "collegeBalanced", highlights: "Strong safety, education, and mountain access with a growing tech-adjacent economy", tradeoffs: "rising housing costs and a narrower lifestyle mix than Salt Lake City", summaryNote: "Provo appeals to users who want strong fundamentals in a smaller Wasatch Front setting.", tweaks: { housingCostIndex: 0.03, taxBurdenIndex: -0.15, climateScore: 0.02, safetyScore: 0.1, educationScore: 0.02, healthcareScore: -0.03, jobMarketScore: 0.03, walkabilityScore: -0.04, transitScore: 0.01, recreationScore: 0.08, disasterRiskIndex: 0 } },
  { slug: "fayetteville-ar", name: "Fayetteville", state: "Arkansas", population: 101680, latitude: "36.08216", longitude: "-94.17185", profile: "collegeBalanced", highlights: "University presence, growing regional employers, and accessible outdoor recreation", tradeoffs: "lighter transit and a smaller healthcare and job base than larger metros", summaryNote: "It gives the seed set a smaller high-functioning Southern college-market option.", tweaks: { housingCostIndex: -0.11, taxBurdenIndex: -0.02, climateScore: 0.02, safetyScore: 0.05, educationScore: 0, healthcareScore: -0.07, jobMarketScore: -0.08, walkabilityScore: -0.05, transitScore: -0.13, recreationScore: 0.03, internetQualityScore: -0.02, disasterRiskIndex: -0.04 } },
  { slug: "lexington-ky", name: "Lexington", state: "Kentucky", population: 322570, latitude: "38.04058", longitude: "-84.50372", profile: "collegeBalanced", highlights: "Horse-country quality of life, strong university anchors, and moderate housing costs", tradeoffs: "smaller job depth and limited transit", summaryNote: "Lexington offers a polished medium-size lifestyle with less career breadth than larger hubs.", tweaks: { housingCostIndex: -0.08, taxBurdenIndex: -0.02, climateScore: 0.03, safetyScore: 0.04, educationScore: 0.01, healthcareScore: -0.03, jobMarketScore: -0.1, walkabilityScore: -0.07, transitScore: -0.11, recreationScore: -0.01, disasterRiskIndex: -0.03 } },
  { slug: "lancaster-pa", name: "Lancaster", state: "Pennsylvania", population: 58706, latitude: "40.03788", longitude: "-76.30551", profile: "midAtlanticCorridor", highlights: "Walkable historic core, moderate housing costs, and easier day-to-day living than larger corridor cities", tradeoffs: "a smaller labor market and less transit breadth", summaryNote: "Lancaster adds a smaller corridor-adjacent option that still feels urban enough for many users.", tweaks: { housingCostIndex: -0.18, taxBurdenIndex: -0.03, climateScore: 0.01, safetyScore: 0.11, educationScore: -0.02, healthcareScore: -0.05, jobMarketScore: -0.23, walkabilityScore: -0.01, transitScore: -0.2, recreationScore: -0.02, disasterRiskIndex: -0.06 } }
);

const COUNTRY = "USA";

function clampMetric(value: number) {
  return Math.min(0.97, Math.max(0.08, Number(value.toFixed(3))));
}

function buildMetrics(profile: ProfileKey, tweaks?: Partial<MetricSet>) {
  const baseline = PROFILE_BASELINES[profile].metrics;

  return Object.fromEntries(
    Object.entries(baseline).map(([metricKey, baseValue]) => {
      const tweak = tweaks?.[metricKey as keyof MetricSet] ?? 0;
      return [metricKey, clampMetric(baseValue + tweak)];
    })
  ) as MetricSet;
}

function buildLocation(blueprint: CityBlueprint): SeedLocation {
  const metrics = buildMetrics(blueprint.profile, blueprint.tweaks);

  return {
    slug: blueprint.slug,
    name: blueprint.name,
    state: blueprint.state,
    country: COUNTRY,
    population: blueprint.population,
    description: `${blueprint.highlights} with ${blueprint.tradeoffs}.`,
    latitude: blueprint.latitude,
    longitude: blueprint.longitude,
    metrics: {
      ...metrics,
      sourceSummary: `${PROFILE_BASELINES[blueprint.profile].narrative} ${blueprint.summaryNote}`
    }
  };
}

const LOCATIONS: SeedLocation[] = CITY_BLUEPRINTS.map(buildLocation);

function validateLocations(locations: SeedLocation[]) {
  const warnings: string[] = [];
  const errors: string[] = [];
  const seenSlugs = new Set<string>();

  if (locations.length < 75 || locations.length > 150) {
    errors.push(`Expected between 75 and 150 locations, received ${locations.length}.`);
  }

  for (const location of locations) {
    if (seenSlugs.has(location.slug)) {
      errors.push(`Duplicate slug detected: ${location.slug}`);
      continue;
    }

    seenSlugs.add(location.slug);

    const {
      housingCostIndex,
      taxBurdenIndex,
      climateScore,
      safetyScore,
      educationScore,
      healthcareScore,
      jobMarketScore,
      walkabilityScore,
      transitScore,
      recreationScore,
      internetQualityScore,
      disasterRiskIndex
    } = location.metrics;

    const label = `${location.name}, ${location.state}`;

    if (location.population < 120000 && transitScore > 0.72) {
      errors.push(`${label} has unusually high transit for its population size.`);
    }

    if (location.population < 90000 && walkabilityScore > 0.86) {
      warnings.push(`${label} has very high walkability for a small market; verify it is intentional.`);
    }

    if (location.population > 900000 && transitScore < 0.18) {
      warnings.push(`${label} is a very large metro with notably weak transit.`);
    }

    if (transitScore > 0.65 && walkabilityScore < 0.5) {
      warnings.push(`${label} has strong transit but limited walkability; double-check the pairing.`);
    }

    if (walkabilityScore > 0.8 && transitScore < 0.28) {
      warnings.push(`${label} has very strong walkability but weak transit support.`);
    }

    if (disasterRiskIndex > 0.72 && housingCostIndex < 0.35) {
      warnings.push(`${label} combines very high disaster risk with unusually low housing cost pressure.`);
    }

    if (jobMarketScore > 0.83 && location.population < 100000) {
      warnings.push(`${label} has a top-tier job market score for a small city.`);
    }

    if (taxBurdenIndex < 0.35 && housingCostIndex > 0.9) {
      warnings.push(`${label} is both very low-tax and extremely high-cost; confirm the tradeoff is intended.`);
    }

    const metricsToCheck = [
      housingCostIndex,
      taxBurdenIndex,
      climateScore,
      safetyScore,
      educationScore,
      healthcareScore,
      jobMarketScore,
      walkabilityScore,
      transitScore,
      recreationScore,
      internetQualityScore,
      disasterRiskIndex
    ];

    if (metricsToCheck.some((metric) => metric < 0.08 || metric > 0.97)) {
      errors.push(`${label} has a metric outside the supported 0.08-0.97 range.`);
    }

    if (!location.description || !location.metrics.sourceSummary) {
      errors.push(`${label} is missing required summary text.`);
    }
  }

  if (warnings.length > 0) {
    console.warn("Seed warnings:");
    for (const warning of warnings) {
      console.warn(`- ${warning}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(`Seed validation failed:\n- ${errors.join("\n- ")}`);
  }
}

async function seedUserAndProfile() {
  const existingUser = await prisma.user.findUnique({
    where: { email: SEED_PROFILE_USER_EMAIL }
  });

  const user = existingUser
    ? await prisma.user.update({
        where: { email: SEED_PROFILE_USER_EMAIL },
        data: {
          email: SEED_PROFILE_USER_EMAIL
        }
      })
    : await prisma.user.create({
        data: {
          id: SEED_PROFILE_USER_ID,
          email: SEED_PROFILE_USER_EMAIL
        }
      });

  await prisma.preferenceProfile.updateMany({
    where: { userId: user.id },
    data: { isCurrent: false }
  });

  await prisma.preferenceProfile.upsert({
    where: { id: "profile-default-balanced" },
    update: {
      label: DEFAULT_PROFILE_INPUT.label,
      weightsJson: DEFAULT_PROFILE_INPUT.weights,
      constraintsJson: DEFAULT_PROFILE_INPUT.dealBreakers ?? null,
      isCurrent: true
    },
    create: {
      id: "profile-default-balanced",
      userId: user.id,
      label: DEFAULT_PROFILE_INPUT.label,
      weightsJson: DEFAULT_PROFILE_INPUT.weights,
      constraintsJson: DEFAULT_PROFILE_INPUT.dealBreakers ?? null,
      isCurrent: true
    }
  });
}

async function seedLocations() {
  await prisma.location.deleteMany({
    where: {
      slug: {
        notIn: LOCATIONS.map((entry) => entry.slug)
      }
    }
  });

  for (const entry of LOCATIONS) {
    const location = await prisma.location.upsert({
      where: { slug: entry.slug },
      update: {
        name: entry.name,
        state: entry.state,
        country: entry.country,
        population: entry.population,
        description: entry.description,
        latitude: entry.latitude,
        longitude: entry.longitude
      },
      create: {
        slug: entry.slug,
        name: entry.name,
        state: entry.state,
        country: entry.country,
        population: entry.population,
        description: entry.description,
        latitude: entry.latitude,
        longitude: entry.longitude
      }
    });

    await prisma.locationMetrics.upsert({
      where: { locationId: location.id },
      update: entry.metrics,
      create: {
        locationId: location.id,
        ...entry.metrics
      }
    });
  }
}

async function main() {
  validateLocations(LOCATIONS);
  await seedUserAndProfile();
  await seedLocations();
  console.log(`Seeded ${LOCATIONS.length} locations for ${SEED_PROFILE_USER_ID}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
