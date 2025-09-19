// src/researchReport.js
import { fetchScholarResults, fetchScholarResultsFallback } from './apifyClient.js';
import { fetchPdfText, extractRelevantSections, fetchPdfTextFallback } from './pdfParser.js';
import { summarizePaper, summarizePaperFallback } from './summarizer.js';
import { textToSpeech, textToSpeechFallback } from './tts.js';
import { savePaper, savePaperFallback } from './redisClient.js';
import { v4 as uuidv4 } from 'uuid';

export async function generateResearchReport(query, options = {}) {
  const {
    maxResults = 10,
    useFallbacks = true
  } = options;
  
  try {
    console.log(`Generating research report for: "${query}"`);
    
    // Step 1: Fetch 10 relevant papers
    console.log('Step 1: Fetching 10 relevant papers');
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
      throw new Error('No papers found for the query');
    }
    
    console.log(`Found ${scholarResults.length} papers`);
    
    // Step 2: Process each paper to get summaries
    console.log('Step 2: Processing papers for summaries');
    const paperSummaries = [];
    
    for (let i = 0; i < scholarResults.length; i++) {
      const paper = scholarResults[i];
      console.log(`Processing paper ${i + 1}/${scholarResults.length}: ${paper.title}`);
      
      try {
        const summary = await processPaperForReport(paper, useFallbacks);
        paperSummaries.push(summary);
      } catch (error) {
        console.error(`Error processing paper "${paper.title}":`, error);
        // Continue with other papers
        continue;
      }
    }
    
    if (paperSummaries.length === 0) {
      throw new Error('No papers could be processed successfully');
    }
    
    // Step 3: Generate podcast-style summary
    console.log('Step 3: Generating podcast-style summary');
    const podcastSummary = await generatePodcastSummary(query, paperSummaries, useFallbacks);
    
    // Step 4: Convert to audio
    console.log('Step 4: Converting to audio');
    const reportId = uuidv4();
    const audioFileName = `research_report_${reportId}.mp3`;
    
    let audioPath;
    try {
      audioPath = await textToSpeech(podcastSummary, audioFileName);
    } catch (error) {
      console.log(`Audio generation failed, using fallback: ${error.message}`);
      if (useFallbacks) {
        audioPath = await textToSpeechFallback(podcastSummary, audioFileName);
      } else {
        throw error;
      }
    }
    
    // Step 5: Save report metadata
    const reportMetadata = {
      id: reportId,
      query,
      title: `Research Report: ${query}`,
      summary: podcastSummary,
      paperCount: paperSummaries.length,
      papers: paperSummaries,
      audioPath: audioPath,
      audioUrl: `/audio/${audioFileName}`,
      createdAt: new Date().toISOString(),
      duration: estimateAudioDuration(podcastSummary)
    };
    
    try {
      await savePaper(reportId, reportMetadata, []);
    } catch (error) {
      console.log(`Redis save failed, using fallback: ${error.message}`);
      if (useFallbacks) {
        await savePaperFallback(reportId, reportMetadata, []);
      }
    }
    
    console.log(`Research report generated successfully: ${reportId}`);
    return reportMetadata;
    
  } catch (error) {
    console.error('Research report generation error:', error);
    throw new Error(`Research report generation failed: ${error.message}`);
  }
}

