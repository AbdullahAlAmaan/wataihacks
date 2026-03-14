/**
 * Speech Check Route
 *
 * POST /speech/check
 * Receives audio as base64 JSON from the frontend,
 * transcribes it using ElevenLabs STT, and checks if it
 * matches the expected sentence using fuzzy matching.
 */

const express = require('express');
const stringSimilarity = require('string-similarity');
const { transcribeAudio } = require('../services/stt');

const router = express.Router();

/**
 * Normalises a string for comparison:
 * lowercase, strip punctuation, trim whitespace.
 */
function normalise(str) {
    return str.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

/**
 * POST /speech/check
 *
 * JSON body:
 *   - audio_base64 {string}  Base64-encoded audio (may include data URL prefix)
 *   - expected     {string}  The sentence the user was supposed to say
 *   - session_id   {string}  (optional) session identifier
 *
 * Response:
 * {
 *   "transcript": "i give medicine",
 *   "correct": true,
 *   "similarity": 0.92
 * }
 */
router.post('/check', async (req, res) => {
    try {
        const { expected, audio_base64 } = req.body;

        if (!expected) {
            return res.status(400).json({ error: 'Missing required field: expected' });
        }

        if (!audio_base64) {
            return res.status(400).json({ error: 'Missing required field: audio_base64' });
        }

        // Strip data URL prefix if present (e.g. "data:audio/webm;base64,...")
        const base64Data = audio_base64.replace(/^data:[^;]+;base64,/, '');
        const audioBuffer = Buffer.from(base64Data, 'base64');

        // Transcribe the audio with ElevenLabs STT
        const transcript = await transcribeAudio(audioBuffer, 'audio.webm');

        // Fuzzy-match: score >= 0.75 counts as correct (forgiving for non-native speakers)
        const similarity = stringSimilarity.compareTwoStrings(
            normalise(transcript),
            normalise(expected)
        );

        const correct = similarity >= 0.75;

        return res.json({ transcript, correct, similarity: parseFloat(similarity.toFixed(2)) });
    } catch (err) {
        console.error('[speech/check] Error:', err.message);
        return res.status(500).json({ error: 'Speech check failed', details: err.message });
    }
});

module.exports = router;
