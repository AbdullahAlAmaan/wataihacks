/**
 * Voice-first ESL Learning API — Express server.
 * Routes: /lesson/*, /progress/*, /speech/check, /photo/identify
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const lessonRoutes = require('./routes/lesson');
const progressRoutes = require('./routes/progress');
const speechRoutes = require('./routes/speech');
const photoRoutes = require('./routes/photo');
const ttsRoutes = require('./routes/tts');
const evaluateRoutes = require('./routes/evaluate');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // base64 audio/image can be several MB
// Serve sample.jpg (and any other files in the backend root) as static assets
app.use('/static', express.static(path.join(__dirname)));

app.use('/lesson', lessonRoutes);
app.use('/progress', progressRoutes);
app.use('/speech', speechRoutes);
app.use('/photo', photoRoutes);
app.use('/tts', ttsRoutes);
app.use('/speech', evaluateRoutes);

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'wataihacks-api' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
});
