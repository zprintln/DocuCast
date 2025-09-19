// tests/apify.test.js
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { fetchScholarResultsFallback } from '../src/apifyClient.js';

describe('Apify Client', () => {
  describe('fetchScholarResultsFallback', () => {
    it('should return sample results for demo', async () => {
      const results = await fetchScholarResultsFallback('test query', 3);
      
      assert(Array.isArray(results), 'Should return an array');
      assert(results.length === 3, 'Should return exactly 3 results');
      
      const firstResult = results[0];
      assert(firstResult.id, 'Should have an id');
      assert(firstResult.title, 'Should have a title');
      assert(firstResult.authors, 'Should have authors');
      assert(Array.isArray(firstResult.authors), 'Authors should be an array');
      assert(firstResult.abstract, 'Should have an abstract');
      assert(firstResult.url, 'Should have a URL');
    });

    it('should respect maxResults parameter', async () => {
      const results1 = await fetchScholarResultsFallback('test', 1);
      const results5 = await fetchScholarResultsFallback('test', 5);
      
      assert(results1.length === 1, 'Should return 1 result when maxResults=1');
      assert(results5.length <= 5, 'Should return at most 5 results when maxResults=5');
      assert(results5.length >= 1, 'Should return at least 1 result');
    });

    it('should generate unique IDs', async () => {
      const results = await fetchScholarResultsFallback('test', 3);
      const ids = results.map(r => r.id);
      const uniqueIds = new Set(ids);
      
      assert(uniqueIds.size === ids.length, 'All IDs should be unique');
    });
  });
});
