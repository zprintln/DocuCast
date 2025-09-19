import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const client = new OpenAI({ 
  apiKey: process.env.EMBEDDING_API_KEY 
});

export async function embedText(text) {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }
    
    // Truncate text if too long (OpenAI has limits)
    const maxLength = 8000; // Leave some buffer
    const truncatedText = text.length > maxLength 
      ? text.substring(0, maxLength) + '...'
      : text;
    
    const response = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: truncatedText,
    });
    
    return response.data[0].embedding;
    
  } catch (error) {
    console.error('Embedding generation error:', error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

export async function embedMultipleTexts(texts) {
  try {
    const embeddings = [];
    
    for (const text of texts) {
      const embedding = await embedText(text);
      embeddings.push(embedding);
    }
    
    return embeddings;
    
  } catch (error) {
    console.error('Multiple embeddings error:', error);
    throw new Error(`Failed to generate multiple embeddings: ${error.message}`);
  }
}

export function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function findSimilarPapers(queryEmbedding, paperEmbeddings, threshold = 0.7) {
  const similarities = paperEmbeddings.map((paper, index) => ({
    index,
    similarity: cosineSimilarity(queryEmbedding, paper.embedding),
    paperId: paper.paperId
  }));
  
  return similarities
    .filter(item => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);
}

// Fallback function for demo when OpenAI is not available
export async function embedTextFallback(text) {
  console.log('Using fallback embedding for demo');
  
  // Generate a simple hash-based "embedding" for demo purposes
  const hash = simpleHash(text);
  const embedding = [];
  
  // Create a 1536-dimensional vector (same as OpenAI's embedding-3-small)
  for (let i = 0; i < 1536; i++) {
    const seed = hash + i;
    const random = Math.sin(seed) * 10000;
    embedding.push(random - Math.floor(random));
  }
  
  return embedding;
}

function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
