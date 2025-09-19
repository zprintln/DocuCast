import fetch from 'node-fetch';
import pdfParse from 'pdf-parse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function fetchPdfText(pdfUrl) {
  try {
    console.log(`Fetching PDF from: ${pdfUrl}`);
    
    const response = await fetch(pdfUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SecureScholar/1.0)',
        'Accept': 'application/pdf,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      timeout: 30000 // 30 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`PDF download failed: ${response.status} ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/pdf')) {
      throw new Error('URL does not point to a PDF file');
    }
    
    const buffer = await response.arrayBuffer();
    const data = await pdfParse(Buffer.from(buffer));
    
    return {
      text: data.text,
      pages: data.numpages,
      info: data.info,
      metadata: data.metadata
    };
    
  } catch (error) {
    console.error('PDF parsing error:', error);
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}

export async function extractRelevantSections(pdfText, maxLength = 5000) {
  // Extract the most relevant sections from the PDF
  const text = pdfText.text || pdfText;
  
  // Split into sections (abstract, introduction, conclusion, etc.)
  const sections = {
    abstract: extractSection(text, ['abstract', 'summary']),
    introduction: extractSection(text, ['introduction', 'background']),
    methodology: extractSection(text, ['method', 'approach', 'methodology']),
    results: extractSection(text, ['results', 'findings', 'experiments']),
    conclusion: extractSection(text, ['conclusion', 'discussion', 'future work'])
  };
  
  // Combine sections and limit length
  let combined = '';
  for (const [key, content] of Object.entries(sections)) {
    if (content && combined.length < maxLength) {
      combined += `\n\n${key.toUpperCase()}:\n${content}\n`;
    }
  }
  
  // If no sections found, take the beginning of the text
  if (!combined.trim()) {
    combined = text.substring(0, maxLength);
  }
  
  return combined.substring(0, maxLength);
}

function extractSection(text, keywords) {
  const lines = text.split('\n');
  let inSection = false;
  let sectionContent = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase().trim();
    
    // Check if this line starts a section we're looking for
    if (!inSection) {
      for (const keyword of keywords) {
        if (line.includes(keyword) && (line.length < 100)) {
          inSection = true;
          break;
        }
      }
    } else {
      // Check if we've hit another section
      const nextSectionKeywords = ['introduction', 'method', 'results', 'conclusion', 'references', 'bibliography'];
      const isNextSection = nextSectionKeywords.some(keyword => 
        line.includes(keyword) && line.length < 100
      );
      
      if (isNextSection) {
        break;
      }
      
      sectionContent.push(lines[i]);
    }
  }
  
  return sectionContent.join('\n').trim();
}

// Fallback function for demo when PDFs are not accessible
export async function fetchPdfTextFallback(pdfUrl) {
  console.log('Using fallback PDF content for demo');
  
  // Return sample content based on the URL
  const sampleContent = {
    text: `This is a sample research paper about brain tumor detection using AI. The paper presents a novel deep learning approach that achieves state-of-the-art performance on medical imaging datasets. Our methodology combines convolutional neural networks with attention mechanisms to improve detection accuracy while maintaining computational efficiency. The experimental results demonstrate significant improvements over existing methods, with 94.2% accuracy on the BraTS dataset. The approach shows promise for clinical deployment and could potentially improve early detection rates in medical practice.`,
    pages: 8,
    info: {
      Title: 'Deep Learning for Brain Tumor Detection',
      Author: 'Dr. Sarah Johnson et al.',
      Subject: 'Medical AI, Computer Vision',
      Keywords: 'brain tumor, deep learning, medical imaging, CNN'
    },
    metadata: {
      PDFFormatVersion: '1.4',
      CreationDate: '2024-01-15',
      ModDate: '2024-01-15'
    }
  };
  
  return sampleContent;
}
