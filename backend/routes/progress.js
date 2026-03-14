/**
 * Progress routes: save practice attempt, get progress by session.
 */

const { Router } = require('express');
const storage = require('../services/storage');

const router = Router();

/**
 * POST /progress/save
 * Body: { session_id, word, sentence?, correct, stage }
 * Optionally marks word as completed when stage is 3 (conversation done for that word).
 */
router.post('/save', (req, res) => {
  try {
    const { session_id, word, sentence, correct, stage } = req.body || {};
    if (!session_id || word === undefined || correct === undefined || stage === undefined) {
      return res.status(400).json({ error: 'session_id, word, correct, and stage required' });
    }
    storage.appendPracticeLog({
      session_id,
      word,
      sentence: sentence || null,
      stage: Number(stage),
      correct: Boolean(correct)
    });
    if (stage === 3 && correct) {
      storage.markWordCompleted(session_id, word);
    }
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('POST /progress/save', err);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

/**
 * GET /progress/:session_id
 * Returns: { words_learned, goal_words, theme, streak_days, words_completed?, start_date }
 */
router.get('/:session_id', (req, res) => {
  try {
    const { session_id } = req.params;
    const progress = storage.getProgress(session_id);
    if (!progress) {
      return res.status(404).json({ error: 'Session not found' });
    }
    res.json({
      session_id: progress.session_id,
      words_learned: progress.words_learned,
      goal_words: progress.goal_words,
      theme: progress.theme,
      streak_days: progress.streak_days,
      start_date: progress.start_date,
      words_completed: progress.words_completed || []
    });
  } catch (err) {
    console.error('GET /progress/:session_id', err);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

module.exports = router;
