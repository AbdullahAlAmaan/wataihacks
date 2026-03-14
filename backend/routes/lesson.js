/**
 * Lesson routes: start session, get next word, get conversation.
 */

const { Router } = require('express');
const lessonEngine = require('../services/lessonEngine');
const storage = require('../services/storage');
const { randomBytes } = require('crypto');

const router = Router();

function generateSessionId() {
  return randomBytes(12).toString('hex');
}

/**
 * POST /lesson/start
 * Body: { theme, goal_words?, days? }
 * Returns: { session_id, first_word }
 */
router.post('/start', (req, res) => {
  try {
    const { theme = 'grocery', goal_words = 20, days = 7 } = req.body || {};
    const sessionId = generateSessionId();
    storage.setProgress(sessionId, {
      theme,
      goal_words,
      words_completed: [],
      words_learned: 0,
      start_date: new Date().toISOString().slice(0, 10),
      streak_days: 0
    });
    const progress = storage.getProgress(sessionId);
    const next = lessonEngine.getNextWord(progress);
    res.json({
      session_id: sessionId,
      first_word: next ? next.word : null
    });
  } catch (err) {
    console.error('POST /lesson/start', err);
    res.status(500).json({ error: 'Failed to start lesson' });
  }
});

/**
 * GET /lesson/word?theme=grocery&session_id=abc123
 * Returns: { word, image, audio_url, sentence_examples } or 404 when no more words.
 */
router.get('/word', (req, res) => {
  try {
    const { theme, session_id } = req.query;
    if (!theme || !session_id) {
      return res.status(400).json({ error: 'theme and session_id required' });
    }
    const progress = storage.getProgress(session_id);
    if (!progress) {
      return res.status(404).json({ error: 'Session not found' });
    }
    const next = lessonEngine.getNextWord(progress);
    if (!next) {
      return res.status(404).json({ error: 'No more words', completed: true });
    }
    const payload = lessonEngine.getWordPayload(progress.theme, next.word);
    res.json(payload);
  } catch (err) {
    console.error('GET /lesson/word', err);
    res.status(500).json({ error: 'Failed to get word' });
  }
});

/**
 * GET /lesson/conversation?theme=grocery&variant=caregiver_emergency
 * Returns: { theme, turns: [{ speaker, line }] }
 */
router.get('/conversation', (req, res) => {
  try {
    const { theme = 'grocery', variant } = req.query;
    const conversation = lessonEngine.getConversation(theme, variant);
    res.json(conversation);
  } catch (err) {
    console.error('GET /lesson/conversation', err);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

module.exports = router;
