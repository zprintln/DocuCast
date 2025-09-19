# 🎯 SecureScholar Demo Guide

## Quick Start

1. **Start the server**
   ```bash
   npm start
   ```

2. **Open your browser**
   Navigate to `http://localhost:3000`

3. **Try these demo queries:**
   - "brain tumor detection using AI"
   - "machine learning healthcare"
   - "artificial intelligence medical diagnosis"

## Demo Features

### 🔍 Search Interface
- Clean, modern web interface
- Real-time search with loading indicators
- Configurable result limits (3, 5, 10 papers)
- Podcast mode toggle

### 🎧 Audio Features
- AI-generated audio summaries for each paper
- Individual play buttons for each paper
- "Play All" button for podcast mode
- Sequential audio playback

### 📊 Results Display
- Paper titles, authors, and metadata
- AI-generated summaries (2 sentences)
- 3 key bullet points per paper
- Importance scores (0-10)
- Venue and citation information

### 🛡️ Security Features
- Query validation and sanitization
- Horizon3.ai integration (demo mode)
- XSS and injection attack prevention

## API Endpoints

### Search Papers
```bash
curl -X POST http://localhost:3000/search \
  -H "Content-Type: application/json" \
  -d '{"query": "machine learning healthcare", "maxResults": 3}'
```

### Health Check
```bash
curl http://localhost:3000/health
```

### Get All Papers
```bash
curl http://localhost:3000/papers
```

## Demo Scenarios

### 1. Basic Research Search
1. Enter "deep learning medical imaging"
2. Select 5 results
3. Click "Search"
4. Wait for processing (uses fallback data)
5. Click "Play Summary" on any paper

### 2. Podcast Mode
1. Enter "artificial intelligence healthcare"
2. Enable "Podcast Mode"
3. Click "Search"
4. Click "Play All" for sequential playback

### 3. Security Demo
1. Try searching for normal queries
2. Try searching for "<script>alert('xss')</script>"
3. Notice the security validation working

## Technical Architecture

```
User Query → Security Validation → Apify Scholar Search → PDF Processing → 
AI Summarization → Vector Embeddings → Text-to-Speech → Redis Storage → 
Web Interface / Podcast Feed
```

## Fallback Mode

The demo runs in fallback mode when external services aren't available:
- **Apify**: Uses sample research papers
- **LLM APIs**: Uses mock summarization
- **TTS**: Creates placeholder audio files
- **Redis**: Uses in-memory fallbacks

## Production Deployment

To run with real APIs:

1. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with real API keys
   ```

2. **Start Redis**
   ```bash
   redis-server
   ```

3. **Run the application**
   ```bash
   npm start
   ```

## Troubleshooting

### Server won't start
- Check if port 3000 is available
- Ensure all dependencies are installed: `npm install`

### No audio playback
- Check browser console for errors
- Ensure audio files are generated in `./tmp/audio/`

### Redis connection errors
- These are expected in demo mode
- Install and start Redis for full functionality

## Hackathon Pitch Points

1. **Problem**: Researchers struggle to stay current with rapidly evolving fields
2. **Solution**: Voice-first research assistant with AI summarization
3. **Differentiators**: Security-first, podcast mode, production-ready
4. **Demo**: Show search → audio → podcast flow
5. **Business Model**: Freemium, API licensing, white-label solutions

## Next Steps

1. **Integrate real APIs** (Apify, Anthropic, Gladia, Horizon3.ai)
2. **Add more search sources** (arXiv, PubMed, IEEE)
3. **Implement user accounts** and search history
4. **Add mobile app** for on-the-go research
5. **Create subscription tiers** for premium features

---

Built with ❤️ for the MCP Hackathon
