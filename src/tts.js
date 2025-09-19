import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function textToSpeech(text, outFileName) {
  try {
    console.log(`Converting text to speech: ${outFileName}`);
    
    // Ensure storage directory exists
    const storagePath = process.env.STORAGE_PATH || './tmp/audio';
    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
    }
    
    const outPath = path.join(storagePath, outFileName);
    
    // Call Gladia TTS API
    const response = await fetch('https://api.gladia.io/audio/text-to-speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GLADIA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        voice: 'alloy', // You can change this to other available voices
        input: text,
        output_format: 'mp3',
        sample_rate: 22050
      })
    });
    
    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(outPath, Buffer.from(arrayBuffer));
    
    console.log(`Audio saved to: ${outPath}`);
    return outPath;
    
  } catch (error) {
    console.error('TTS error:', error);
    throw new Error(`Failed to convert text to speech: ${error.message}`);
  }
}

export async function textToSpeechWithOptions(text, outFileName, options = {}) {
  try {
    const {
      voice = 'alloy',
      outputFormat = 'mp3',
      sampleRate = 22050,
      speed = 1.0,
      pitch = 1.0
    } = options;
    
    console.log(`Converting text to speech with options: ${outFileName}`);
    
    // Ensure storage directory exists
    const storagePath = process.env.STORAGE_PATH || './tmp/audio';
    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
    }
    
    const outPath = path.join(storagePath, outFileName);
    
    // Call Gladia TTS API with options
    const response = await fetch('https://api.gladia.io/audio/text-to-speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GLADIA_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        voice,
        input: text,
        output_format: outputFormat,
        sample_rate: sampleRate,
        speed,
        pitch
      })
    });
    
    if (!response.ok) {
      throw new Error(`TTS API error: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(outPath, Buffer.from(arrayBuffer));
    
    console.log(`Audio saved to: ${outPath}`);
    return outPath;
    
  } catch (error) {
    console.error('TTS with options error:', error);
    throw new Error(`Failed to convert text to speech with options: ${error.message}`);
  }
}

export async function generatePodcastAudio(segments, topic) {
  try {
    const storagePath = process.env.STORAGE_PATH || './tmp/audio';
    if (!fs.existsSync(storagePath)) {
      fs.mkdirSync(storagePath, { recursive: true });
    }
    
    const podcastDir = path.join(storagePath, `podcast_${Date.now()}`);
    fs.mkdirSync(podcastDir, { recursive: true });
    
    const audioFiles = [];
    
    // Generate intro with fallback
    const introText = `Welcome to SecureScholar. Today we're exploring the latest research on ${topic}. We have ${segments.length} papers to cover, each with key insights and findings. Let's dive in.`;
    let introPath;
    try {
      introPath = await textToSpeech(introText, path.join(podcastDir, 'intro.mp3'));
    } catch (error) {
      console.log('TTS failed for intro, using fallback:', error.message);
      introPath = await textToSpeechFallback(introText, path.join(podcastDir, 'intro.mp3'));
    }
    audioFiles.push({ type: 'intro', path: introPath, text: introText });
    
    // Generate paper summaries with fallback
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const segmentText = `Paper ${i + 1}: ${segment.title}. ${segment.summary} Key points: ${segment.bullets.join('. ')}`;
      let segmentPath;
      try {
        segmentPath = await textToSpeech(segmentText, path.join(podcastDir, `segment_${i + 1}.mp3`));
      } catch (error) {
        console.log(`TTS failed for segment ${i + 1}, using fallback:`, error.message);
        segmentPath = await textToSpeechFallback(segmentText, path.join(podcastDir, `segment_${i + 1}.mp3`));
      }
      audioFiles.push({ 
        type: 'segment', 
        path: segmentPath, 
        text: segmentText,
        paperId: segment.id,
        title: segment.title
      });
    }
    
    // Generate outro with fallback
    const outroText = `That concludes our exploration of ${topic}. Thank you for listening to SecureScholar. Keep learning and stay curious about the latest research.`;
    let outroPath;
    try {
      outroPath = await textToSpeech(outroText, path.join(podcastDir, 'outro.mp3'));
    } catch (error) {
      console.log('TTS failed for outro, using fallback:', error.message);
      outroPath = await textToSpeechFallback(outroText, path.join(podcastDir, 'outro.mp3'));
    }
    audioFiles.push({ type: 'outro', path: outroPath, text: outroText });
    
    // Create playlist file
    const playlistPath = path.join(podcastDir, 'playlist.json');
    fs.writeFileSync(playlistPath, JSON.stringify(audioFiles, null, 2));
    
    console.log(`Podcast generated in: ${podcastDir}`);
    return { podcastDir, audioFiles, playlistPath };
    
  } catch (error) {
    console.error('Podcast generation error:', error);
    throw new Error(`Failed to generate podcast: ${error.message}`);
  }
}

export function getAudioUrl(audioPath) {
  // Convert file path to URL for serving
  const relativePath = path.relative(process.env.STORAGE_PATH || './tmp/audio', audioPath);
  return `/audio/${relativePath.replace(/\\/g, '/')}`;
}

export function cleanupOldAudio(maxAgeHours = 24) {
  try {
    const storagePath = process.env.STORAGE_PATH || './tmp/audio';
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convert to milliseconds
    
    function cleanupDirectory(dirPath) {
      if (!fs.existsSync(dirPath)) return;
      
      const files = fs.readdirSync(dirPath);
      
      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          cleanupDirectory(filePath);
          // Remove empty directory
          try {
            fs.rmdirSync(filePath);
          } catch (error) {
            // Directory not empty, skip
          }
        } else if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up old audio file: ${filePath}`);
        }
      }
    }
    
    cleanupDirectory(storagePath);
    console.log('Audio cleanup completed');
    
  } catch (error) {
    console.error('Audio cleanup error:', error);
  }
}

// Fallback function for demo when Gladia is not available
export async function textToSpeechFallback(text, outFileName) {
  console.log(`Fallback: Would convert text to speech: ${outFileName}`);
  
  // Create a dummy audio file for demo
  const storagePath = process.env.STORAGE_PATH || './tmp/audio';
  if (!fs.existsSync(storagePath)) {
    fs.mkdirSync(storagePath, { recursive: true });
  }
  
  const outPath = path.join(storagePath, outFileName);
  
  // Create a minimal MP3 file (just a placeholder)
  const dummyMp3 = Buffer.from([
    0xFF, 0xFB, 0x90, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
  ]);
  
  fs.writeFileSync(outPath, dummyMp3);
  
  console.log(`Fallback audio created: ${outPath}`);
  return outPath;
}
