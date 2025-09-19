// test-horizon3.js - Test Horizon3.ai API integration
import dotenv from 'dotenv';
import { securityValidateQuery } from './src/validator.js';

dotenv.config();

async function testHorizon3() {
  console.log('🧪 Testing Horizon3.ai integration...');
  
  const testQueries = [
    'machine learning healthcare', // Normal query
    '<script>alert("xss")</script>', // Malicious query
    'artificial intelligence research', // Normal query
    'SELECT * FROM users; DROP TABLE users;', // SQL injection
  ];
  
  for (const query of testQueries) {
    console.log(`\n📝 Testing query: "${query}"`);
    try {
      const result = await securityValidateQuery(query);
      console.log(`✅ Result:`, {
        ok: result.ok,
        securityLevel: result.securityLevel,
        note: result.note
      });
    } catch (error) {
      console.error(`❌ Error:`, error.message);
    }
  }
}

testHorizon3().catch(console.error);
