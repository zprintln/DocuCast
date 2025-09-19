// src/orchestrator.js
import { securityValidateQuery } from './validator.js';
import { fetchScholarResults, fetchScholarResultsFallback } from './apifyClient.js';
import { fetchPdfText, extractRelevantSections, fetchPdfTextFallback } from './pdfParser.js';
import { summarizePaper, summarizePaperFallback } from './summarizer.js';
import { embedText, embedTextFallback } from './embeddings.js';
import { textToSpeech, textToSpeechFallback, generatePodcastAudio } from './tts.js';
import { savePaper, savePaperFallback } from './redisClient.js';
import { v4 as uuidv4 } from 'uuid';

export async function runSearch(query, options = {}) {
  const {
    maxResults = 5,
    podcastMode = false,
    useFallbacks = true
  } = options;
  
  try {
    console.log(`Starting search for: "${query}"`);
    
    // Step 1: Security validation
    console.log('Step 1: Security validation');
    const validation = await securityValidateQuery(query);
    if (!validation.ok) {
      throw new Error(`Security validation failed: ${validation.reason}`);
    }
    
    // Step 2: Fetch scholar results
    console.log('Step 2: Fetching scholar results');
    let scholarResults;
    try {
      scholarResults = await fetchScholarResults(query, maxResults);
    } catch (error) {
      if (useFallbacks) {
        console.log('Using fallback scholar results');
        scholarResults = await fetchScholarResultsFallback(query, maxResults);
      } else {
        throw error;
      }
    }
    
    if (!scholarResults || scholarResults.length === 0) {
      throw new Error('No scholar results found');
    }
    
    console.log(`Found ${scholarResults.length} papers`);
    
    // Step 3: Process each paper
    const processedPapers = [];
    
    for (let i = 0; i < scholarResults.length; i++) {
      const paper = scholarResults[i];
      console.log(`Processing paper ${i + 1}/${scholarResults.length}: ${paper.title}`);
      
      try {
        const processedPaper = await processPaper(paper, query, useFallbacks);
        processedPapers.push(processedPaper);
      } catch (error) {
        console.error(`Error processing paper "${paper.title}":`, error);
        // Continue with other papers
        continue;
      }
    }
    
    if (processedPapers.length === 0) {
      throw new Error('No papers could be processed successfully');
    }
    
    // Step 4: Generate podcast if requested
    let podcastData = null;
    if (podcastMode) {
      console.log('Generating podcast');
      try {
        podcastData = await generatePodcastAudio(processedPapers, query);
      } catch (error) {
        console.error('Podcast generation failed:', error);
        // Continue without podcast
      }
    }
    
    // Step 5: Return results
    const results = {
      query,
      totalPapers: processedPapers.length,
      papers: processedPapers,
      podcast: podcastData,
      searchTime: new Date().toISOString(),
      validation
    };
    
    console.log(`Search completed successfully. Processed ${processedPapers.length} papers.`);
    return results;
    
  } catch (error) {
    console.error('Search orchestration error:', error);
    throw new Error(`Search failed: ${error.message}`);
  }
}

async function processPaper(paper, query, useFallbacks) {
  const paperId = paper.id || uuidv4();
  
  try {
    // Step 1: Extract text content
    let textContent = paper.abstract || '';
    
    if (paper.pdfUrl) {
      try {
        console.log(`  Fetching PDF: ${paper.pdfUrl}`);
        const pdfData = await fetchPdfText(paper.pdfUrl);
        const relevantSections = await extractRelevantSections(pdfData);
        textContent = relevantSections || pdfData.text || paper.abstract;
      } catch (error) {
        console.log(`  PDF fetch failed, using abstract: ${error.message}`);
        if (useFallbacks) {
          const fallbackPdfData = await fetchPdfTextFallback(paper.pdfUrl);
          textContent = fallbackPdfData.text || paper.abstract;
        }
      }
    }
    
    // Step 2: Generate summary
    console.log(`  Generating summary`);
    let summaryData;
    try {
      summaryData = await summarizePaper({
        title: paper.title,
        abstract: paper.abstract,
        text: textContent
      });
    } catch (error) {
      console.log(`  Summary generation failed, using fallback: ${error.message}`);
      if (useFallbacks) {
        summaryData = await summarizePaperFallback({
          title: paper.title,
          abstract: paper.abstract,
          text: textContent
        });
      } else {
        throw error;
      }
    }
    
    // Step 3: Generate embedding
    console.log(`  Generating embedding`);
    let embedding;
    try {
      const textForEmbedding = `${summaryData.summary} ${summaryData.bullets.join(' ')}`;
      embedding = await embedText(textForEmbedding);
    } catch (error) {
      console.log(`  Embedding generation failed, using fallback: ${error.message}`);
      if (useFallbacks) {
        const textForEmbedding = `${summaryData.summary} ${summaryData.bullets.join(' ')}`;
        embedding = await embedTextFallback(textForEmbedding);
      } else {
        throw error;
      }
    }
    
    // Step 4: Generate audio
    console.log(`  Generating audio`);
    const audioFileName = `${paperId}.mp3`;
    let audioPath;
    try {
      audioPath = await textToSpeech(summaryData.summary, audioFileName);
    } catch (error) {
      console.log(`  Audio generation failed, using fallback: ${error.message}`);
      if (useFallbacks) {
        audioPath = await textToSpeechFallback(summaryData.summary, audioFileName);
      } else {
        throw error;
      }
    }
    
    // Step 5: Save to Redis
    console.log(`  Saving to Redis`);
    const paperMetadata = {
      ...paper,
      summary: summaryData.summary,
      bullets: summaryData.bullets,
      importance: summaryData.importance,
      audioPath: audioPath,
      processedAt: new Date().toISOString()
    };
    
    try {
      await savePaper(paperId, paperMetadata, embedding);
    } catch (error) {
      console.log(`  Redis save failed, using fallback: ${error.message}`);
      if (useFallbacks) {
        await savePaperFallback(paperId, paperMetadata, embedding);
      } else {
        throw error;
      }
    }
    
    // Step 6: Return processed paper
    return {
      id: paperId,
      title: paper.title,
      authors: paper.authors,
      abstract: paper.abstract,
      url: paper.url,
      pdfUrl: paper.pdfUrl,
      publishedDate: paper.publishedDate,
      citations: paper.citations,
      venue: paper.venue,
      summary: summaryData.summary,
      bullets: summaryData.bullets,
      importance: summaryData.importance,
      audioUrl: `/audio/${audioFileName}`,
      audioPath: audioPath,
      processedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`Failed to process paper "${paper.title}":`, error);
    throw error;
  }
}

export async function getSearchHistory() {
  // This would typically query Redis for recent searches
  // For now, return a mock response
  return {
    searches: [
      {
        query: 'brain tumor detection AI',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        paperCount: 3
      },
      {
        query: 'machine learning healthcare',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        paperCount: 5
      }
    ]
  };
}

export async function getPaperById(paperId) {
  // This would query Redis for the specific paper
  // For now, return a mock response
  return {
    id: paperId,
    title: 'Sample Paper',
    authors: ['Dr. Jane Smith'],
    summary: 'This is a sample paper summary.',
    bullets: ['Method: Deep learning', 'Novelty: New approach', 'Result: 95% accuracy'],
    importance: 8,
    audioUrl: `/audio/${paperId}.mp3`
  };
}
