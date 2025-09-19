// src/apifyClient.js
import { Actor } from 'apify';
import dotenv from 'dotenv';

dotenv.config();

export async function fetchScholarResults(query, maxResults = 5) {
  try {
    await Actor.init();
    const input = { 
      query, 
      maxResults,
      // Additional options for better results
      includePdfLinks: true,
      includeAbstracts: true
    };
    
    const run = await Actor.call(
      process.env.APIFY_ACTOR || 'apify/google-scholar', 
      input
    );
    
    await Actor.exit();
    
    // Transform the results to our expected format
    const results = run.output || [];
    return results.map(paper => ({
      id: generatePaperId(paper),
      title: paper.title || 'Untitled',
      authors: paper.authors || [],
      abstract: paper.abstract || paper.snippet || '',
      url: paper.url || '',
      pdfUrl: paper.pdfUrl || paper.pdfLink || '',
      publishedDate: paper.publishedDate || paper.year || '',
      citations: paper.citations || 0,
      venue: paper.venue || paper.journal || ''
    }));
  } catch (error) {
    console.error('Error fetching scholar results:', error);
    throw new Error(`Failed to fetch scholar results: ${error.message}`);
  }
}

function generatePaperId(paper) {
  // Generate a unique ID based on title and first author
  const title = paper.title || 'untitled';
  const firstAuthor = paper.authors?.[0] || 'unknown';
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20);
  const cleanAuthor = firstAuthor.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
  return `${cleanTitle}_${cleanAuthor}_${Date.now()}`;
}

// Fallback function for demo purposes when Apify is not available
export async function fetchScholarResultsFallback(query, maxResults = 5) {
  console.log('Using fallback data for demo purposes');
  
  // Sample data for demo
  const sampleResults = [
    {
      id: 'brain_tumor_ai_detection_2024',
      title: 'Deep Learning Approaches for Brain Tumor Detection in MRI Images',
      authors: ['Dr. Sarah Johnson', 'Prof. Michael Chen', 'Dr. Lisa Wang'],
      abstract: 'This paper presents a novel deep learning framework for automated brain tumor detection in MRI images using convolutional neural networks. Our approach achieves 94.2% accuracy on the BraTS dataset, significantly outperforming traditional methods.',
      url: 'https://example.com/paper1',
      pdfUrl: 'https://example.com/paper1.pdf',
      publishedDate: '2024',
      citations: 127,
      venue: 'Nature Machine Intelligence'
    },
    {
      id: 'ai_medical_diagnosis_2024',
      title: 'Artificial Intelligence in Medical Diagnosis: A Comprehensive Review',
      authors: ['Dr. Robert Smith', 'Dr. Emily Davis'],
      abstract: 'We provide a comprehensive review of AI applications in medical diagnosis, covering recent advances in computer vision, natural language processing, and multimodal learning approaches.',
      url: 'https://example.com/paper2',
      pdfUrl: 'https://example.com/paper2.pdf',
      publishedDate: '2024',
      citations: 89,
      venue: 'Journal of Medical AI'
    },
    {
      id: 'neural_networks_healthcare_2024',
      title: 'Neural Networks for Healthcare: Challenges and Opportunities',
      authors: ['Dr. Maria Garcia', 'Prof. James Wilson'],
      abstract: 'This study explores the application of neural networks in healthcare, discussing challenges related to data privacy, model interpretability, and clinical validation.',
      url: 'https://example.com/paper3',
      pdfUrl: 'https://example.com/paper3.pdf',
      publishedDate: '2024',
      citations: 156,
      venue: 'IEEE Transactions on Biomedical Engineering'
    }
  ];
  
  return sampleResults.slice(0, Math.min(maxResults, sampleResults.length));
}
