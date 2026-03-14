/**
 * ElevenLabs Text-to-Speech (TTS) Service
 * Member 4 — AI Integration Specialist
 *
 * Usage: Call generateSpeech(text) to get back an audio buffer
 * from the ElevenLabs TTS API.
 */

const fetch = require('node-fetch');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // default: calm, clear voice

/**
 * Converts text to speech using ElevenLabs TTS API.
 * @param {string} text - The text to convert to speech.
 * @returns {Promise<Buffer>} - Audio buffer (MP3 format).
 */
async function generateSpeech(text) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.75,
        similarity_boost: 0.85,
        speed: 0.85, // slightly slower for ESL learners
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ElevenLabs TTS error ${response.status}: ${errText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

module.exports = { generateSpeech };
