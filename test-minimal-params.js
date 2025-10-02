const http = require('http');

const data = JSON.stringify({
  p_organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
  p_entity_type: 'product_category',
  p_entity_name: 'Minimal Test Category',
  p_entity_code: 'CAT-MINIMAL-' + Date.now(),
  p_smart_code: 'HERA.SALON.PROD.CATEGORY.FIELD.V1'
  // No p_status, no p_entity_description - minimal params only
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/universal/entities',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('✅ Success! Response:', body);
  });
});

req.on('error', (e) => console.error('❌ Error:', e.message));
req.write(data);
req.end();
