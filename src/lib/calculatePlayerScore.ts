export default function calculatePlayerScore(
  gamesPlayed: number, guessScore: number, successRatio: number, speedScore: number, statSpan: number) {
  // Normalize guessScore (1-6) to a score between 0 and 1, where lower guessScore gives a higher normalized score
  const guessScoreNormalized = (6 - guessScore) / 5;

  // Normalize successRatio (0-100%) to a score between 0 and 1, where higher successRatio gives a higher normalized score
  const successRatioNormalized = successRatio / 100;

  // Normalize speedScore (inverse, as lower is better), assume a reasonable max speed score for normalization
  const maxSpeedScore = 300;
  const speedScoreNormalized = (maxSpeedScore - speedScore) / maxSpeedScore;
  
  // Weight factors (can be adjusted for tuning)
  const guessWeight = 0.70;
  const successWeight = 0.14;
  const speedWeight = 0.16;

  // Base score calculation with weighted components
  let baseScore = (guessScoreNormalized * guessWeight) +
                  (successRatioNormalized * successWeight) +
                  (speedScoreNormalized * speedWeight);

  // Games played adjustment
  // Early games boost, but diminishes with more games played
  // Ensure players with fewer games have a harder time reaching the top
  const maxGamesImpact = statSpan === -1 ? 120 : 3; // Max impact cap
  const logScale = Math.min(Math.log10(gamesPlayed + 1) / 2, Math.log10(maxGamesImpact) / 2);

  // Inverse proportional factor to penalize players with low games
  const inverseGamePenalty = Math.min(1, gamesPlayed / (statSpan === -1 ? 10 : 3));  // Reduces score for low game count, normalized up to 10 games

  // Final score, influenced by both base score and game factor with penalty
  let finalScore = baseScore * logScale * inverseGamePenalty;

  return Math.round(finalScore * 1000);  // Scale for better readability
}