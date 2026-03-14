/**
 * Speech evaluation route — semantic appropriateness check.
 *
 * POST /speech/evaluate
 * Body: { worker_line, user_transcript, theme }
 * Returns: { appropriate, feedback, suggestions }
 */

const { Router } = require('express');
const router = Router();

// ─── Keyword-based fallback suggestions (when Gemini is unavailable) ──────────
function fallbackSuggestions(workerLine) {
  const line = (workerLine || '').toLowerCase();
  if (/sleep|slept|rest/.test(line))
    return ['I slept well, thank you.', 'I did not sleep well.', 'I am a little tired.'];
  if (/medicine|medication|pill|tablet/.test(line))
    return ['Yes, I took the medicine.', 'No, I forgot.', 'I need more medicine.'];
  if (/pain|hurt|ache/.test(line))
    return ['Yes, I have pain here.', 'It hurts a lot.', 'The pain is better now.'];
  if (/eat|food|hungry|breakfast|lunch|dinner/.test(line))
    return ['Yes, I am hungry.', 'No, thank you.', 'I want some food please.'];
  if (/water|drink|thirsty/.test(line))
    return ['Thank you for the water.', 'Yes, I am thirsty.', 'No, thank you.'];
  if (/blanket|cold|warm/.test(line))
    return ['Thank you, I feel warmer.', 'Yes please.', 'Thank you very much.'];
  if (/feel|better|okay|well/.test(line))
    return ['I feel better now.', 'I still feel sick.', 'I am okay, thank you.'];
  if (/help|assist/.test(line))
    return ['Yes, I need help.', 'No, I am okay.', 'Thank you for helping me.'];
  return ['Thank you.', 'Yes, please.', 'I need help.'];
}

// ─── Quick sanity check before calling Gemini ─────────────────────────────────
// If the response mentions completely unrelated domains, reject immediately.
const UNRELATED_PATTERNS = [
  /\b(university|college|school|student|waterloo|toronto|canada|usa|america|country|city|town)\b/i,
  /\b(soccer|football|basketball|sport|game|play|movie|film|music|song)\b/i,
  /\b(car|drive|traffic|airport|flight|airplane|train station)\b/i,
  /\b(computer|phone|internet|email|social media|instagram|facebook)\b/i,
];

function isObviouslyUnrelated(transcript) {
  return UNRELATED_PATTERNS.some((p) => p.test(transcript));
}

// ─── Route ────────────────────────────────────────────────────────────────────
router.post('/evaluate', async (req, res) => {
  const { worker_line, user_transcript, theme = 'caregiver' } = req.body;

  if (!worker_line || !user_transcript) {
    return res.status(400).json({ error: 'worker_line and user_transcript required' });
  }

  // Quick reject — no need to call Gemini for obviously unrelated answers
  if (isObviouslyUnrelated(user_transcript)) {
    return res.json({
      appropriate: false,
      feedback: "That doesn't seem related to the conversation. Try a reply about what was said.",
      suggestions: fallbackSuggestions(worker_line),
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[evaluate] No GEMINI_API_KEY — using keyword fallback');
    return res.json({
      appropriate: false,
      feedback: 'Try a response related to what was said.',
      suggestions: fallbackSuggestions(worker_line),
    });
  }

  try {
    const result = await evaluateWithGemini(worker_line, user_transcript, theme, apiKey);
    return res.json(result);
  } catch (err) {
    console.error('[evaluate] Gemini error:', err.message);
    return res.json({
      appropriate: false,
      feedback: 'Try a response related to what was said.',
      suggestions: fallbackSuggestions(worker_line),
    });
  }
});

// ─── Gemini evaluation ────────────────────────────────────────────────────────
async function evaluateWithGemini(workerLine, userTranscript, theme, apiKey) {
  const { GoogleGenAI } = require('@google/genai');
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a strict English conversation evaluator for a language learning app.

A caregiver said: "${workerLine}"
The English learner replied: "${userTranscript}"

YOUR JOB: Decide if the learner's reply makes sense AS A DIRECT RESPONSE to what was said.

MARK APPROPRIATE=TRUE only if the reply:
- Acknowledges or answers what the caregiver said
- Is about health, daily care, feelings, or needs
- Makes logical sense in a care conversation
- Grammar mistakes are fine — meaning is what matters

MARK APPROPRIATE=FALSE if the reply:
- Mentions places, cities, countries, schools, universities
- Is about sports, technology, entertainment, unrelated topics
- Has nothing to do with what the caregiver asked
- Would confuse a real caregiver completely

CONCRETE EXAMPLES:
Worker: "How did you sleep?" → "I slept okay" = APPROPRIATE
Worker: "How did you sleep?" → "I'm in Waterloo" = NOT APPROPRIATE (city name, unrelated)
Worker: "How did you sleep?" → "not good, I have pain" = APPROPRIATE
Worker: "Did you take medicine?" → "I like football" = NOT APPROPRIATE
Worker: "Here is your water." → "Thank you" = APPROPRIATE
Worker: "Here is your water." → "I need more water" = APPROPRIATE

Be STRICT. When in doubt, mark false and give helpful suggestions.

Respond with ONLY valid JSON (no markdown):
{"appropriate":true,"feedback":"short sentence","suggestions":[]}

If not appropriate, add 2-3 simple suggestions the learner could say instead.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });

  const raw =
    response.text ??
    response?.candidates?.[0]?.content?.parts?.[0]?.text ??
    '';

  console.log('[evaluate] worker:', workerLine, '| heard:', userTranscript, '| gemini:', raw.slice(0, 120));

  const jsonMatch = raw.match(/\{[\s\S]*?\}/);
  if (!jsonMatch) throw new Error('No JSON in Gemini response: ' + raw.slice(0, 200));

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    appropriate: Boolean(parsed.appropriate),
    feedback: String(parsed.feedback || ''),
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [],
  };
}

module.exports = router;
