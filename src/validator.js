import dotenv from 'dotenv';

dotenv.config();

export async function securityValidateQuery(query) {
  try {
    // For hackathon: mock or call Horizon3.ai Node API if available
    // In production, this would call Horizon3.ai API to test for:
    // - Host compromises
    // - Injection attacks
    // - Malicious query patterns
    // - Data exfiltration attempts
    
    // Basic validation for demo
    if (!query || typeof query !== 'string') {
      return { 
        ok: false, 
        reason: "Invalid query format" 
      };
    }
    
    if (query.length > 500) {
      return { 
        ok: false, 
        reason: "Query too long (max 500 characters)" 
      };
    }
    
    // Check for potentially malicious patterns
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /union\s+select/i,
      /drop\s+table/i,
      /exec\s*\(/i,
      /eval\s*\(/i
    ];
    
    for (const pattern of maliciousPatterns) {
      if (pattern.test(query)) {
        return { 
          ok: false, 
          reason: "Query contains potentially malicious content" 
        };
      }
    }
    
    // Mock Horizon3.ai integration
    // In production, replace this with actual API call:
    // const response = await fetch('https://api.horizon3.ai/validate', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.HORIZON3_API_KEY}`,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({ query, context: 'research_search' })
    // });
    
    // For demo purposes, always return success
    return { 
      ok: true, 
      validatedAt: new Date().toISOString(),
      securityLevel: 'medium',
      note: 'Horizon3.ai integration ready for production deployment'
    };
    
  } catch (error) {
    console.error('Security validation error:', error);
    return { 
      ok: false, 
      reason: `Security validation failed: ${error.message}` 
    };
  }
}

export async function validateScrapingTargets(targets) {
  // Validate the URLs and domains we're about to scrape
  const validDomains = [
    'scholar.google.com',
    'arxiv.org',
    'pubmed.ncbi.nlm.nih.gov',
    'ieeexplore.ieee.org',
    'dl.acm.org',
    'link.springer.com',
    'nature.com',
    'science.org'
  ];
  
  for (const target of targets) {
    try {
      const url = new URL(target);
      if (!validDomains.some(domain => url.hostname.includes(domain))) {
        return {
          ok: false,
          reason: `Invalid scraping target: ${target}`
        };
      }
    } catch (error) {
      return {
        ok: false,
        reason: `Invalid URL format: ${target}`
      };
    }
  }
  
  return { ok: true };
}
