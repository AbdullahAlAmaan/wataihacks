/**
 * TTS route: GET /tts/:text
 * Streams ElevenLabs TTS audio as MP3 for any given text.
 * The frontend constructs URLs like: http://localhost:4000/tts/bread
 */

const { Router } = require('express');
const { generateSpeech } = require('../services/elevenlabs');

const router = Router();

router.get('/:text', async (req, res) => {
  try {
    const text = decodeURIComponent(req.params.text);
    if (!text || text.length > 300) {
      return res.status(400).json({ error: 'Invalid text' });
    }
    const audioBuffer = await generateSpeech(text);
    res.set('Content-Type', 'audio/mpeg');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(audioBuffer);
  } catch (err) {
    console.error('[tts] Error:', err.message);
    res.status(500).json({ error: 'TTS generation failed' });
  }
});

module.exports = router;
