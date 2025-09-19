// src/researchReport.js
import { runSearch } from './orchestrator.js';
import { textToSpeech, textToSpeechFallback } from './tts.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// In-memory storage for research reports (in production, use Redis)
const reports = new Map();

export async function generateResearchReport(query, options = {}) {
  const {
    maxResults = 10,
    useFallbacks = true
  } = options;
  
  try {
    console.log(`Generating research report for: "${query}"`);
    
    // Step 1: Get 10 relevant papers
    const searchResults = await runSearch(query, {
      maxResults,
      podcastMode: false,
      useFallbacks
    });
    
    if (!searchResults.papers || searchResults.papers.length === 0) {
      throw new Error('No papers found for research report');
    }
    
    // Step 2: Generate podcast-style summary
    const podcastSummary = await generatePodcastSummary(searchResults.papers, query);
    
    // Step 3: Convert to audio
    const reportId = uuidv4();
    const audioFileName = `research_report_${reportId}.mp3`;
    
    let audioPath;
    try {
      audioPath = await textToSpeech(podcastSummary, audioFileName);
    } catch (error) {
      console.log('TTS failed, using fallback:', error.message);
      if (useFallbacks) {
        audioPath = await textToSpeechFallback(podcastSummary, audioFileName);
      } else {
        throw error;
      }
    }
    
    // Step 4: Create report object
    const report = {
      id: reportId,
      title: `Research Report: ${query}`,
      query,
      summary: podcastSummary,
      papers: searchResults.papers,
      paperCount: searchResults.papers.length,
      audioUrl: `/audio/${audioFileName}`,
      audioPath,
      duration: estimateDuration(podcastSummary),
      createdAt: new Date().toISOString(),
      searchTime: searchResults.searchTime,
      validation: searchResults.validation
    };
    
    // Step 5: Store report
    reports.set(reportId, report);
    
    console.log(`Research report generated: ${reportId}`);
    return report;
    
  } catch (error) {
    console.error('Research report generation error:', error);
    throw new Error(`Failed to generate research report: ${error.message}`);
  }
}

export async function getResearchReport(reportId) {
  return reports.get(reportId) || null;
}

export async function getAllResearchReports() {
  return Array.from(reports.values());
}

async function generatePodcastSummary(papers, query) {
  try {
    // Create a comprehensive summary from all paper abstracts
    const abstracts = papers.map(paper => 
      `${paper.title}: ${paper.abstract || paper.summary}`
    ).join('\n\n');
    
    const prompt = `You are a research podcast host creating an engaging summary of recent research on "${query}".

Here are ${papers.length} research papers to summarize:

${abstracts}

Create a podcast-style summary that:
1. Opens with an engaging introduction about the topic
2. Discusses the key findings from each paper in a conversational tone
3. Highlights the most important insights and implications
4. Concludes with future directions and implications

Make it sound natural for audio - use transitions, emphasize key points, and make it engaging for listeners.
Keep it between 3-5 minutes when spoken (approximately 500-800 words).

Format as a flowing narrative, not bullet points.`;

    // For demo purposes, use a fallback summary
    return generateFallbackPodcastSummary(papers, query);
    
  } catch (error) {
    console.error('Podcast summary generation error:', error);
    return generateFallbackPodcastSummary(papers, query);
  }
}

function generateFallbackPodcastSummary(papers, query) {
  const paperTitles = papers.map(p => p.title).join(', ');
  const keyFindings = papers.map(p => p.summary).join(' ');
  
  return `Welcome to SecureScholar Research Report. Today we're diving deep into the fascinating world of ${query}.

Our research team has analyzed ${papers.length} cutting-edge papers to bring you the most comprehensive overview of this rapidly evolving field. Let's start with the big picture.

The papers we've examined reveal some truly remarkable insights. ${papers[0]?.title || 'The first study'} demonstrates significant advances in methodology, showing us that ${papers[0]?.summary || 'innovative approaches are yielding promising results'}.

Moving on to our second key finding, ${papers[1]?.title || 'another important study'} presents compelling evidence that ${papers[1]?.summary || 'the field is experiencing unprecedented growth and development'}.

What's particularly exciting about this research is how it connects to real-world applications. ${papers[2]?.title || 'A third study'} shows us that ${papers[2]?.summary || 'practical implementations are becoming more feasible and effective'}.

The implications of these findings are profound. We're seeing a convergence of different approaches that suggest we're on the brink of major breakthroughs in ${query}. The research indicates that ${papers[3]?.summary || 'future developments will likely focus on scalability and real-world deployment'}.

Looking ahead, the field of ${query} appears to be moving toward more integrated, multi-disciplinary approaches. The papers suggest that ${papers[4]?.summary || 'collaboration between different research groups will be crucial for continued progress'}.

In conclusion, the research landscape in ${query} is vibrant and full of promise. These ${papers.length} papers represent just a snapshot of the incredible work being done in this field. The future looks bright, and we can expect to see even more exciting developments in the months and years ahead.

Thank you for listening to this SecureScholar Research Report. Keep exploring, keep learning, and stay curious about the latest research.`;
}

function estimateDuration(text) {
  // Estimate duration based on average speaking rate (150 words per minute)
  const words = text.split(/\s+/).length;
  const minutes = words / 150;
  return Math.round(minutes * 60); // Return duration in seconds
}

// Test function for audio conversion
export async function testAudioConversion() {
  try {
    console.log('Testing audio conversion...');
    
    const testText = "This is a test of the audio conversion system. The research report functionality is working correctly and can convert text to speech.";
    const testFileName = `test_audio_${Date.now()}.mp3`;
    
    const audioPath = await textToSpeechFallback(testText, testFileName);
    
    console.log(`Test audio created at: ${audioPath}`);
    
    // Check if file exists
    if (fs.existsSync(audioPath)) {
      const stats = fs.statSync(audioPath);
      console.log(`Audio file size: ${stats.size} bytes`);
      return {
        success: true,
        audioPath,
        fileSize: stats.size,
        audioUrl: `/audio/${testFileName}`
      };
    } else {
      throw new Error('Audio file was not created');
    }
    
  } catch (error) {
    console.error('Audio conversion test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
