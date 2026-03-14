/**
 * Photo route: receive base64 image JSON, process with Gemini Vision, return label + quiz hint.
 *
 * POST /photo/identify
 * JSON body: { image_base64, mime_type, session_id }
 */

const { Router } = require('express');

const router = Router();

/**
 * POST /photo/identify
 *
 * JSON body:
 *   - image_base64 {string}  Base64-encoded image (may include data URL prefix)
 *   - mime_type    {string}  e.g. "image/jpeg" (default: image/jpeg)
 *   - session_id   {string}  (optional)
 *
 * Returns: { label, word, sentence_example, quiz_prompt, audio_url, success }
 */
router.post('/identify', async (req, res) => {
  try {
    const { image_base64, mime_type = 'image/jpeg' } = req.body;

    if (!image_base64) {
      return res.status(400).json({ error: 'Missing required field: image_base64' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return res.status(503).json({
        error: 'Photo identification unavailable',
        code: 'GEMINI_API_KEY_NOT_SET',
      });
    }

    // Strip data URL prefix if present
    const base64Data = image_base64.replace(/^data:[^;]+;base64,/, '');

    const result = await identifyWithGemini(base64Data, mime_type, apiKey);
    return res.json(result);
  } catch (err) {
    console.error('POST /photo/identify', err);

    // Handle Gemini quota errors explicitly so the frontend can show a friendly message
    const status = err.status || err.code || err.statusCode;
    const message = err.message || '';

    if (status === 429 || message.includes('RESOURCE_EXHAUSTED') || message.includes('quota')) {
      return res.status(503).json({
        error: 'Photo feature temporarily unavailable due to Gemini API quota limits. Please try again later or use the word/sentence lessons.',
        code: 'GEMINI_QUOTA_EXCEEDED',
      });
    }

    return res.status(500).json({ error: err.message || 'Failed to identify image' });
  }
});

async function identifyWithGemini(base64, mimeType, apiKey) {
  const { GoogleGenAI } = require('@google/genai');
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Look at this image. The user is a low-literacy English learner (caregiver context).
Identify the main object in one simple English word.
Give one short simple sentence using that word that a caregiver might say.
Optionally give a one-line description of what you see.
Reply in JSON only, no other text: { "word": "...", "sentence": "...", "description": "..." }`,
          },
          {
            inlineData: {
              data: base64,
              mimeType,
            },
          },
        ],
      },
    ],
  });

  const text = response.text || '';

  if (!text) {
    throw new Error('No response from Gemini API');
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid response format from Gemini API: ' + text);
  }

  const parsed = JSON.parse(jsonMatch[0]);
  const word = parsed.word || 'object';
  const sentence = parsed.sentence || `I see ${word}.`;

  const apiBase = process.env.API_BASE_URL || 'http://localhost:4000';

  return {
    label: word,
    word,
    sentence_example: sentence,
    quiz_prompt: sentence,
    audio_url: `${apiBase}/tts/${encodeURIComponent(word)}`,
    success: true,
  };
}

module.exports = router;
