const http = require('http');

// Test different routing scenarios
async function testRouting() {
  console.log('🔍 Testing HERA Routing Configuration...\n');

  const testCases = [
    {
      name: 'Main domain - Homepage',
      host: 'localhost:3000',
      path: '/',
      expectedStatus: 200
    },
    {
      name: 'Main domain - Test page',
      host: 'localhost:3000',
      path: '/test-page',
      expectedStatus: 200
    },
    {
      name: 'Main domain - Get Started',
      host: 'localhost:3000',
      path: '/get-started',
      expectedStatus: 200
    },
    {
      name: 'Subdomain - Homepage',
      host: 'salon.localhost:3000',
      path: '/',
      expectedStatus: 200
    },
    {
      name: 'Subdomain - Test page',
      host: 'salon.localhost:3000',
      path: '/test-page',
      expectedStatus: 200
    },
    {
      name: 'Subdomain - Get Started',
      host: 'salon.localhost:3000',
      path: '/get-started',
      expectedStatus: 200
    }
  ];

  for (const test of testCases) {
    await testRoute(test);
  }
}

function testRoute({ name, host, path, expectedStatus }) {
  return new Promise((resolve) => {
    const [hostname, port] = host.split(':');
    
    const options = {
      hostname: hostname,
      port: port || 3000,
      path: path,
      method: 'GET',
      headers: {
        'Host': host
      }
    };

    console.log(`📍 Testing: ${name}`);
    console.log(`   Host: ${host}`);
    console.log(`   Path: ${path}`);

    const req = http.request(options, (res) => {
      console.log(`   Status: ${res.statusCode} ${res.statusCode === expectedStatus ? '✅' : '❌'}`);
      console.log(`   Headers:`, res.headers.location || 'No redirect');
      console.log('');
      resolve();
    });

    req.on('error', (error) => {
      console.log(`   Error: ${error.message} ❌`);
      console.log('');
      resolve();
    });

    req.end();
  });
}

// Additional middleware debugging
function analyzeMiddleware() {
  console.log('\n📋 Middleware Analysis:\n');
  
  console.log('Common issues with Next.js middleware and subdomains:');
  console.log('1. Middleware runs on Edge Runtime - limited Node.js API');
  console.log('2. Subdomain routing needs special handling');
  console.log('3. Public routes must be explicitly defined');
  console.log('4. Static files bypass middleware by default');
  console.log('');
  
  console.log('Solutions:');
  console.log('1. Add all new pages to publicRoutes array');
  console.log('2. Consider using rewrites in next.config.js for subdomains');
  console.log('3. Use dynamic route handling for subdomain-specific content');
  console.log('4. Implement catch-all routes for flexible routing');
}

// Main execution
if (require.main === module) {
  testRouting().then(() => {
    analyzeMiddleware();
  });
}

module.exports = { testRouting, analyzeMiddleware };