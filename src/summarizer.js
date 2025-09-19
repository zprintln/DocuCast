// src/summarizer.js
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.LLM_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
});

export async function summarizePaper({ title, abstract, text }) {
  try {
    const prompt = createSummarizationPrompt(title, abstract, text);
    
    let response;
    
    if (process.env.LLM_PROVIDER === 'anthropic') {
      response = await callAnthropic(prompt);
    } else {
      response = await callOpenAI(prompt);
    }
    
    return parseSummaryResponse(response);
    
  } catch (error) {
    console.error('Summarization error:', error);
    throw new Error(`Failed to summarize paper: ${error.message}`);
  }
}

function createSummarizationPrompt(title, abstract, text) {
  return `You are a concise research summarizer for researchers and students.

Title: ${title}
Abstract: ${abstract}

${text ? `Additional Content: ${text.substring(0, 2000)}...` : ''}

Task:
1) Give a 2-sentence plain-language summary of the paper's key contribution.
2) List 3 concise bullets covering: Method / Novelty / Key Result
3) Rate importance to the queried topic as a number 0-10.

Return JSON only in this exact format:
{
  "summary": "Brief 2-sentence summary in plain English",
  "bullets": [
    "Method: Description of the approach used",
    "Novelty: What's new or innovative about this work", 
    "Key Result: Main finding or achievement"
  ],
  "importance": 8
}`;
}

async function callAnthropic(prompt) {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1000,
      temperature: 0.2,
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

async function callOpenAI(prompt) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a concise research summarizer. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.2,
      max_tokens: 1000
    });
    
    return response.choices[0].message.content;
    
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

function parseSummaryResponse(response) {
  try {
    // Extract JSON from response (in case there's extra text)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : response;
    
    const parsed = JSON.parse(jsonStr);
    
    // Validate required fields
    if (!parsed.summary || !parsed.bullets || !Array.isArray(parsed.bullets)) {
      throw new Error('Invalid response format');
    }
    
    // Ensure bullets array has exactly 3 items
    if (parsed.bullets.length !== 3) {
      // Pad or truncate as needed
      while (parsed.bullets.length < 3) {
        parsed.bullets.push('Not specified');
      }
      parsed.bullets = parsed.bullets.slice(0, 3);
    }
    
    // Ensure importance is a number between 0-10
    parsed.importance = Math.max(0, Math.min(10, parseInt(parsed.importance) || 5));
    
    return parsed;
    
  } catch (error) {
    console.error('Response parsing error:', error);
    // Return fallback response
    return {
      summary: "This paper presents research findings in the specified domain. The work contributes to the field through novel approaches and experimental validation.",
      bullets: [
        "Method: Advanced computational approach",
        "Novelty: New technique or framework",
        "Key Result: Significant improvement or discovery"
      ],
      importance: 5
    };
  }
}

export async function generatePodcastIntro(topic, paperCount) {
  const prompt = `Create a brief podcast introduction for a research summary about "${topic}". 
  
  We have ${paperCount} research papers to cover. 
  
  Make it engaging and professional, like a research podcast host would introduce the topic.
  
  Keep it under 100 words and make it sound natural for audio.`;

  try {
    let response;
    
    if (process.env.LLM_PROVIDER === 'anthropic') {
      response = await callAnthropic(prompt);
    } else {
      response = await callOpenAI(prompt);
    }
    
    return response.trim();
    
  } catch (error) {
    console.error('Podcast intro generation error:', error);
    return `Welcome to SecureScholar. Today we're exploring the latest research on ${topic}. We have ${paperCount} papers to cover, each with key insights and findings. Let's dive in.`;
  }
}

export async function generatePodcastOutro(topic) {
  const prompt = `Create a brief podcast outro for a research summary about "${topic}". 
  
  Thank the listeners and encourage them to explore more research.
  
  Keep it under 50 words and make it sound natural for audio.`;

  try {
    let response;
    
    if (process.env.LLM_PROVIDER === 'anthropic') {
      response = await callAnthropic(prompt);
    } else {
      response = await callOpenAI(prompt);
    }
    
    return response.trim();
    
  } catch (error) {
    console.error('Podcast outro generation error:', error);
    return `That concludes our exploration of ${topic}. Thank you for listening to SecureScholar. Keep learning and stay curious about the latest research.`;
  }
}

// Fallback function for demo when LLM APIs are not available
export async function summarizePaperFallback({ title, abstract, text }) {
  console.log('Using fallback summarization for demo');
  
  return {
    summary: `This research paper titled "${title}" presents important findings in the field. The work demonstrates significant contributions through innovative methodology and experimental validation.`,
    bullets: [
      `Method: Advanced computational approach used in ${title}`,
      `Novelty: New technique or framework presented`,
      `Key Result: Significant improvement or discovery achieved`
    ],
    importance: Math.floor(Math.random() * 4) + 6 // Random importance 6-9
  };
}
