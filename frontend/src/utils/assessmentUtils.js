/**
 * Evaluates whether a category has sufficient evidence to be considered assessed.
 *
 * Rules:
 * - Must have data and not explicitly set assessed: false.
 * - Must have a numeric score or numeric string.
 * - If score is 0, only considered unassessed if feedback explicitly declares lack of evidence / unassessed status.
 * - Genuine zeros (e.g. tested and evaluated as 0) remain assessed.
 */
export function isCategoryAssessed(data) {
  if (!data) return false;
  if (data.assessed === false) return false;
  if (data.score === null || data.score === undefined) return false;

  const rawScore = data.score;
  if (typeof rawScore === "string") {
    const trimmed = rawScore.trim().toLowerCase();
    if (trimmed === "" || trimmed === "n/a" || trimmed === "null" || trimmed === "not assessed") {
      return false;
    }
  }

  const numericScore = typeof rawScore === "number" ? rawScore : parseFloat(rawScore);
  if (isNaN(numericScore)) return false;

  // Handle zero scores accompanied by explicit lack-of-evidence notes
  // "Do not assume every zero means unassessed." -> only if feedback explicitly indicates lack of evidence
  if (numericScore === 0 && data.feedback) {
    const fb = data.feedback.toLowerCase();
    const insufficientEvidencePhrases = [
      "insufficient evidence",
      "not assessed",
      "not evaluated",
      "could not be evaluated",
      "no technical questions were asked",
      "no behavioral questions were asked",
      "no project discussion questions were asked",
      "no questions were asked to evaluate",
      "not enough evidence",
      "not enough information to assess",
      "unable to evaluate due to lack of",
    ];
    if (insufficientEvidencePhrases.some((phrase) => fb.includes(phrase))) {
      return false;
    }
  }

  return true;
}

/**
 * Returns score tier classification
 */
export function getScoreTier(score, isAssessed) {
  if (!isAssessed) {
    return { label: "Not Assessed", className: "tierUnassessed" };
  }
  if (score >= 8) return { label: "Strong", className: "tierHigh" };
  if (score >= 6) return { label: "Proficient", className: "tierMid" };
  return { label: "Developing", className: "tierLow" };
}
