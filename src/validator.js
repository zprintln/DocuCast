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
    
    // Horizon3.ai integration
    if (process.env.HORIZON3_API_KEY && process.env.HORIZON3_API_KEY !== 'your_horizon3_api_key') {
      try {
        const response = await fetch('https://api.horizon3.ai/validate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HORIZON3_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            query, 
            context: 'research_search',
            timestamp: new Date().toISOString()
          })
        });
        
        if (!response.ok) {
          throw new Error(`Horizon3.ai API error: ${response.status}`);
        }
        
        const result = await response.json();
        return {
          ok: result.valid || result.safe,
          validatedAt: new Date().toISOString(),
          securityLevel: result.risk_level || 'medium',
          note: result.message || 'Validated by Horizon3.ai',
          details: result
        };
        
      } catch (error) {
        console.error('Horizon3.ai validation error:', error);
        // Fall back to basic validation if API fails
        return { 
          ok: true, 
          validatedAt: new Date().toISOString(),
          securityLevel: 'medium',
          note: 'Horizon3.ai unavailable, using basic validation'
        };
      }
    }
    
    // Fallback for demo or missing API key
    return { 
      ok: true, 
      validatedAt: new Date().toISOString(),
      securityLevel: 'medium',
      note: 'Using basic validation (Horizon3.ai not configured)'
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
