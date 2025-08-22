// 404 Resource Debug Tool
// Run this in browser console to track down 404 errors

console.log('🔍 404 RESOURCE DEBUG TOOL LOADED');

// Track all failed requests
const failed404Requests = [];
let monitoring = false;

window.start404Monitoring = function() {
  if (monitoring) {
    console.log('⚠️ 404 monitoring already active');
    return;
  }
  
  console.log('🔍 Starting 404 resource monitoring...');
  monitoring = true;
  
  // Override fetch to catch 404s
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const [url, options] = args;
    
    try {
      const response = await originalFetch(...args);
      
      if (response.status === 404) {
        const failedRequest = {
          url: url,
          method: options?.method || 'GET',
          timestamp: new Date().toISOString(),
          stack: new Error().stack
        };
        
        failed404Requests.push(failedRequest);
        
        console.group('❌ 404 RESOURCE FOUND');
        console.log('URL:', url);
        console.log('Method:', failedRequest.method);
        console.log('Time:', failedRequest.timestamp);
        console.log('Stack trace:', failedRequest.stack);
        console.groupEnd();
      }
      
      return response;
    } catch (error) {
      console.error('💥 Fetch error for:', url, error);
      throw error;
    }
  };
  
  // Monitor image loading errors
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName) {
    const element = originalCreateElement.call(document, tagName);
    
    if (tagName.toLowerCase() === 'img') {
      element.addEventListener('error', function(e) {
        const failedRequest = {
          url: this.src,
          method: 'GET',
          timestamp: new Date().toISOString(),
          type: 'image',
          element: this
        };
        
        failed404Requests.push(failedRequest);
        
        console.group('❌ 404 IMAGE FOUND');
        console.log('Image URL:', this.src);
        console.log('Alt text:', this.alt);
        console.log('Element:', this);
        console.groupEnd();
      });
    }
    
    return element;
  };
  
  // Monitor script loading errors
  window.addEventListener('error', function(e) {
    if (e.target && (e.target.tagName === 'SCRIPT' || e.target.tagName === 'LINK')) {
      const failedRequest = {
        url: e.target.src || e.target.href,
        method: 'GET',
        timestamp: new Date().toISOString(),
        type: e.target.tagName.toLowerCase(),
        element: e.target
      };
      
      failed404Requests.push(failedRequest);
      
      console.group(`❌ 404 ${e.target.tagName} FOUND`);
      console.log('URL:', failedRequest.url);
      console.log('Element:', e.target);
      console.groupEnd();
    }
  }, true);
  
  console.log('✅ 404 monitoring active. Failed requests will be logged.');
  console.log('View failed requests with: window.get404Report()');
};

window.stop404Monitoring = function() {
  monitoring = false;
  console.log('🛑 404 monitoring stopped');
  console.log(`📊 Captured ${failed404Requests.length} failed requests`);
  return failed404Requests;
};

window.get404Report = function() {
  console.group('📊 404 RESOURCE REPORT');
  
  if (failed404Requests.length === 0) {
    console.log('✅ No 404 errors detected');
    console.groupEnd();
    return [];
  }
  
  console.log(`❌ Found ${failed404Requests.length} failed requests:`);
  
  // Group by type
  const byType = failed404Requests.reduce((acc, req) => {
    const type = req.type || 'fetch';
    acc[type] = acc[type] || [];
    acc[type].push(req);
    return acc;
  }, {});
  
  Object.keys(byType).forEach(type => {
    console.group(`${type.toUpperCase()} (${byType[type].length})`);
    byType[type].forEach(req => {
      console.log(`  ${req.url} (${req.timestamp})`);
    });
    console.groupEnd();
  });
  
  // Common patterns
  const urlPatterns = failed404Requests.map(req => {
    try {
      const url = new URL(req.url, window.location.origin);
      return url.pathname;
    } catch {
      return req.url;
    }
  });
  
  const commonPatterns = urlPatterns.reduce((acc, pattern) => {
    acc[pattern] = (acc[pattern] || 0) + 1;
    return acc;
  }, {});
  
  console.log('\n📋 Common failing patterns:');
  Object.entries(commonPatterns)
    .sort(([,a], [,b]) => b - a)
    .forEach(([pattern, count]) => {
      console.log(`  ${pattern} (${count}x)`);
    });
  
  console.groupEnd();
  
  // Store for inspection
  window.failed404Requests = failed404Requests;
  
  return failed404Requests;
};

// Check for common 404 patterns
window.check404Patterns = function() {
  console.group('🔍 CHECKING COMMON 404 PATTERNS');
  
  const commonIssues = [
    {
      name: 'Missing favicon',
      test: () => !document.querySelector('link[rel="icon"]'),
      fix: 'Add <link rel="icon" href="/favicon.ico"> to your <head>'
    },
    {
      name: 'Missing manifest',
      test: () => document.querySelector('link[rel="manifest"]') && 
                  !document.querySelector('link[rel="manifest"][href]'),
      fix: 'Ensure manifest.json exists in your public folder'
    },
    {
      name: 'Broken image sources',
      test: () => {
        const images = Array.from(document.querySelectorAll('img'));
        return images.some(img => img.src.includes('undefined') || img.src === '');
      },
      fix: 'Check image src attributes for undefined values'
    },
    {
      name: 'Missing CSS/JS files',
      test: () => {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        const links = Array.from(document.querySelectorAll('link[href]'));
        return [...scripts, ...links].some(el => {
          const url = el.src || el.href;
          return url.includes('undefined') || url === '';
        });
      },
      fix: 'Check script and link tags for invalid URLs'
    }
  ];
  
  commonIssues.forEach(issue => {
    const hasIssue = issue.test();
    console.log(`${hasIssue ? '❌' : '✅'} ${issue.name}`);
    if (hasIssue) {
      console.log(`   Fix: ${issue.fix}`);
    }
  });
  
  console.groupEnd();
};

// Auto-start monitoring
console.log(`
🔍 404 RESOURCE DEBUG TOOLS READY

Commands:
- start404Monitoring()    // Start tracking 404 errors
- stop404Monitoring()     // Stop tracking and get summary
- get404Report()          // View current 404 report
- check404Patterns()      // Check for common 404 causes

Auto-starting monitoring...
`);

// Auto-start if in development
if (window.location.hostname === 'localhost' || window.location.hostname.includes('local')) {
  start404Monitoring();
  
  // Auto-check common patterns
  setTimeout(() => {
    check404Patterns();
  }, 2000);
}