const https = require('https');

const data = JSON.stringify({
  messaging_product: 'whatsapp',
  to: '447515668004',
  type: 'text',
  text: {
    body: '🎉 Production Test: The booking system is now LIVE! Try sending "BOOK" to start an appointment booking.'
  }
});

const options = {
  hostname: 'graph.facebook.com',
  port: 443,
  path: '/v21.0/712631301940690/messages',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': 'Bearer EAAkj2JA2DYEBPQeZC1D0my0wZClW6uw3VBAANDpFzm6B7jr91bKJCnvhg9J2U0kAZAX3ZCJAek6K6NekOPXd5paBgN8Au3EOV0O6ob1pZChsDunIxxtAmr83MDSHXbMxA1hLo58zujSXPKhkZCyATNIZAa39i0l3h2PLRHJE2fzB5ZAz4UEaNwTH6fTOL6iUxAZDZD'
  }
};

const req = https.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', responseData);
    const parsed = JSON.parse(responseData);
    if (parsed.messages) {
      console.log('✅ Message sent successfully!');
      console.log('Message ID:', parsed.messages[0].id);
    } else {
      console.log('❌ Error sending message');
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();