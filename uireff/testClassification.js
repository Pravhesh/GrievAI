const http = require('http');

/**
 * Simple Node script to test the local AI classification endpoint.
 *
 * Usage:
 *   node testClassification.js "Your complaint text here"
 */
const text = process.argv.slice(2).join(' ') || 'The water supply in my area has been disrupted for over a week.';

const postData = JSON.stringify({ text });

const options = {
  hostname: 'localhost',
  port: 8000,
  path: '/classify',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
  },
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log('Classification result:', parsed);
    } catch (err) {
      console.error('Non-JSON response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

// Write data to request body
req.write(postData);
req.end();
