/**
 * Voice-first ESL Learning API — Express server.
 * Routes: /lesson/*, /progress/*, /speech/check, /photo/identify
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const lessonRoutes = require('./routes/lesson');
const progressRoutes = require('./routes/progress');
const speechRoutes = require('./routes/speech');
const photoRoutes = require('./routes/photo');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

app.use('/lesson', lessonRoutes);
app.use('/progress', progressRoutes);
app.use('/speech', speechRoutes);
app.use('/photo', photoRoutes);

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
