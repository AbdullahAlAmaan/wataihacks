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
 * Two modes:
 * 1) JSON body: { expected, transcript } — use transcript as-is (e.g. for tests).
 * 2) Multipart form: audio (file) + expected (string) — transcribe via ElevenLabs STT then match.
 *
 * Response: { transcript, correct, similarity }
 */
const maybeMulter = (req, res, next) => {
    if (req.is('multipart/form-data')) {
        return upload.single('audio')(req, res, next);
    }
    next();
};

router.post('/check', maybeMulter, async (req, res) => {
    try {
        const expected = req.body?.expected;

        if (!expected) {
            return res.status(400).json({ error: 'Missing required field: expected' });
        }

        let transcript;

        if (req.body.transcript != null && req.body.transcript !== '' && !req.file) {
            // JSON mode: use provided transcript (e.g. tests)
            transcript = String(req.body.transcript);
        } else if (req.file) {
            // Multipart mode: transcribe uploaded audio
            transcript = await transcribeAudio(req.file.buffer, req.file.originalname || 'audio.webm');
        } else {
            return res.status(400).json({ error: 'Missing audio file or transcript' });
        }

        const similarity = stringSimilarity.compareTwoStrings(
            normalise(transcript),
            normalise(expected)
        );
        const correct = similarity >= 0.75;

        return res.json({
            transcript: transcript.trim(),
            correct,
            similarity: parseFloat(similarity.toFixed(2))
        });
    } catch (err) {
        console.error('[speech/check] Error:', err.message);
        return res.status(500).json({ error: 'Speech check failed', details: err.message });
    }
});

module.exports = router;
