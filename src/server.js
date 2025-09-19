import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import multer from 'multer';
import { runSearch, getSearchHistory, getPaperById } from './orchestrator.js';
import { getAllPapers, searchPapers, getPaperStats } from './redisClient.js';
import { cleanupOldAudio } from './tts.js';
import { generateResearchReport, getResearchReport, testAudioConversion } from './researchReport.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Configure multer for file uploads
const upload = multer({
  dest: 'tmp/uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve audio files
app.use('/audio', express.static(process.env.STORAGE_PATH || './tmp/audio'));

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Main search endpoint
app.post('/search', async (req, res) => {
  try {
    const { query, maxResults = 5, podcastMode = false } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        error: 'Query is required and must be a string' 
      });
    }
    
    console.log(`Search request: "${query}" (maxResults: ${maxResults}, podcastMode: ${podcastMode})`);
    
    const results = await runSearch(query, { 
      maxResults, 
      podcastMode,
      useFallbacks: true 
    });
    
    res.json(results);
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Search failed', 
      message: error.message 
    });
  }
});

// Get all papers
app.get('/papers', async (req, res) => {
  try {
    const papers = await getAllPapers();
    res.json({ papers });
  } catch (error) {
    console.error('Get papers error:', error);
    res.status(500).json({ 
      error: 'Failed to get papers', 
      message: error.message 
    });
  }
});

// Search papers
app.get('/papers/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        error: 'Query parameter "q" is required' 
      });
    }
    
    const papers = await searchPapers(q, parseInt(limit));
    res.json({ papers, query: q });
    
  } catch (error) {
    console.error('Search papers error:', error);
    res.status(500).json({ 
      error: 'Failed to search papers', 
      message: error.message 
    });
  }
});

// Get specific paper
app.get('/papers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const paper = await getPaperById(id);
    
    if (!paper) {
      return res.status(404).json({ 
        error: 'Paper not found' 
      });
    }
    
    res.json(paper);
    
  } catch (error) {
    console.error('Get paper error:', error);
    res.status(500).json({ 
      error: 'Failed to get paper', 
      message: error.message 
    });
  }
});

// Get paper statistics
app.get('/stats', async (req, res) => {
  try {
    const stats = await getPaperStats();
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get stats', 
      message: error.message 
    });
  }
});

// Get search history
app.get('/history', async (req, res) => {
  try {
    const history = await getSearchHistory();
    res.json(history);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ 
      error: 'Failed to get history', 
      message: error.message 
    });
  }
});

// Generate research report
app.post('/research-report', async (req, res) => {
  try {
    const { query, maxResults = 10 } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        error: 'Query is required and must be a string' 
      });
    }
    
    console.log(`Research report request: "${query}" (maxResults: ${maxResults})`);
    
    const report = await generateResearchReport(query, { 
      maxResults,
      useFallbacks: true 
    });
    
    res.json(report);
    
  } catch (error) {
    console.error('Research report error:', error);
    res.status(500).json({ 
      error: 'Research report generation failed', 
      message: error.message 
    });
  }
});

// Get research report by ID
app.get('/research-report/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const report = await getResearchReport(id);
    
    if (!report) {
      return res.status(404).json({ 
        error: 'Research report not found' 
      });
    }
    
    res.json(report);
    
  } catch (error) {
    console.error('Get research report error:', error);
    res.status(500).json({ 
      error: 'Failed to get research report', 
      message: error.message 
    });
  }
});

// Test audio conversion
app.post('/test-audio', async (req, res) => {
  try {
    console.log('Testing audio conversion...');
    
    const result = await testAudioConversion();
    res.json(result);
    
  } catch (error) {
    console.error('Audio test error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Audio test failed', 
      message: error.message 
    });
  }
});

// Convert document to podcast
app.post('/convert-document', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file uploaded' 
      });
    }

    const { voice = 'professional', speed = '1.0' } = req.body;
    
    console.log(`Document conversion request: ${req.file.originalname}`);
    
    // Import the document conversion function
    const { convertDocumentToPodcast } = await import('./documentConverter.js');
    
    const result = await convertDocumentToPodcast(req.file, {
      voice,
      speed: parseFloat(speed),
      useFallbacks: true
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('Document conversion error:', error);
    res.status(500).json({ 
      error: 'Document conversion failed', 
      message: error.message 
    });
  }
});

// Generate RSS feed for podcast
app.get('/podcast/:topic.rss', async (req, res) => {
  try {
    const { topic } = req.params;
    const papers = await getAllPapers();
    
    const rss = generateRSSFeed(topic, papers);
    
    res.set('Content-Type', 'application/rss+xml');
    res.send(rss);
    
  } catch (error) {
    console.error('RSS generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate RSS feed', 
      message: error.message 
    });
  }
});

// Serve the main demo page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SecureScholar server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 Search API: POST http://localhost:${PORT}/search`);
  console.log(`📚 Papers API: GET http://localhost:${PORT}/papers`);
  console.log(`🎧 Demo UI: http://localhost:${PORT}`);
  
  // Clean up old audio files on startup
  cleanupOldAudio();
  
  // Set up periodic cleanup
  setInterval(() => {
    cleanupOldAudio();
  }, 24 * 60 * 60 * 1000); // Every 24 hours
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Helper function to generate RSS feed
function generateRSSFeed(topic, papers) {
  const baseUrl = `http://localhost:${PORT}`;
  const now = new Date().toISOString();
  
  let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>SecureScholar - ${topic}</title>
    <description>Research summaries and audio content for ${topic}</description>
    <link>${baseUrl}</link>
    <lastBuildDate>${now}</lastBuildDate>
    <language>en-us</language>
    <generator>SecureScholar v1.0</generator>
`;
  
  papers.forEach((paper, index) => {
    if (paper.audioPath) {
      rss += `    <item>
      <title>${paper.title}</title>
      <description>${paper.summary}</description>
      <link>${paper.url || '#'}</link>
      <enclosure url="${baseUrl}${paper.audioUrl}" type="audio/mpeg" length="0"/>
      <pubDate>${paper.publishedDate || now}</pubDate>
      <guid>${paper.id}</guid>
    </item>
`;
    }
  });
  
  rss += `  </channel>
</rss>`;
  
  return rss;
}
