// src/redisClient.js
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export async function savePaper(paperId, metadata, vector) {
  try {
    const key = `paper:${paperId}`;
    const vectorKey = `paper:${paperId}:vec`;
    
    // Save JSON metadata
    await redis.hset(key, {
      title: metadata.title || '',
      authors: JSON.stringify(metadata.authors || []),
      url: metadata.url || '',
      abstract: metadata.abstract || '',
      audioPath: metadata.audioPath || '',
      publishedDate: metadata.publishedDate || '',
      citations: metadata.citations || 0,
      venue: metadata.venue || '',
      summary: metadata.summary || '',
      bullets: JSON.stringify(metadata.bullets || []),
      importance: metadata.importance || 0,
      createdAt: new Date().toISOString()
    });
    
    // Save vector as JSON string
    await redis.set(vectorKey, JSON.stringify(vector));
    
    // Add to search index
    await redis.sadd('papers:index', paperId);
    
    console.log(`Saved paper ${paperId} to Redis`);
    return true;
    
  } catch (error) {
    console.error('Redis save error:', error);
    throw new Error(`Failed to save paper to Redis: ${error.message}`);
  }
}

export async function getPaper(paperId) {
  try {
    const key = `paper:${paperId}`;
    const vectorKey = `paper:${paperId}:vec`;
    
    const metadata = await redis.hgetall(key);
    const vectorStr = await redis.get(vectorKey);
    
    if (!metadata || Object.keys(metadata).length === 0) {
      return null;
    }
    
    return {
      ...metadata,
      authors: JSON.parse(metadata.authors || '[]'),
      bullets: JSON.parse(metadata.bullets || '[]'),
      vector: vectorStr ? JSON.parse(vectorStr) : null
    };
    
  } catch (error) {
    console.error('Redis get error:', error);
    throw new Error(`Failed to get paper from Redis: ${error.message}`);
  }
}

export async function getAllPapers() {
  try {
    const paperIds = await redis.smembers('papers:index');
    const papers = [];
    
    for (const paperId of paperIds) {
      const paper = await getPaper(paperId);
      if (paper) {
        papers.push(paper);
      }
    }
    
    return papers;
    
  } catch (error) {
    console.error('Redis get all papers error:', error);
    throw new Error(`Failed to get all papers from Redis: ${error.message}`);
  }
}

export async function searchPapers(query, limit = 10) {
  try {
    // Simple text search in titles and abstracts
    const papers = await getAllPapers();
    const queryLower = query.toLowerCase();
    
    const results = papers
      .filter(paper => 
        paper.title.toLowerCase().includes(queryLower) ||
        paper.abstract.toLowerCase().includes(queryLower) ||
        paper.summary.toLowerCase().includes(queryLower)
      )
      .sort((a, b) => (b.importance || 0) - (a.importance || 0))
      .slice(0, limit);
    
    return results;
    
  } catch (error) {
    console.error('Redis search error:', error);
    throw new Error(`Failed to search papers in Redis: ${error.message}`);
  }
}

export async function deletePaper(paperId) {
  try {
    const key = `paper:${paperId}`;
    const vectorKey = `paper:${paperId}:vec`;
    
    await redis.del(key);
    await redis.del(vectorKey);
    await redis.srem('papers:index', paperId);
    
    console.log(`Deleted paper ${paperId} from Redis`);
    return true;
    
  } catch (error) {
    console.error('Redis delete error:', error);
    throw new Error(`Failed to delete paper from Redis: ${error.message}`);
  }
}

export async function clearAllPapers() {
  try {
    const paperIds = await redis.smembers('papers:index');
    
    for (const paperId of paperIds) {
      await deletePaper(paperId);
    }
    
    console.log('Cleared all papers from Redis');
    return true;
    
  } catch (error) {
    console.error('Redis clear error:', error);
    throw new Error(`Failed to clear all papers from Redis: ${error.message}`);
  }
}

export async function getPaperStats() {
  try {
    const totalPapers = await redis.scard('papers:index');
    const papers = await getAllPapers();
    
    const stats = {
      totalPapers,
      totalAudioFiles: papers.filter(p => p.audioPath).length,
      averageImportance: papers.length > 0 
        ? papers.reduce((sum, p) => sum + (p.importance || 0), 0) / papers.length 
        : 0,
      topVenues: getTopVenues(papers),
      recentPapers: papers
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
    };
    
    return stats;
    
  } catch (error) {
    console.error('Redis stats error:', error);
    throw new Error(`Failed to get paper stats from Redis: ${error.message}`);
  }
}

function getTopVenues(papers) {
  const venueCount = {};
  
  papers.forEach(paper => {
    const venue = paper.venue || 'Unknown';
    venueCount[venue] = (venueCount[venue] || 0) + 1;
  });
  
  return Object.entries(venueCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([venue, count]) => ({ venue, count }));
}

// Fallback functions for demo when Redis is not available
export async function savePaperFallback(paperId, metadata, vector) {
  console.log(`Fallback: Would save paper ${paperId} to Redis`);
  return true;
}

export async function getPaperFallback(paperId) {
  console.log(`Fallback: Would get paper ${paperId} from Redis`);
  return null;
}

export async function getAllPapersFallback() {
  console.log('Fallback: Would get all papers from Redis');
  return [];
}
