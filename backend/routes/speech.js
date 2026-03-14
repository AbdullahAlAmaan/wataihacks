/**
 * Speech Check Route
 * Member 4 — AI Integration Specialist
 *
 * POST /speech/check
 * Receives a recorded audio buffer from the frontend,
 * transcribes it using ElevenLabs STT, and checks if it
 * matches the expected sentence using fuzzy matching.
 *
 * Multer is used to handle multipart/form-data audio uploads.
 */

const express = require('express');
const multer = require('multer');
const stringSimilarity = require('string-similarity');
const { transcribeAudio } = require('../services/stt');

const router = express.Router();
// Store audio in memory (buffer), not disk
const upload = multer({ storage: multer.memoryStorage() });

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
 * Multipart form fields:
 *   - audio   {File}   The recorded audio blob (webm/wav/mp3)
 *   - expected {string} The sentence the user was supposed to say
 *
 * Response:
 * {
 *   "transcript": "i give medicine",
 *   "correct": true,
 *   "similarity": 0.92
 * }
 */
router.post('/check', upload.single('audio'), async (req, res) => {
    try {
        const expected = req.body.expected;

        if (!expected) {
            return res.status(400).json({ error: 'Missing required field: expected' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Missing audio file' });
        }

        // 1. Transcribe the uploaded audio with ElevenLabs STT
        const transcript = await transcribeAudio(req.file.buffer, req.file.originalname || 'audio.webm');

        // 2. Fuzzy-match the transcript against what was expected
        //    Score >= 0.75 counts as correct (forgiving for non-native speakers)
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
