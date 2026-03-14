/**
 * Simple JSON file storage for UserProgress and PracticeLog (MVP).
 * Can be swapped for Supabase later.
 */

const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');
const PRACTICE_LOG_FILE = path.join(DATA_DIR, 'practice_log.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readProgress() {
  ensureDataDir();
  if (!fs.existsSync(PROGRESS_FILE)) return {};
  return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
}

function writeProgress(data) {
  ensureDataDir();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function readPracticeLog() {
  ensureDataDir();
  if (!fs.existsSync(PRACTICE_LOG_FILE)) return [];
  return JSON.parse(fs.readFileSync(PRACTICE_LOG_FILE, 'utf8'));
}

function writePracticeLog(logs) {
  ensureDataDir();
  fs.writeFileSync(PRACTICE_LOG_FILE, JSON.stringify(logs, null, 2), 'utf8');
}

/**
 * Get or create progress for a session.
 * @param {string} sessionId
 * @returns {object|null} UserProgress or null
 */
function getProgress(sessionId) {
  const all = readProgress();
  return all[sessionId] || null;
}

/**
 * Create or update progress for a session.
 * @param {string} sessionId
 * @param {object} data - { goal_words, theme, start_date, streak_days, words_completed }
 */
function setProgress(sessionId, data) {
  const all = readProgress();
  const existing = all[sessionId] || {};
  all[sessionId] = {
    session_id: sessionId,
    goal_words: data.goal_words ?? existing.goal_words ?? 20,
    words_learned: data.words_learned ?? existing.words_learned ?? 0,
    words_completed: data.words_completed ?? existing.words_completed ?? [],
    theme: data.theme ?? existing.theme ?? 'grocery',
    start_date: data.start_date ?? existing.start_date ?? new Date().toISOString().slice(0, 10),
    streak_days: data.streak_days ?? existing.streak_days ?? 0
  };
  writeProgress(all);
  return all[sessionId];
}

/**
 * Mark a word as completed for the session and bump words_learned.
 * @param {string} sessionId
 * @param {string} word
 */
function markWordCompleted(sessionId, word) {
  const all = readProgress();
  const p = all[sessionId];
  if (!p) return null;
  const completed = p.words_completed || [];
  if (completed.includes(word)) return p;
  p.words_completed = [...completed, word];
  p.words_learned = p.words_completed.length;
  writeProgress(all);
  return p;
}

/**
 * Append a practice log entry.
 * @param {object} entry - { session_id, word, sentence, stage, correct, timestamp }
 */
function appendPracticeLog(entry) {
  const logs = readPracticeLog();
  logs.push({
    ...entry,
    timestamp: entry.timestamp || new Date().toISOString()
  });
  writePracticeLog(logs);
  return entry;
}

module.exports = {
  getProgress,
  setProgress,
  markWordCompleted,
  appendPracticeLog,
  readProgress,
  readPracticeLog
};
