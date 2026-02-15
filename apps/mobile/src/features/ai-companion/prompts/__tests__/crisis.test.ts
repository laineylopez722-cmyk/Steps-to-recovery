/**
 * Crisis Detection Tests
 *
 * These test the canonical crisis detection module that protects users
 * during their most vulnerable moments. Every keyword path and severity
 * level must work correctly — someone's safety depends on it.
 */

import {
  detectCrisis,
  toCrisisSignal,
  buildCrisisResponse,
  CRISIS_KEYWORDS,
  CRISIS_RESOURCES,
} from '../crisis';

describe('detectCrisis', () => {
  // ── High Severity ──────────────────────────────────────────────

  describe('high severity detection', () => {
    const highKeywords = CRISIS_KEYWORDS.high;

    it.each(highKeywords)('detects high-severity keyword: "%s"', (keyword) => {
      const result = detectCrisis(`I feel like I want to ${keyword}`);
      expect(result.detected).toBe(true);
      expect(result.severity).toBe('high');
      expect(result.suggestedAction).toBe('emergency');
      expect(result.matchedKeywords).toContain(keyword);
    });

    it('detects "kill myself" in context', () => {
      const result = detectCrisis("I can't take this anymore, I want to kill myself");
      expect(result.detected).toBe(true);
      expect(result.severity).toBe('high');
      expect(result.suggestedAction).toBe('emergency');
    });

    it('detects "suicide" as standalone word', () => {
      const result = detectCrisis('I keep thinking about suicide');
      expect(result.detected).toBe(true);
      expect(result.severity).toBe('high');
    });

    it('detects "better off dead"', () => {
      const result = detectCrisis("Everyone would be better off dead if I wasn't here");
      expect(result.detected).toBe(true);
      expect(result.severity).toBe('high');
    });
  });

  // ── Medium Severity ────────────────────────────────────────────

  describe('medium severity detection', () => {
    const mediumKeywords = CRISIS_KEYWORDS.medium;

    it.each(mediumKeywords)('detects medium-severity keyword: "%s"', (keyword) => {
      const result = detectCrisis(`I need to tell you that I ${keyword}`);
      expect(result.detected).toBe(true);
      expect(result.severity).toBe('medium');
      expect(result.suggestedAction).toBe('intervene');
      expect(result.matchedKeywords).toContain(keyword);
    });

    it('detects relapse disclosure', () => {
      const result = detectCrisis('I relapsed last night, I used again');
      expect(result.detected).toBe(true);
      expect(result.severity).toBe('medium');
    });

    it('detects "about to use"', () => {
      const result = detectCrisis("I'm about to use, I can't fight it");
      expect(result.detected).toBe(true);
      expect(result.severity).toBe('medium');
    });
  });

  // ── Low Severity ───────────────────────────────────────────────

  describe('low severity detection', () => {
    const lowKeywords = CRISIS_KEYWORDS.low;

    it.each(lowKeywords)('detects low-severity keyword: "%s"', (keyword) => {
      const result = detectCrisis(`Lately I've been ${keyword}`);
      expect(result.detected).toBe(true);
      expect(result.severity).toBe('low');
      expect(result.suggestedAction).toBe('monitor');
      expect(result.matchedKeywords).toContain(keyword);
    });

    it('detects urge language', () => {
      const result = detectCrisis("The urges are bad today, I'm craving hard");
      expect(result.detected).toBe(true);
      expect(result.severity).toBe('low');
    });
  });

  // ── No Crisis ──────────────────────────────────────────────────

  describe('no crisis detected', () => {
    it('returns not detected for normal conversation', () => {
      const result = detectCrisis('Had a good day at my meeting today');
      expect(result.detected).toBe(false);
      expect(result.severity).toBe('low');
      expect(result.matchedKeywords).toEqual([]);
      expect(result.suggestedAction).toBe('monitor');
    });

    it('returns not detected for empty string', () => {
      const result = detectCrisis('');
      expect(result.detected).toBe(false);
    });

    it('returns not detected for positive recovery talk', () => {
      const result = detectCrisis("I'm grateful for 30 days clean, feeling strong");
      expect(result.detected).toBe(false);
    });

    it('returns not detected for step work discussion', () => {
      const result = detectCrisis('Working on step 4 with my sponsor this week');
      expect(result.detected).toBe(false);
    });
  });

  // ── Case Insensitivity ─────────────────────────────────────────

  describe('case insensitivity', () => {
    it('detects UPPERCASE input', () => {
      const result = detectCrisis('I WANT TO KILL MYSELF');
      expect(result.detected).toBe(true);
      expect(result.severity).toBe('high');
    });

    it('detects Mixed Case input', () => {
      const result = detectCrisis('I Want To End My Life');
      expect(result.detected).toBe(true);
      expect(result.severity).toBe('high');
    });
  });

  // ── Severity Priority ─────────────────────────────────────────

  describe('severity priority', () => {
    it('returns highest severity when multiple levels match', () => {
      // "suicide" = high, "relapsed" = medium, "struggling" = low-ish
      const result = detectCrisis("I relapsed and I'm thinking about suicide");
      expect(result.detected).toBe(true);
      expect(result.severity).toBe('high');
      expect(result.suggestedAction).toBe('emergency');
    });

    it('returns medium over low when both match', () => {
      // "relapsed" = medium, "really struggling" = low
      const result = detectCrisis("I relapsed, I'm really struggling");
      expect(result.detected).toBe(true);
      // High gets checked first, then medium
      expect(['medium', 'high']).toContain(result.severity);
    });
  });

  // ── Keyword Coverage ──────────────────────────────────────────

  describe('keyword coverage sanity', () => {
    it('has at least 15 high-severity keywords', () => {
      expect(CRISIS_KEYWORDS.high.length).toBeGreaterThanOrEqual(15);
    });

    it('has at least 15 medium-severity keywords', () => {
      expect(CRISIS_KEYWORDS.medium.length).toBeGreaterThanOrEqual(15);
    });

    it('has at least 10 low-severity keywords', () => {
      expect(CRISIS_KEYWORDS.low.length).toBeGreaterThanOrEqual(10);
    });

    it('all keywords are lowercase', () => {
      const allKeywords = [
        ...CRISIS_KEYWORDS.high,
        ...CRISIS_KEYWORDS.medium,
        ...CRISIS_KEYWORDS.low,
      ];
      for (const kw of allKeywords) {
        expect(kw).toBe(kw.toLowerCase());
      }
    });

    it('has no duplicate keywords across severity levels', () => {
      const all = [
        ...CRISIS_KEYWORDS.high,
        ...CRISIS_KEYWORDS.medium,
        ...CRISIS_KEYWORDS.low,
      ];
      const unique = new Set(all);
      expect(unique.size).toBe(all.length);
    });
  });
});

