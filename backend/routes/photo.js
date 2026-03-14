/**
 * Photo route: receive image upload, process with Gemini Vision, return label + quiz hint.
 */

const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = /^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype);
    if (ok) cb(null, true);
    else cb(new Error('Only images (jpeg, png, gif, webp) allowed'));
  }
});

/**
 * POST /photo/identify
 * multipart/form-data: image file
 * Returns: { label, sentence_example, success } or error.
 * Uses Gemini Vision when GEMINI_API_KEY is set; otherwise throws error.
 */
router.post('/identify', upload.single('image'), async (req, res) => {
  let filePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    filePath = req.file.path;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
      return res.status(503).json({
        error: 'Photo identification unavailable',
        code: 'GEMINI_API_KEY_NOT_SET'
      });
    }

    const result = await identifyWithGemini(filePath, apiKey);
    return res.json(result);
  } catch (err) {
    console.error('POST /photo/identify', err);
    res.status(500).json({ error: err.message || 'Failed to identify image' });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (_) {}
    }
  }
});

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

async function identifyWithGemini(filePath, apiKey) {
  const { GoogleGenAI } = require("@google/genai");
  const ai = new GoogleGenAI({ apiKey });

  const buffer = fs.readFileSync(filePath);
  const base64 = buffer.toString("base64");
  const mimeType = getMimeType(filePath);

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
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

  const text = response.text || "";

  if (!text) {
    throw new Error("No response from Gemini API");
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Invalid response format from Gemini API: " + text);
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    label: parsed.word || "object",
    sentence_example: parsed.sentence || `I see ${parsed.word || "object"}.`,
    description: parsed.description || null,
    success: true,
  };
}

module.exports = router;
