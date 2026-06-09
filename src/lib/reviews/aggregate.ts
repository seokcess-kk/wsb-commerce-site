export function aggregateRatings(ratings: number[]): { count: number; average: number } {
  if (ratings.length === 0) return { count: 0, average: 0 };
  const sum = ratings.reduce((a, b) => a + b, 0);
  return { count: ratings.length, average: Math.round((sum / ratings.length) * 10) / 10 };
}
