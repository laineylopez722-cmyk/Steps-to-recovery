import {
  UX_AUDIT_WEIGHTS,
  calculateWeightedScore,
  createNeutralScorecard,
  getScoreBand,
  validateUxAuditWeights,
} from '../rubric';

describe('review/rubric', () => {
  it('validates that default weights sum to 100', () => {
    const validation = validateUxAuditWeights();
    expect(validation.isValid).toBe(true);
    expect(validation.total).toBe(100);
    expect(validation.errors).toHaveLength(0);
  });

  it('calculates deterministic weighted score for a custom scorecard', () => {
    const score = calculateWeightedScore({
      visualPolish: 4,
      consistency: 3,
      hierarchy: 5,
      accessibility: 4,
      recoverySafety: 5,
      motionPerformance: 3,
    });

    expect(score).toBe(4);
  });

  it('builds a neutral scorecard in valid bounds', () => {
    const neutral = createNeutralScorecard();
    const score = calculateWeightedScore(neutral, UX_AUDIT_WEIGHTS);
    expect(score).toBe(3);
  });

  it('throws if any category score is out of range', () => {
    expect(() =>
      calculateWeightedScore({
        visualPolish: 6,
        consistency: 3,
        hierarchy: 3,
        accessibility: 3,
        recoverySafety: 3,
        motionPerformance: 3,
      }),
    ).toThrow('must be between');
  });

  it('returns score bands with correct threshold behavior', () => {
    expect(getScoreBand(2.49)).toBe('at-risk');
    expect(getScoreBand(2.5)).toBe('needs-work');
    expect(getScoreBand(3.5)).toBe('strong');
    expect(getScoreBand(4.25)).toBe('exceptional');
  });
});
