/**
 * Gemini Vision API Service
 * Member 4 — AI Integration Specialist
 *
 * Usage: Call identifyImage(imageBase64) to get back the identified
 * object/item name from a user-uploaded photo using Google Gemini Vision.
 */

const fetch = require('node-fetch');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash'; // fast, cost-efficient vision model

/**
 * Identifies an object in a base64-encoded image using Gemini Vision.
 * @param {string} imageBase64 - The base64 string of the image (no prefix).
 * @param {string} [mimeType='image/jpeg'] - The MIME type of the image.
 * @returns {Promise<{label: string, sentence: string}>} - Identified word + a simple sentence.
 */
async function identifyImage(imageBase64, mimeType = 'image/jpeg') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const prompt = `You are an ESL teacher helping a non-native English speaker who is training to be a caregiver.
Look at this image and identify the main object.
Respond ONLY in this JSON format:
{
  "word": "<single English word for the main object>",
  "sentence": "<a simple 4-6 word sentence using the word, suitable for a caregiver context>"
}
Example: { "word": "medicine", "sentence": "I give medicine to patients." }`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: imageBase64,
                            },
                        },
                    ],
                },
            ],
            generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 300,
            },
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini Vision error ${response.status}: ${errText}`);
    }

    // Use .text() not .json() — Gemini 2.5 Flash (thinking model) can return large payloads
    const rawBody = await response.text();
    const data = JSON.parse(rawBody);
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Robustly extract word and sentence via regex (handles markdown fences, extra whitespace, etc.)
    const wordMatch = rawText.match(/"word"\s*:\s*"([^"]+)"/);
    const sentenceMatch = rawText.match(/"sentence"\s*:\s*"([^"]+)"/);
    return {
        word: wordMatch?.[1] || 'unknown',
        sentence: sentenceMatch?.[1] || '',
    };
}

module.exports = { identifyImage };
