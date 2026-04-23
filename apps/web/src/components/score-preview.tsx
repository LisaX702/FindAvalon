import type { RecommendationResult } from "@relocateit/types";

type ScorePreviewProps = {
  result: RecommendationResult;
};

export function ScorePreview({ result }: ScorePreviewProps) {
  return (
    <article className="score-card">
      <div>
        <p className="eyebrow">Top match</p>
        <h3>{result.location.name}</h3>
        <p className="muted">
          {result.location.state}, {result.location.country}
        </p>
      </div>
      <div className="score-pill">{Math.round(result.overallScore * 100)}</div>
      <ul className="insight-list">
        {result.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </article>
  );
}