async function processPaperForReport(paper, useFallbacks) {
  try {
    // Extract text content
    let textContent = paper.abstract || '';
    
    if (paper.pdfUrl) {
      try {
        const pdfData = await fetchPdfText(paper.pdfUrl);
        const relevantSections = await extractRelevantSections(pdfData);
        textContent = relevantSections || pdfData.text || paper.abstract;
      } catch (error) {
        console.log(`PDF fetch failed, using abstract: ${error.message}`);
        if (useFallbacks) {
          const fallbackPdfData = await fetchPdfTextFallback(paper.pdfUrl);
          textContent = fallbackPdfData.text || paper.abstract;
        }
      }
    }
    
    // Generate summary
    let summaryData;
    try {
      summaryData = await summarizePaper({
        title: paper.title,
        abstract: paper.abstract,
        text: textContent
      });
    } catch (error) {
      console.log(`Summary generation failed, using fallback: ${error.message}`);
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
    
    return {
      id: paper.id,
      title: paper.title,
      authors: paper.authors,
      venue: paper.venue,
      publishedDate: paper.publishedDate,
      citations: paper.citations,
      summary: summaryData.summary,
      bullets: summaryData.bullets,
      importance: summaryData.importance
    };
    
  } catch (error) {
    console.error(`Failed to process paper "${paper.title}":`, error);
    throw error;
  }
}

async function generatePodcastSummary(query, paperSummaries, useFallbacks) {
  try {
    // Create a comprehensive prompt for podcast-style summary
    const papersText = paperSummaries.map((paper, index) => 
      `Paper ${index + 1}: "${paper.title}" by ${paper.authors?.join(', ') || 'Unknown Authors'}
      Summary: ${paper.summary}
      Key Points: ${paper.bullets.join('. ')}
      Importance: ${paper.importance}/10
      Venue: ${paper.venue || 'Unknown'}
      `
    ).join('\n\n');
    
    const prompt = `You are a research podcast host creating an engaging summary of recent research on "${query}".

Here are ${paperSummaries.length} recent papers on this topic:

${papersText}

Create a compelling podcast-style summary that:
1. Opens with an engaging introduction about the topic
2. Discusses the key findings from the most important papers
3. Highlights trends and patterns across the research
4. Mentions specific studies and their contributions
5. Concludes with implications and future directions
6. Uses conversational, engaging language suitable for audio
7. Is approximately 3-5 minutes when read aloud (aim for 500-800 words)

Make it sound natural and engaging, like a research podcast host would present it.`;

    let response;
    
    if (process.env.LLM_PROVIDER === 'anthropic') {
      response = await callAnthropicForReport(prompt);
    } else {
      response = await callOpenAIForReport(prompt);
    }
    
    return response.trim();
    
  } catch (error) {
    console.error('Podcast summary generation error:', error);
    
    // Fallback to a simple concatenation
    const fallbackSummary = createFallbackPodcastSummary(query, paperSummaries);
    return fallbackSummary;
  }
}

async function callAnthropicForReport(prompt) {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const anthropic = new Anthropic({
    apiKey: process.env.LLM_API_KEY,
  });

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });
    
    return response.content[0].text;
    
  } catch (error) {
    console.error('Anthropic API error:', error);
    throw error;
  }
}

async function callOpenAIForReport(prompt) {
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({
    apiKey: process.env.LLM_API_KEY,
  });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a research podcast host creating engaging summaries of academic research. Always write in a conversational, engaging style suitable for audio presentation.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });
    
    return response.choices[0].message.content;
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

function createFallbackPodcastSummary(query, paperSummaries) {
  const topPapers = paperSummaries
    .sort((a, b) => (b.importance || 0) - (a.importance || 0))
    .slice(0, 5);
  
  let summary = `Welcome to SecureScholar Research Report. Today we're exploring the latest research on ${query}.\n\n`;
  
  summary += `We've analyzed ${paperSummaries.length} recent papers, and here are the key findings:\n\n`;
  
  topPapers.forEach((paper, index) => {
    summary += `First, let's look at "${paper.title}" by ${paper.authors?.join(', ') || 'researchers'}. `;
    summary += `${paper.summary} `;
    summary += `The key points are: ${paper.bullets.join('. ')} `;
    summary += `This work was published in ${paper.venue || 'a leading journal'} and has an importance score of ${paper.importance || 5} out of 10.\n\n`;
  });
  
  summary += `In conclusion, the research on ${query} shows significant progress with multiple innovative approaches. `;
  summary += `The field continues to evolve rapidly, with these studies contributing valuable insights for future research and practical applications.\n\n`;
  summary += `Thank you for listening to this SecureScholar Research Report. Stay curious and keep learning!`;
  
  return summary;
}

function estimateAudioDuration(text) {
  // Estimate audio duration based on text length
  // Average speaking rate is about 150-160 words per minute
  const wordsPerMinute = 155;
  const wordCount = text.split(/\s+/).length;
  const minutes = wordCount / wordsPerMinute;
  return Math.round(minutes * 60); // Return duration in seconds
}

export async function getResearchReport(reportId) {
  // This would typically query Redis for the specific report
  // For now, return a mock response
  return {
    id: reportId,
    title: 'Research Report',
    summary: 'This is a sample research report summary.',
    audioUrl: `/audio/research_report_${reportId}.mp3`,
    paperCount: 10,
    duration: 300
  };
}
