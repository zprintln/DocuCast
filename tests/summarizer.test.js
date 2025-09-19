// tests/summarizer.test.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { summarizePaperFallback } from '../src/summarizer.js';

describe('Summarizer', () => {
  describe('summarizePaperFallback', () => {
    it('should return valid summary structure', async () => {
      const paperData = {
        title: 'Test Paper Title',
        abstract: 'This is a test abstract about machine learning.',
        text: 'This is additional text content for the paper.'
      };

      const result = await summarizePaperFallback(paperData);

      assert(typeof result === 'object', 'Should return an object');
      assert(typeof result.summary === 'string', 'Should have a summary string');
      assert(Array.isArray(result.bullets), 'Should have bullets array');
      assert(result.bullets.length === 3, 'Should have exactly 3 bullets');
      assert(typeof result.importance === 'number', 'Should have importance number');
      assert(result.importance >= 0 && result.importance <= 10, 'Importance should be between 0-10');
    });

    it('should include paper title in summary', async () => {
      const paperData = {
        title: 'Unique Test Title 12345',
        abstract: 'Test abstract',
        text: 'Test text'
      };

      const result = await summarizePaperFallback(paperData);

      assert(result.summary.includes('Unique Test Title 12345'), 'Summary should include the paper title');
    });

    it('should handle missing fields gracefully', async () => {
      const paperData = {
        title: 'Test Title',
        abstract: '',
        text: ''
      };

      const result = await summarizePaperFallback(paperData);

      assert(typeof result.summary === 'string', 'Should still return a summary');
      assert(result.summary.length > 0, 'Summary should not be empty');
      assert(Array.isArray(result.bullets), 'Should still return bullets array');
    });

    it('should return consistent structure across calls', async () => {
      const paperData = {
        title: 'Test Paper',
        abstract: 'Test abstract',
        text: 'Test text'
      };

      const result1 = await summarizePaperFallback(paperData);
      const result2 = await summarizePaperFallback(paperData);

      // Check that structure is consistent
      assert(typeof result1.summary === typeof result2.summary, 'Summary type should be consistent');
      assert(Array.isArray(result1.bullets) === Array.isArray(result2.bullets), 'Bullets type should be consistent');
      assert(typeof result1.importance === typeof result2.importance, 'Importance type should be consistent');
    });
  });
});
