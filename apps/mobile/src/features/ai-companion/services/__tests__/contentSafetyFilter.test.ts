/**
 * Content Safety Filter Tests
 *
 * Validates that AI responses are properly filtered before reaching
 * vulnerable users. A content safety failure could actively harm
 * someone in recovery.
 */

import { filterAIResponse } from '../contentSafetyFilter';

describe('filterAIResponse', () => {
  // ── Safe Content ───────────────────────────────────────────────

  describe('safe content passes through', () => {
    it('allows normal supportive responses', () => {
      const result = filterAIResponse(
        "It sounds like you're having a tough day. That's completely understandable.",
      );
      expect(result.safe).toBe(true);
      expect(result.blocked).toBe(false);
      expect(result.warnings).toEqual([]);
      expect(result.filteredContent).toContain("It sounds like you're having a tough day");
    });

    it('allows recovery-positive language', () => {
      const result = filterAIResponse(
        'Great job on your 30 days! Each day is an achievement worth celebrating.',
      );
      expect(result.safe).toBe(true);
      expect(result.blocked).toBe(false);
    });

    it('allows step work guidance', () => {
      const result = filterAIResponse(
        "Step 4 asks us to make a searching and fearless moral inventory. Let's take that one piece at a time.",
      );
      expect(result.safe).toBe(true);
    });

    it('allows coping strategy suggestions', () => {
      const result = filterAIResponse(
        'When cravings hit, try the HALT check: are you Hungry, Angry, Lonely, or Tired?',
      );
      expect(result.safe).toBe(true);
    });
  });

  // ── Substance Suggestion Blocking ──────────────────────────────

  describe('blocks substance suggestions', () => {
    it('blocks "you should drink" suggestions', () => {
      const result = filterAIResponse('Maybe you should try to drink just a little.');
      expect(result.blocked).toBe(true);
      expect(result.blockReason).toBe('substance_suggestion');
      expect(result.filteredContent).not.toContain('drink');
      expect(result.filteredContent).toContain('recovery');
    });

    it('blocks "consider using" suggestions', () => {
      const result = filterAIResponse('You could consider using something to relax.');
      expect(result.blocked).toBe(true);
      expect(result.blockReason).toBe('substance_suggestion');
    });

    it('replaces blocked content with recovery-supportive message', () => {
      const result = filterAIResponse('You should try to smoke to calm down.');
      expect(result.blocked).toBe(true);
      expect(result.filteredContent).toContain('coping strategies');
    });
  });

  // ── Shame Blocking ────────────────────────────────────────────

  describe('blocks shaming language', () => {
    it('blocks "you are weak"', () => {
      const result = filterAIResponse("You're weak for giving in to temptation.");
      expect(result.blocked).toBe(true);
      expect(result.blockReason).toBe('shame');
      expect(result.filteredContent).toContain('courage');
    });

    it('blocks "you are worthless"', () => {
      const result = filterAIResponse("You're worthless if you can't stay clean.");
      expect(result.blocked).toBe(true);
      expect(result.blockReason).toBe('shame');
    });

    it('blocks "you are a failure"', () => {
      const result = filterAIResponse("You're a failure for relapsing again.");
      expect(result.blocked).toBe(true);
      expect(result.blockReason).toBe('shame');
    });
  });

  // ── Self-Harm Blocking ────────────────────────────────────────

  describe('blocks self-harm content', () => {
    it('blocks self-harm instructions', () => {
      const result = filterAIResponse('Here are ways to harm yourself...');
      expect(result.blocked).toBe(true);
      expect(result.blockReason).toBe('self_harm');
      expect(result.filteredContent).toContain('988');
    });

    it('blocks method descriptions', () => {
      const result = filterAIResponse('Methods to hurt yourself include...');
      expect(result.blocked).toBe(true);
      expect(result.blockReason).toBe('self_harm');
    });

    it('replacement includes crisis line', () => {
      const result = filterAIResponse('How to kill yourself is...');
      expect(result.blocked).toBe(true);
      expect(result.filteredContent).toContain('988');
      expect(result.filteredContent).toContain('Crisis Lifeline');
    });
  });

  // ── Medical Advice Warning ────────────────────────────────────

  describe('warns on medical advice', () => {
    it('warns about medication changes', () => {
      const result = filterAIResponse(
        'You should stop your medication and try natural remedies.',
      );
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('medical advice');
    });

    it('warns about dosage suggestions', () => {
      const result = filterAIResponse('You need to increase your dose of meds.');
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  // ── Isolation Replacement ─────────────────────────────────────

  describe('replaces isolation encouragement', () => {
    it('replaces "you don\'t need anyone"', () => {
      const result = filterAIResponse("You don't need anyone to get through this.");
      expect(result.filteredContent).toContain('support network');
      expect(result.filteredContent).not.toContain("don't need anyone");
    });

    it('replaces "you don\'t need meetings"', () => {
      const result = filterAIResponse("You don't need meetings to stay sober.");
      expect(result.filteredContent).toContain('support network');
    });

    it('replaces "you don\'t need a sponsor"', () => {
      const result = filterAIResponse("You don't need a sponsor to work the steps.");
      expect(result.filteredContent).toContain('support network');
    });
  });

  // ── Minimizing Warning ────────────────────────────────────────

  describe('warns on minimizing language', () => {
    it('warns about "it\'s not that bad"', () => {
      const result = filterAIResponse("Come on, it's not that bad. You'll be fine.");
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('minimizing');
    });

    it('warns about "just get over it"', () => {
      const result = filterAIResponse('Just get over it and move on with your life.');
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  // ── Safety Levels ─────────────────────────────────────────────

  describe('safety levels', () => {
    describe('strict mode', () => {
      it('filters warned content in strict mode', () => {
        const result = filterAIResponse(
          "It's not that bad, you'll get through it.",
          'strict',
        );
        expect(result.filteredContent).toContain('[content filtered]');
      });

      it('still blocks blocked content', () => {
        const result = filterAIResponse(
          "You're worthless.",
          'strict',
        );
        expect(result.blocked).toBe(true);
      });
    });

    describe('moderate mode (default)', () => {
      it('blocks dangerous content', () => {
        const result = filterAIResponse("You're pathetic for relapsing.", 'moderate');
        expect(result.blocked).toBe(true);
      });

      it('warns but does not filter moderate issues', () => {
        const result = filterAIResponse(
          "It's not that bad, just keep going.",
          'moderate',
        );
        expect(result.warnings.length).toBeGreaterThan(0);
        expect(result.filteredContent).not.toContain('[content filtered]');
      });
    });

    describe('relaxed mode', () => {
      it('does NOT block substance suggestions in relaxed mode', () => {
        const result = filterAIResponse(
          'You should try to drink moderately.',
          'relaxed',
        );
        expect(result.blocked).toBe(false);
      });

      it('does NOT replace isolation content in relaxed mode', () => {
        const result = filterAIResponse(
          "You don't need anyone to recover.",
          'relaxed',
        );
        expect(result.filteredContent).toContain("don't need anyone");
      });
    });
  });

  // ── Edge Cases ────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles empty string', () => {
      const result = filterAIResponse('');
      expect(result.safe).toBe(true);
      expect(result.blocked).toBe(false);
    });

    it('handles very long content', () => {
      const longContent = 'Recovery is a journey. '.repeat(500);
      const result = filterAIResponse(longContent);
      expect(result.safe).toBe(true);
    });

    it('defaults to moderate safety level', () => {
      const result = filterAIResponse("You're weak for giving up.");
      expect(result.blocked).toBe(true); // blocked in moderate
    });
  });
});
