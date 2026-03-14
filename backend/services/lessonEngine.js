/**
 * Lesson engine: decides current stage, next word, and sentence generation.
 * Session state is stored externally (progress store); this module is stateless
 * and uses progress data to compute next word and sentences.
 */

const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const WORDS_PATH = path.join(DATA_DIR, 'words.json');
const CONVERSATIONS_PATH = path.join(DATA_DIR, 'conversations.json');

// Sentence templates per word (caregiver-friendly). Key = word, value = array of sentence stems.
const SENTENCE_TEMPLATES = {
  bread: ['I buy bread', 'I eat bread'],
  milk: ['I buy milk', 'I drink milk'],
  bag: ['I need a bag', 'I have a bag'],
  pay: ['I pay now', 'I need to pay'],
  price: ['What is the price?', 'The price is good'],
  water: ['I need water', 'I give water'],
  egg: ['I buy eggs', 'I eat eggs'],
  rice: ['I buy rice', 'I cook rice'],
  bus: ['Where is the bus?', 'I take the bus'],
  stop: ['Where is the stop?', 'This is my stop'],
  ticket: ['I need a ticket', 'Here is my ticket'],
  where: ['Where is it?', 'Where do I go?'],
  go: ['I go now', 'I need to go'],
  help: ['I need help', 'Can you help?'],
  job: ['I have a job', 'I need a job'],
  start: ['I start at eight', 'When do I start?'],
  time: ['What time is it?', 'It is break time'],
  break: ['I need a break', 'Break time'],
  done: ['I am done', 'Are you done?'],
  manager: ['I talk to the manager', 'Where is the manager?'],
  pain: ['I have pain', 'Where is the pain?'],
  medicine: ['I need medicine', 'I give medicine'],
  sick: ['I feel sick', 'She is sick'],
  need: ['I need help', 'I need water'],
  today: ['I work today', 'See you today'],
  door: ['Open the door', 'Close the door'],
  key: ['I need the key', 'Where is the key?'],
  room: ['This is my room', 'Clean the room'],
  clean: ['I clean the room', 'Keep it clean'],
  eat: ['I eat now', 'Time to eat'],
  sleep: ['I need to sleep', 'Good sleep'],
  fall: ['Did you fall?', 'I will not fall'],
  emergency: ['This is an emergency', 'Call emergency'],
  patient: ['The patient needs help', 'I help the patient'],
  bed: ['The bed is ready', 'I make the bed'],
  pillow: ['I need a pillow', 'Here is your pillow'],
  comfort: ['I give comfort', 'You are safe'],
  food: ['I bring food', 'Do you want food?'],
  bathroom: ['I need the bathroom', 'Where is the bathroom?'],
  fever: ['Do you have a fever?', 'The fever is high'],
  dizzy: ['I feel dizzy', 'Are you dizzy?'],
  breathe: ['Breathe slowly', 'Can you breathe?'],
  nausea: ['I feel nausea', 'Are you sick?'],
  cough: ['I have a bad cough', 'Cover your cough'],
  hospital: ['We go to the hospital', 'Where is the hospital?'],
  heartburn: ['I have heartburn', 'Does your chest hurt?'],
  diarrhea: ['I have diarrhea', 'Please drink water'],
  ambulance: ['Call the ambulance', 'The ambulance is coming'],
  tired: ['I am tired', 'You look tired'],
  comfortable: ['Are you comfortable?', 'Make them comfortable'],
  blanket: ['Here is a blanket', 'I need a blanket']
};

let wordsByTheme = null;
let conversationsByTheme = null;

function loadWords() {
  if (wordsByTheme) return wordsByTheme;
  const raw = fs.readFileSync(WORDS_PATH, 'utf8');
  wordsByTheme = JSON.parse(raw);
  return wordsByTheme;
}

function loadConversations() {
  if (conversationsByTheme) return conversationsByTheme;
  const raw = fs.readFileSync(CONVERSATIONS_PATH, 'utf8');
  const list = JSON.parse(raw);
  conversationsByTheme = list;
  return conversationsByTheme;
}

/**
 * Get list of words for a theme.
 * @param {string} theme
 * @returns {string[]}
 */
function getWordsForTheme(theme) {
  const words = loadWords();
  const list = words[theme] || words.grocery;
  return Array.isArray(list) ? list : [];
}

/**
 * Get sentence examples for a word. Falls back to generic templates if not in map.
 * @param {string} word
 * @returns {string[]}
 */
function getSentenceExamples(word) {
  const key = word.toLowerCase();
  if (SENTENCE_TEMPLATES[key]) return SENTENCE_TEMPLATES[key];
  return [`I need ${word}`, `I want ${word}`];
}

/**
 * Get the next word for the session based on progress.
 * Progress has: words_completed (array of words done), goal_words, theme.
 * @param {object} progress - { theme, words_completed, goal_words }
 * @returns {{ word: string, sentence_examples: string[] } | null}
 */
function getNextWord(progress) {
  if (!progress || !progress.theme) return null;
  const all = getWordsForTheme(progress.theme);
  const completed = progress.words_completed || [];
  const next = all.find(w => !completed.includes(w));
  if (!next) return null;
  return {
    word: next,
    sentence_examples: getSentenceExamples(next)
  };
}

/**
 * Get conversation for theme. Prefer caregiver theme script when theme is caregiver.
 * @param {string} theme
 * @param {string} [variant] - e.g. 'caregiver_emergency'
 * @returns {object} { theme, turns: [{ speaker, line }] }
 */
function getConversation(theme, variant) {
  const convos = loadConversations();
  if (variant && convos[variant]) return convos[variant];
  const key = theme === 'caregiver' ? 'caregiver' : theme;
  return convos[key] || convos.grocery;
}

/**
 * Get full word payload for API (word, image path, audio_url hint, sentence_examples).
 * @param {string} theme
 * @param {string} word
 * @returns {object}
 */
function getWordPayload(theme, word) {
  const apiBase = process.env.API_BASE_URL || 'http://localhost:4000';
  return {
    word,
    theme,
    // Use sample.jpg served from the backend as a placeholder for all words
    image: `${apiBase}/static/sample.jpg`,
    sentence_examples: getSentenceExamples(word)
  };
}

module.exports = {
  getWordsForTheme,
  getSentenceExamples,
  getNextWord,
  getConversation,
  getWordPayload,
  loadWords,
  loadConversations
};
