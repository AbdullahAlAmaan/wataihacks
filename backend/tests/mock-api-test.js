/**
 * Sample mock test for the backend API.
 * Run: npm test  (with server running on PORT 8000)
 * Or: node tests/mock-api-test.js
 *
 * Requires GEMINI_API_KEY to be set (in .env or environment); tests fail otherwise.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const BASE_URL = process.env.API_URL || 'http://localhost:8000';
const fs = require('fs');

if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY.trim() === '') {
  console.error('Error: GEMINI_API_KEY is not set. Set it in backend/.env to run tests.');
  process.exit(1);
}

async function request(method, path, body = null) {
  const opts = { method, headers: {} };
  if (body && (method === 'POST' || method === 'PUT')) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = text;
  }
  return { status: res.status, data };
}

async function uploadImageFile(apiPath, filePath) {
  try {
    // Read file as buffer
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    
    // Create boundary for multipart/form-data
    const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
    
    // Build multipart body manually
    const parts = [];
    parts.push(`--${boundary}\r\n`);
    parts.push(`Content-Disposition: form-data; name="image"; filename="${fileName}"\r\n`);
    parts.push(`Content-Type: image/jpeg\r\n\r\n`);
    
    const header = Buffer.from(parts.join(''));
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, fileBuffer, footer]);
    
    const res = await fetch(`${BASE_URL}${apiPath}`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length.toString()
      },
      body: body
    });
    
    const text = await res.text();
    console.log('Upload response text:', text);
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (_) {
      data = text;
    }
    return { status: res.status, data };
  } catch (error) {
    console.error('    Upload error:', error.message);
    throw error;
  }
}

async function uploadImageUrl(path, imageUrl) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl })
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = text;
  }
  return { status: res.status, data };
}

async function downloadImage(url, filepath) {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(filepath, Buffer.from(buffer));
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  const assert = (name, ok, detail) => {
    if (ok) {
      passed++;
      console.log(`  ✓ ${name}`);
    } else {
      failed++;
      console.log(`  ✗ ${name}`);
      if (detail) console.log(`    ${detail}`);
    }
  };

  console.log('\n--- Health ---');
  try {
    const health = await request('GET', '/health');
    assert('GET /health returns 200', health.status === 200, `status ${health.status}`);
    assert('GET /health returns ok', health.data?.ok === true);
  } catch (e) {
    assert('GET /health reachable', false, e.message);
  }

  console.log('\n--- Lesson start ---');
  try {
    const start = await request('POST', '/lesson/start', { theme: 'caregiver', goal_words: 5 });
    assert('POST /lesson/start returns 200', start.status === 200, `status ${start.status}`);
    assert('session_id present', !!start.data?.session_id);
    assert('first_word present', start.data?.first_word != null);
  } catch (e) {
    assert('POST /lesson/start', false, e.message);
  }

  let sessionId = null;
  try {
    const start = await request('POST', '/lesson/start', { theme: 'grocery' });
    sessionId = start.data?.session_id;
  } catch (_) {}

  console.log('\n--- Lesson word ---');
  if (sessionId) {
    try {
      const word = await request('GET', `/lesson/word?theme=grocery&session_id=${sessionId}`);
      assert('GET /lesson/word returns 200', word.status === 200);
      assert('word payload has word', !!word.data?.word);
      assert('sentence_examples array', Array.isArray(word.data?.sentence_examples));
    } catch (e) {
      assert('GET /lesson/word', false, e.message);
    }
  } else {
    console.log('  (skipped: no session_id)');
  }

  console.log('\n--- Conversation ---');
  try {
    const conv = await request('GET', '/lesson/conversation?theme=caregiver');
    assert('GET /lesson/conversation returns 200', conv.status === 200);
    assert('turns array', Array.isArray(conv.data?.turns));
    assert('turns have speaker and line', conv.data?.turns?.every(t => t.speaker && t.line));
  } catch (e) {
    assert('GET /lesson/conversation', false, e.message);
  }

  console.log('\n--- Progress save & get ---');
  if (sessionId) {
    try {
      const save = await request('POST', '/progress/save', {
        session_id: sessionId,
        word: 'bread',
        sentence: 'I buy bread',
        correct: true,
        stage: 2
      });
      assert('POST /progress/save returns 201', save.status === 201);
      const progress = await request('GET', `/progress/${sessionId}`);
      assert('GET /progress/:id returns 200', progress.status === 200);
      assert('progress has words_learned', typeof progress.data?.words_learned === 'number');
      assert('progress has goal_words', typeof progress.data?.goal_words === 'number');
    } catch (e) {
      assert('Progress routes', false, e.message);
    }
  } else {
    console.log('  (skipped: no session_id)');
  }

  console.log('\n--- Speech check ---');
  try {
    const check = await request('POST', '/speech/check', {
      expected: 'I buy bread',
      transcript: 'I buy bread'
    });
    assert('POST /speech/check returns 200', check.status === 200);
    assert('correct true for exact match', check.data?.correct === true);
    const fuzzy = await request('POST', '/speech/check', {
      expected: 'I need medicine',
      transcript: 'I need medicin'
    });
    assert('fuzzy match acceptable', fuzzy.data?.similarity >= 0.5);
  } catch (e) {
    assert('POST /speech/check', false, e.message);
  }

  console.log('\n--- Photo identify (Gemini Vision) - File Upload ---');
  try {
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    
    if (!fs.existsSync(testImagePath)) {
      console.log('    Downloading test image from https://picsum.photos/200...');
      await downloadImage('https://picsum.photos/200', testImagePath);
      console.log('    Test image downloaded successfully');
    }
    
    console.log('    Uploading image to /photo/identify...');
    const photo = await uploadImageFile('/photo/identify', testImagePath);
    
    console.log('\n    === GEMINI API RESPONSE ===');
    console.log(JSON.stringify(photo.data, null, 2));
    console.log('    === END RESPONSE ===\n');
    
    assert('POST /photo/identify (file) returns 200', photo.status === 200, `status ${photo.status}`);
    assert('photo response has label', !!photo.data?.label);
    assert('photo response has sentence_example', !!photo.data?.sentence_example);
    assert('photo response has success', photo.data?.success === true);
    assert('photo uses real API (no mock)', !photo.data?.mock, 'GEMINI_API_KEY must be set on server');
    if (photo.data?.label) console.log(`    Identified: ${photo.data.label}`);
    if (photo.data?.description) console.log(`    Description: ${photo.data.description}`);
  } catch (e) {
    assert('POST /photo/identify (file)', false, e.message);
  }

  console.log('\n--- Photo identify (Gemini Vision) - second request ---');
  try {
    const testImagePath = path.join(__dirname, 'test-image-url.jpg');
    await downloadImage('https://picsum.photos/200', testImagePath);
    
    console.log('    Uploading second image to /photo/identify...');
    const photoUrl = await uploadImageFile('/photo/identify', testImagePath);
    
    console.log('\n    === GEMINI API RESPONSE (second) ===');
    console.log(JSON.stringify(photoUrl.data, null, 2));
    console.log('    === END RESPONSE ===\n');
    
    assert('POST /photo/identify (second) returns 200', photoUrl.status === 200, `status ${photoUrl.status}`);
    assert('photo response has label', !!photoUrl.data?.label);
    assert('photo response has sentence_example', !!photoUrl.data?.sentence_example);
    assert('photo response has success', photoUrl.data?.success === true);
    assert('photo (second) uses real API (no mock)', !photoUrl.data?.mock, 'GEMINI_API_KEY must be set on server');
    if (fs.existsSync(testImagePath)) fs.unlinkSync(testImagePath);
  } catch (e) {
    assert('POST /photo/identify (second)', false, e.message);
  }

  console.log('\n--- Summary ---');
  console.log(`  Passed: ${passed}, Failed: ${failed}`);
  
  // Give a small delay before exit to allow any pending operations to complete
  setTimeout(() => {
    process.exit(failed > 0 ? 1 : 0);
  }, 100);
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  setTimeout(() => {
    process.exit(1);
  }, 100);
});
