// tests/orchestrator.test.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { fetchScholarResultsFallback } from '../src/apifyClient.js';
import { summarizePaperFallback } from '../src/summarizer.js';

describe('Orchestrator Components', () => {
  describe('Integration Flow', () => {
    it('should handle basic search flow with fallbacks', async () => {
      // Test the individual components that make up the orchestrator
      const query = 'test research topic';
      
      // Step 1: Fetch scholar results
      const scholarResults = await fetchScholarResultsFallback(query, 2);
      assert(Array.isArray(scholarResults), 'Should return array of results');
      assert(scholarResults.length <= 2, 'Should respect maxResults');
      
      // Step 2: Process first paper
      if (scholarResults.length > 0) {
        const paper = scholarResults[0];
        const summary = await summarizePaperFallback({
          title: paper.title,
          abstract: paper.abstract,
          text: paper.abstract
        });
        
        assert(typeof summary === 'object', 'Should return summary object');
        assert(typeof summary.summary === 'string', 'Should have summary text');
        assert(Array.isArray(summary.bullets), 'Should have bullets array');
        assert(typeof summary.importance === 'number', 'Should have importance number');
      }
    });

    it('should handle empty query gracefully', async () => {
      const results = await fetchScholarResultsFallback('', 1);
      assert(Array.isArray(results), 'Should return array even for empty query');
    });

    it('should respect maxResults parameter in fallback', async () => {
      const results1 = await fetchScholarResultsFallback('test', 1);
      const results3 = await fetchScholarResultsFallback('test', 3);
      
      assert(results1.length <= 1, 'Should respect maxResults=1');
      assert(results3.length <= 3, 'Should respect maxResults=3');
    });

    it('should generate valid summaries for different paper types', async () => {
      const testPapers = [
        { title: 'AI in Healthcare', abstract: 'This paper discusses AI applications in healthcare.' },
        { title: 'Machine Learning', abstract: 'A comprehensive study of machine learning techniques.' },
        { title: 'Deep Learning', abstract: 'Deep learning approaches for various problems.' }
      ];

      for (const paper of testPapers) {
        const summary = await summarizePaperFallback(paper);
        
        assert(typeof summary.summary === 'string', 'Should have summary text');
        assert(summary.summary.length > 0, 'Summary should not be empty');
        assert(Array.isArray(summary.bullets), 'Should have bullets array');
        assert(summary.bullets.length === 3, 'Should have exactly 3 bullets');
        assert(typeof summary.importance === 'number', 'Should have importance number');
        assert(summary.importance >= 0 && summary.importance <= 10, 'Importance should be 0-10');
      }
    });
  });
});
