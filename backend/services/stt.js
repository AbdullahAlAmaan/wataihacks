/**
 * ElevenLabs Speech-to-Text (STT) Service
 * Member 4 — AI Integration Specialist
 *
 * Usage: Call transcribeAudio(audioBuffer) to get back a text transcript
 * from the ElevenLabs Scribe v2 STT API.
 */

const fetch = require('node-fetch');
const FormData = require('form-data');

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

/**
 * Transcribes a user's spoken audio using ElevenLabs STT (Scribe v2).
 * @param {Buffer} audioBuffer - The audio file buffer (webm, mp4, wav, mp3).
 * @param {string} [filename='audio.webm'] - The filename & extension to send to the API.
 * @returns {Promise<string>} - The transcribed text.
 */
async function transcribeAudio(audioBuffer, filename = 'audio.webm') {
    const form = new FormData();
    form.append('file', audioBuffer, {
        filename,
        contentType: 'audio/webm',
    });
    form.append('model_id', 'scribe_v2');
    form.append('language_code', 'en'); // learners are practicing English

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
            'xi-api-key': ELEVENLABS_API_KEY,
            ...form.getHeaders(),
        },
        body: form,
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`ElevenLabs STT error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    // Scribe v2 returns a `text` field at the top level
    return (data.text || '').trim();
}

module.exports = { transcribeAudio };
