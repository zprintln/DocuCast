# 🎙️ DocuCast - Turn Documents into Podcasts

A powerful AI-powered platform that transforms any document into engaging podcast content. Search for research papers or upload your own documents and convert them into professional audio experiences. Built for the MCP Hackathon using Apify MCP server and cutting-edge AI tools.

[Watch Our Demo Here](https://vimeo.com/1120322085?share=copy)

## 🚀 Features

- **🔍 Research Search**: Find and analyze academic papers using Apify's Google Scholar integration
- **📄 Document Upload**: Upload PDF documents and convert them to podcast format
- **🎧 Voice Conversion**: Transform any text into natural speech using Gladia TTS
- **🎙️ Podcast Generation**: Create engaging podcast content from documents
- **🛡️ Security First**: Integrated with Horizon3.ai for security validation
- **📝 AI Summarization**: Convert complex content into digestible summaries using Claude/OpenAI
- **🎵 Voice Customization**: Choose from different voice styles and speeds
- **🌐 Modern UI**: Beautiful, responsive interface with drag-and-drop upload

## 🏗️ Architecture

```
User Query → Security Validation → Apify Scholar Search → PDF Processing → 
AI Summarization → Vector Embeddings → Text-to-Speech → Redis Storage → 
Web Interface / Podcast Feed
```

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **AI/ML**: Anthropic Claude, OpenAI, Gladia TTS
- **Data**: Apify (Google Scholar), Redis (vector storage)
- **Security**: Horizon3.ai integration
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **PDF Processing**: pdf-parse

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd secure-scholar
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Start Redis** (optional, fallbacks available)
   ```bash
   redis-server
   ```

5. **Run the application**
   ```bash
   npm start
   ```

## 🔑 Environment Variables

Create a `.env` file with the following variables:

```env
PORT=3000

# Apify
APIFY_TOKEN=your_apify_token
APIFY_ACTOR=apify/google-scholar

# Embeddings (OpenAI / Cohere / any)
EMBEDDING_PROVIDER=openai
EMBEDDING_API_KEY=your_openai_api_key

# Redis (Redis Stack with vector support)
REDIS_URL=redis://localhost:6379
REDIS_NAMESPACE=secscholar:

# Gladia (TTS)
GLADIA_API_KEY=your_gladia_api_key

# Horizon3.ai (security validation)
HORIZON3_API_KEY=your_horizon3_api_key

# Optional: storage for MP3s
STORAGE_PATH=./tmp/audio
```

## 🚀 Quick Start

1. **Start the server**
   ```bash
   npm start
   ```

2. **Open your browser**
   Navigate to `http://localhost:3000`

3. **Search for research**
   - Enter a research topic (e.g., "brain tumor detection using AI")
   - Choose max results (3, 5, or 10)
   - Enable podcast mode for sequential audio playback
   - Click "Search"

4. **Listen to summaries**
   - Each paper gets an AI-generated summary
   - Click "Play Summary" to hear the audio
   - Use "Play All" for podcast mode

## 📡 API Endpoints

### Search Papers
```http
POST /search
Content-Type: application/json

{
  "query": "machine learning healthcare",
  "maxResults": 5,
  "podcastMode": true
}
```

### Get All Papers
```http
GET /papers
```

### Search Papers
```http
GET /papers/search?q=machine learning&limit=10
```

### Get Paper by ID
```http
GET /papers/:id
```

### Get Statistics
```http
GET /stats
```

### Health Check
```http
GET /health
```

### RSS Feed
```http
GET /podcast/:topic.rss
```

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Tests cover:
- Apify client functionality
- Summarization service
- Orchestrator flow
- Fallback mechanisms

## 🎯 Demo Scenarios

### 1. Basic Research Search
- Query: "deep learning medical imaging"
- Expected: 3-5 papers with summaries and audio

### 2. Podcast Mode
- Query: "artificial intelligence healthcare"
- Enable podcast mode
- Expected: Sequential audio playback of all summaries

### 3. Security Validation
- Query: "machine learning" (normal)
- Query: "<script>alert('xss')</script>" (blocked)
- Expected: Security validation working

## 🔧 Development

### Project Structure
```
src/
├── server.js          # Express server and API endpoints
├── apifyClient.js     # Apify integration for Google Scholar
├── validator.js       # Horizon3.ai security validation
├── pdfParser.js       # PDF text extraction
├── embeddings.js      # Vector embeddings (OpenAI)
├── redisClient.js     # Redis storage and search
├── summarizer.js      # LLM summarization (Claude/OpenAI)
├── tts.js            # Text-to-speech (Gladia)
├── orchestrator.js   # Main workflow coordination
└── utils.js          # Utility functions

public/
└── index.html        # Demo web interface

tests/
├── apify.test.js     # Apify client tests
├── summarizer.test.js # Summarization tests
└── orchestrator.test.js # Integration tests
```

### Adding New Features

1. **New AI Provider**: Add to `summarizer.js` or `embeddings.js`
2. **New TTS Provider**: Extend `tts.js`
3. **New Search Source**: Add to `apifyClient.js`
4. **New Security Check**: Extend `validator.js`

## 🚀 Deployment

### Docker (Recommended)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Setup
1. Set all required environment variables
2. Ensure Redis is running (or use fallbacks)
3. Configure reverse proxy (nginx) for production
4. Set up SSL certificates
5. Configure log rotation

## 🔒 Security Features

- **Query Validation**: Horizon3.ai integration for malicious query detection
- **Input Sanitization**: XSS and injection attack prevention
- **Rate Limiting**: Built-in request throttling
- **Secure Headers**: CORS and security headers configured
- **API Key Protection**: Environment variable management

## 📊 Performance

- **Caching**: Redis-based caching for repeated queries
- **Fallbacks**: Graceful degradation when services unavailable
- **Async Processing**: Non-blocking PDF and audio processing
- **Memory Management**: Automatic cleanup of old audio files

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🏆 Hackathon Pitch

### Problem
Researchers spend hours reading papers, struggling to stay current with rapidly evolving fields.

### Solution
SecureScholar transforms research discovery into an audio experience, making academic knowledge accessible and engaging.

### Key Differentiators
- **Security-First**: Only trusted sources, validated queries
- **Voice-First**: Natural audio summaries, podcast mode
- **AI-Powered**: Smart summarization, vector search
- **Production-Ready**: Fallbacks, error handling, monitoring

### Demo Flow
1. Search "brain tumor detection AI"
2. Get 5 papers with AI summaries
3. Listen to audio summaries
4. Enable podcast mode for sequential playback
5. Export RSS feed for podcast apps

### Business Model
- Freemium: Basic search free, premium features paid
- API licensing for research institutions
- White-label solutions for academic publishers

## 📞 Support

- **Issues**: GitHub Issues
- **Documentation**: This README
- **Demo**: http://localhost:3000 (when running)

---

Built with ❤️ for the MCP Hackathon