// ── toCrisisSignal ─────────────────────────────────────────────

describe('toCrisisSignal', () => {
  it('converts detected result to CrisisSignal', () => {
    const detection = detectCrisis('I want to kill myself');
    const signal = toCrisisSignal(detection);

    expect(signal.detected).toBe(true);
    expect(signal.severity).toBe('high');
    expect(signal.keywords).toContain('kill myself');
    expect(signal.suggestedAction).toBe('emergency');
  });

  it('converts non-detected result to CrisisSignal', () => {
    const detection = detectCrisis('Having a good day');
    const signal = toCrisisSignal(detection);

    expect(signal.detected).toBe(false);
    expect(signal.keywords).toEqual([]);
  });
});

// ── buildCrisisResponse ────────────────────────────────────────

describe('buildCrisisResponse', () => {
  it('fills in all template placeholders', () => {
    const response = buildCrisisResponse({
      acknowledgment: "That sounds really painful, and I'm glad you told me.",
      immediateAction: "Let's take three slow breaths together.",
      sponsorName: 'Mike',
      additionalResources: 'You can also call 988 anytime.',
    });

    expect(response).toContain("That sounds really painful, and I'm glad you told me.");
    expect(response).toContain("Let's take three slow breaths together.");
    expect(response).toContain('Mike');
    expect(response).toContain('You can also call 988 anytime.');
    expect(response).not.toContain('{acknowledgment}');
    expect(response).not.toContain('{immediate_action}');
    expect(response).not.toContain('{sponsor_name}');
    expect(response).not.toContain('{additional_resources}');
  });

  it('uses default sponsor name when not provided', () => {
    const response = buildCrisisResponse({
      acknowledgment: 'I hear you.',
      immediateAction: "Let's breathe.",
    });

    expect(response).toContain('Your sponsor');
    expect(response).not.toContain('{sponsor_name}');
  });

  it('handles empty additional resources', () => {
    const response = buildCrisisResponse({
      acknowledgment: 'I hear you.',
      immediateAction: "Let's breathe.",
    });

    expect(response).not.toContain('{additional_resources}');
  });
});

// ── Crisis Resources ───────────────────────────────────────────

describe('CRISIS_RESOURCES', () => {
  it('includes suicide prevention lifeline', () => {
    expect(CRISIS_RESOURCES.suicide).toBeDefined();
    expect(CRISIS_RESOURCES.suicide.phone).toBe('988');
  });

  it('includes SAMHSA helpline', () => {
    expect(CRISIS_RESOURCES.samhsa).toBeDefined();
    expect(CRISIS_RESOURCES.samhsa.phone).toBeTruthy();
  });

  it('includes AA resources', () => {
    expect(CRISIS_RESOURCES.aa).toBeDefined();
    expect(CRISIS_RESOURCES.aa.url).toBeTruthy();
  });

  it('includes NA resources', () => {
    expect(CRISIS_RESOURCES.na).toBeDefined();
    expect(CRISIS_RESOURCES.na.phone).toBeTruthy();
  });

  it('all resources have names and descriptions', () => {
    for (const [_key, resource] of Object.entries(CRISIS_RESOURCES)) {
      expect(resource.name).toBeTruthy();
      expect(resource.description).toBeTruthy();
    }
  });
});
