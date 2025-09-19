#!/bin/bash

# DocuCast Environment Setup Script
echo "Setting up DocuCast environment variables..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
# DocuCast Environment Variables

# Server Configuration
PORT=3000

# Apify Configuration (for Google Scholar scraping)
APIFY_TOKEN=your_apify_token_here
APIFY_ACTOR=apify/google-scholar

# LLM Configuration (for summarization)
LLM_PROVIDER=openai
LLM_API_KEY=your_openai_api_key_here

# Embeddings Configuration
EMBEDDING_PROVIDER=openai
EMBEDDING_API_KEY=your_openai_api_key_here

# Redis Configuration (optional, for caching)
REDIS_URL=redis://localhost:6379
REDIS_NAMESPACE=docucast

# Text-to-Speech Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Security Configuration
HORIZON3_API_KEY=your_horizon3_api_key_here

# Storage Configuration
STORAGE_PATH=./tmp/audio
EOF
    echo "✅ Created .env file"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🔧 To fix the TTS issue:"
echo "1. Get your OpenAI API key from: https://platform.openai.com/api-keys"
echo "2. Edit the .env file and replace 'your_openai_api_key_here' with your actual key"
echo "3. Restart the server: npm start"
echo ""
echo "📝 Example:"
echo "OPENAI_API_KEY=sk-your-actual-api-key-here"
