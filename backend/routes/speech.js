/**
 * Speech check route: validate transcript against expected text (fuzzy match).
 * Frontend sends expected + transcript (from ElevenLabs STT or mock).
 */

const { Router } = require('express');

const router = Router();

const SIMILARITY_THRESHOLD = 0.75;

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

function similarity(a, b) {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (!na || !nb) return 0;
  const wordsA = na.split(' ');
  const wordsB = nb.split(' ');
  let matches = 0;
  for (const w of wordsA) {
    if (wordsB.includes(w)) matches++;
  }
  const maxWords = Math.max(wordsA.length, wordsB.length, 1);
  return matches / maxWords;
}

/**
 * POST /speech/check
 * Body: { expected: string, transcript: string }
 * Returns: { correct: boolean, similarity: number }
 */
router.post('/check', (req, res) => {
  try {
    const { expected, transcript } = req.body || {};
    const score = similarity(expected || '', transcript || '');
    const correct = score >= SIMILARITY_THRESHOLD;
    res.json({ correct, similarity: Math.round(score * 100) / 100 });
  } catch (err) {
    console.error('POST /speech/check', err);
    res.status(500).json({ error: 'Failed to check speech' });
  }
});

module.exports = router;
