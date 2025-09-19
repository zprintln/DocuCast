import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

let openaiClient = null;

// Initialize OpenAI client
function getOpenAIClient() {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('✅ OpenAI client initialized');
  }
  return openaiClient;
}

export async function summarizePaper({ title, abstract, text }) {
  console.log(`🤖 Summarizing: "${title}"`);
  
  try {
    const client = getOpenAIClient();
    
    if (!client) {
      console.log('⚠️ No OpenAI API key, using fallback');
      return summarizePaperFallback({ title, abstract, text });
    }
    
    const prompt = createSummarizationPrompt(title, abstract, text);
    
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a research paper summarizer. Always respond with valid JSON in the exact format requested.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });
    
    const content = response.choices[0].message.content;
    console.log('✅ OpenAI summary generated');
    
    return parseSummaryResponse(content);
    
  } catch (error) {
    console.error('❌ Summarization error:', error.message);
    console.log('🔄 Falling back to basic summary');
    return summarizePaperFallback({ title, abstract, text });
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
  "summary": "Brief 2-4-sentence summary in plain English highlighting the paper's key contribution",
  "bullets": [
    "Method: Description of the approach used",
    "Novelty: What's new or innovative about this work", 
    "Key Result: Main finding or achievement"
  ],
  "importance": 8
}`;
}

function parseSummaryResponse(response) {
  try {
    // Parse the JSON response
    const parsed = JSON.parse(response);
    
    // Validate required fields
    if (!parsed.summary || !parsed.bullets || !Array.isArray(parsed.bullets)) {
      throw new Error('Invalid response format');
    }
    
    // Ensure bullets array has exactly 3 items
    while (parsed.bullets.length < 3) {
      parsed.bullets.push('Additional details in paper');
    }
    parsed.bullets = parsed.bullets.slice(0, 3);
    
    // Ensure importance is a number between 0-10
    parsed.importance = Math.max(0, Math.min(10, parseInt(parsed.importance) || 5));
    
    // Add metadata
    parsed.llmProvider = 'openai';
    parsed.processingTime = new Date().toISOString();
    
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
      importance: 5,
      llmProvider: 'fallback',
      processingTime: new Date().toISOString()
    };
  }
}

export async function generatePodcastIntro(topic, paperCount) {
  console.log(`🎙️ Generating podcast intro for: "${topic}"`);
  
  try {
    const client = getOpenAIClient();
    
    if (!client) {
      return `Welcome to SecureScholar. Today we're exploring the latest research on ${topic}. We have ${paperCount} papers to cover, each with key insights and findings. Let's dive in.`;
    }
    
    const prompt = `Create a brief podcast introduction for a research summary about "${topic}". 
    
We have ${paperCount} research papers to cover. 

Make it engaging and professional, like a research podcast host would introduce the topic.

Keep it under 100 words and make it sound natural for audio.`;

    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    });
    
    return response.choices[0].message.content.trim();
    
  } catch (error) {
    console.error('Podcast intro generation error:', error);
    return `Welcome to SecureScholar. Today we're exploring the latest research on ${topic}. We have ${paperCount} papers to cover, each with key insights and findings. Let's dive in.`;
  }
}

export async function generatePodcastOutro(topic) {
  console.log(`🎙️ Generating podcast outro for: "${topic}"`);
  
  try {
    const client = getOpenAIClient();
    
    if (!client) {
      return `That concludes our exploration of ${topic}. Thank you for listening to SecureScholar. Keep learning and stay curious about the latest research.`;
    }
    
    const prompt = `Create a brief podcast outro for a research summary about "${topic}". 
    
Thank the listeners and encourage them to explore more research.

Keep it under 50 words and make it sound natural for audio.`;

    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.7
    });
    
    return response.choices[0].message.content.trim();
    
  } catch (error) {
    console.error('Podcast outro generation error:', error);
    return `That concludes our exploration of ${topic}. Thank you for listening to SecureScholar. Keep learning and stay curious about the latest research.`;
  }
}

// Fallback function for demo when LLM APIs are not available
export async function summarizePaperFallback({ title, abstract, text }) {
  console.log('🎭 Using fallback summarization for demo');
  
  return {
    summary: `This research paper titled "${title}" presents important findings in the field. ${abstract ? abstract.substring(0, 100) + '...' : 'The work demonstrates significant contributions through innovative methodology and experimental validation.'}`,
    bullets: [
      `Method: Computational approach focusing on ${title.split(' ').slice(-2).join(' ')}`,
      `Novelty: New technique or framework presented in this study`,
      `Key Result: Significant improvement or discovery achieved`
    ],
    importance: Math.floor(Math.random() * 4) + 6, // Random importance 6-9
    llmProvider: 'fallback',
    processingTime: new Date().toISOString(),
    note: 'Add OPENAI_API_KEY for AI-powered summaries'
  };
}

// Health check function
export async function healthCheck() {
  const status = {
    service: 'Summarization',
    provider: 'OpenAI only'
  };
  
  if (!process.env.OPENAI_API_KEY) {
    return {
      ...status,
      status: 'missing-key',
      message: 'OPENAI_API_KEY not found in environment',
      fallbackAvailable: true
    };
  }
  
  try {
    const client = getOpenAIClient();
    
    // Test API call
    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello' }],
      max_tokens: 5
    });
    
    return {
      ...status,
      status: 'healthy',
      model: 'gpt-3.5-turbo',
      responseTime: 'OK'
    };
    
  } catch (error) {
    return {
      ...status,
      status: 'error',
      error: error.message,
      fallbackAvailable: true
    };
  }
}