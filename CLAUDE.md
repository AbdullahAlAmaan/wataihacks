# CLAUDE.md — VoiceFirst ESL Hackathon Project

## Project Overview

A voice-first English learning web app for Rohingya refugees and newcomers with low literacy who are training to work as caregivers.
The core insight: **traditional ESL apps fail because they assume users can read**. This app
teaches English entirely through audio, voice repetition, and real-world conversation scenarios.

**Hackathon mantra:** Build one clean learning loop that works flawlessly.
`Hear → Repeat → Sentence → Conversation → Photo Learning → Real-World Practice`

**Target Users:** Rohingya refugees and newcomers preparing for caregiver roles in healthcare, elder care, and home support services.

---

## Winning Demo Script

> "Many Rohingya newcomers cannot use traditional ESL apps because they rely on reading.
> Our system teaches English entirely through voice using real-life situations like grocery
> stores, transportation, workplaces, and **caregiving scenarios**. Since many of our users
> will work as caregivers, we focus on emergency situations, patient communication, and
> daily caregiving tasks. Users can also **snap photos of real objects** — medicine bottles,
> medical equipment, household items — and our AI identifies them, teaches the vocabulary
> through voice, and creates personalized quizzes based on their photos."

Demo flow for judges:
1. Choose caregiver theme
2. Learn word: **medicine** (audio plays, image shown)
3. Repeat sentence: **"I give medicine"**
4. Practice caregiver conversation (emergency scenario)
5. **Snap photo of medicine bottle → AI identifies "aspirin" → Voice teaches word → Quiz created**
6. Show progress tracker

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) + Tailwind CSS |
| Backend | Node.js + Express |
| Speech-to-Text | OpenAI Whisper API |
| Text-to-Speech | ElevenLabs API |
| Image Recognition | Gemini Vision API |
| Storage | Supabase (or local JSON for MVP) |
| Mic Input | Web Audio API / MediaRecorder |
| Camera Input | Web Camera API / File Upload |

---

## Repository Structure

```
/
├── frontend/               # Next.js app
│   ├── app/
│   │   ├── page.tsx            # Home — goal + theme selection
│   │   ├── lesson/
│   │   │   ├── word/page.tsx       # Stage 1: Word lesson
│   │   │   ├── sentence/page.tsx   # Stage 2: Sentence practice
│   │   │   ├── conversation/page.tsx # Stage 3: Conversation scenario
│   │   │   └── mission/page.tsx    # Stage 5: Daily mission (nice-to-have)
│   │   └── progress/page.tsx   # Progress dashboard
│   ├── components/
│   │   ├── WordLesson.tsx
│   │   ├── SentencePractice.tsx
│   │   ├── ConversationMode.tsx
│   │   ├── MicButton.tsx       # Record + submit audio
│   │   ├── AudioPlayer.tsx     # Play ElevenLabs audio
│   │   └── ProgressDashboard.tsx
│   └── lib/
│       ├── api.ts              # All calls to backend
│       └── audio.ts            # Web Audio API helpers
│
├── backend/                # Express API
│   ├── routes/
│   │   ├── lesson.js           # /lesson/* routes
│   │   ├── speech.js           # /speech/check route
│   │   └── progress.js         # /progress/* routes
│   ├── services/
│   │   ├── whisper.js          # Whisper API wrapper
│   │   ├── elevenlabs.js       # ElevenLabs TTS wrapper
│   │   └── lessonEngine.js     # Lesson + sentence generation logic
│   ├── data/
│   │   └── words.json          # Word bank organized by theme
│   └── index.js
│
└── CLAUDE.md
```

---

## Learning System — 5 Stages

### Stage 1 — Words
- ElevenLabs voices the word slowly (e.g., "Bread.")
- Optional: image displayed
- User taps mic, repeats word
- Whisper transcribes, backend checks match

### Stage 2 — Sentences
- Same word placed in 1–2 simple sentences
- Example: "I buy bread." / "I eat bread."
- ElevenLabs plays sentence
- User repeats, Whisper checks

### Stage 3 — Conversations
- Short scripted dialogue for a real-world setting
- App plays the "worker" side via ElevenLabs
- User responds with their line
- Example (Grocery):
  ```
  Worker: Hello
  User: Hello
  Worker: What do you want?
  User: I want bread
  ```

### Stage 4 — Mini Story (nice-to-have)
- Words appear in a short narrative chain
- Example: "I go to the store. I buy bread. I pay. I go home."
- Context chaining aids memory

### Stage 5 — Real-life Mission (nice-to-have)
- System suggests 3 sentences to use in the real world today
- Example: "I want bread." / "I need help." / "Where is the bus?"

---

## User Flow

```
Open App
    │
    ▼
Select Goal (e.g., Learn 20 words)
    │
    ▼
Choose Theme (Grocery / Bus / Work / Doctor / Home)
    │
    ▼
Stage 1: Word Lesson
  - Hear word
  - Repeat word
  - Whisper checks transcript
    │
    ▼
Stage 2: Sentence Practice
  - Hear sentence
  - Repeat sentence
  - Whisper checks transcript
    │
    ▼
Stage 3: Conversation Scenario
  - Full scripted dialogue
  - User plays their role
  - Feedback given
    │
    ▼
Progress Saved
    │
    ▼
Next Word / Daily Mission
```

---

## System Architecture

```
Browser (Web App)
        │
        ▼
Next.js Frontend
  - Mic capture (MediaRecorder)
  - Audio playback (ElevenLabs audio)
  - Learning UI stages
  - Progress display
        │
        ▼
Express Backend API
        │
 ┌──────┴────────────────────────┐
 ▼                               ▼
OpenAI Whisper API          ElevenLabs API
(Speech-to-Text)            (Text-to-Speech)
 ▼                               ▲
User mic audio              Audio stream to browser
        │
        ▼
Learning Engine
  - Lesson sequencing
  - Speech correctness check
  - Sentence/conversation selection
        │
        ▼
Storage (Supabase / local JSON)
  - UserProgress
  - PracticeLog
  - Word bank
```

---

## API Reference

### POST `/lesson/start`
Begin a lesson session.
```json
// Request
{
  "theme": "grocery",
  "goal_words": 20,
  "days": 7
}
// Response
{
  "session_id": "abc123",
  "first_word": "bread"
}
```

### GET `/lesson/word?theme=grocery&session_id=abc123`
Get next word for the current lesson.
```json
// Response
{
  "word": "bread",
  "image": "/images/bread.png",
  "audio_url": "/audio/bread.mp3",
  "sentence_examples": [
    "I buy bread",
    "I eat bread"
  ]
}
```

### GET `/lesson/conversation?theme=grocery`
Get a scripted conversation for a theme.
```json
// Response
{
  "theme": "grocery",
  "turns": [
    { "speaker": "worker", "line": "Hello" },
    { "speaker": "user",   "line": "Hello" },
    { "speaker": "worker", "line": "What do you want?" },
    { "speaker": "user",   "line": "I want bread" }
  ]
}
```

### POST `/speech/check`
Validate user speech against expected text.
```json
// Request
{
  "expected": "I buy bread",
  "transcript": "I buy bread"
}
// Response
{
  "correct": true,
  "similarity": 1.0
}
```

### POST `/progress/save`
Log a practice attempt.
```json
// Request
{
  "session_id": "abc123",
  "word": "bread",
  "sentence": "I buy bread",
  "correct": true,
  "stage": 2
}
```

### GET `/progress/:session_id`
Get current progress.
```json
// Response
{
  "words_learned": 5,
  "goal_words": 20,
  "theme": "grocery",
  "streak_days": 2
}
```

---

## Data Models

### Word
```json
{
  "word": "bread",
  "theme": "grocery",
  "rohingya_translation": "...",
  "image": "/images/bread.png",
  "audio_url": "/audio/bread.mp3",
  "sentence_examples": ["I buy bread", "I eat bread"]
}
```

### UserProgress
```json
{
  "session_id": "abc123",
  "goal_words": 20,
  "words_learned": 5,
  "theme": "grocery",
  "start_date": "2026-03-14",
  "streak_days": 2
}
```

### PracticeLog
```json
{
  "session_id": "abc123",
  "word": "bread",
  "sentence": "I buy bread",
  "stage": 2,
  "correct": true,
  "timestamp": "2026-03-14T10:30:00Z"
}
```

---

## Word Bank (Initial Dataset)

Seed data in `backend/data/words.json`. Organized by theme.

```json
{
  "grocery": ["bread", "milk", "bag", "pay", "price", "water", "egg", "rice"],
  "transport": ["bus", "stop", "ticket", "where", "go", "help"],
  "work": ["job", "start", "time", "break", "done", "manager"],
  "doctor": ["pain", "help", "medicine", "sick", "need", "today"],
  "home": ["door", "key", "room", "clean", "eat", "sleep"]
}
```

---

## MVP Scope — What to Build vs. Skip

### Must Build (ship these or demo fails)
- [ ] Word lesson with ElevenLabs audio playback
- [ ] Mic recording + Whisper speech check
- [ ] Sentence practice with feedback
- [ ] One conversation scenario (grocery)
- [ ] Progress tracker (words learned / goal)

### Nice to Have (only if core loop is done)
- [ ] Word images
- [ ] Mini story mode
- [ ] Daily mission suggestions
- [ ] Multiple themes

### Do NOT Build
- Authentication / user accounts
- Full dictionary scraping pipeline
- Complex AI agent flows
- Pronunciation scoring
- Mobile app

---

## Environment Variables

Create `.env` in `backend/`:
```
OPENAI_API_KEY=...
ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
SUPABASE_URL=...          # optional, use local JSON if no time
SUPABASE_KEY=...          # optional
PORT=4000
```

Create `.env.local` in `frontend/`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## Team Responsibilities (suggested split)

| Role | Owns |
|---|---|
| Frontend Dev | All Next.js pages, components, mic capture, audio playback |
| Backend Dev | Express routes, Whisper integration, ElevenLabs integration |
| Data / Content | words.json seed data, conversation scripts, themes |
| Demo Lead | Demo script, judge presentation, progress dashboard polish |

---

## Development Setup

```bash
# Backend
cd backend
npm install
cp .env.example .env   # fill in API keys
node index.js          # runs on :4000

# Frontend
cd frontend
npm install
cp .env.local.example .env.local
npm run dev            # runs on :3000
```

---

## Key Implementation Notes

**Whisper speech check:** Use fuzzy string matching (not exact). A score >= 0.75 should count
as correct. The user is a non-native speaker — be forgiving.

**ElevenLabs voice:** Use a calm, slow, clear voice. Slow down the `speed` parameter if the
API supports it. Clarity matters more than naturalness here.

**Mic UX:** The mic button must be dead simple — one big button, clear recording indicator,
auto-submit on silence or tap. Do not add complexity here.

**No text walls in UI:** Minimal text on screen. Large icons, big audio play buttons, visual
progress bars. The user may not be able to read English.

**Offline fallback:** Pre-generate and cache ElevenLabs audio for the word bank so demos work
without live API calls if internet drops during the hackathon presentation.

---

## What Wins Hackathons

A half-broken AI super-system loses to a smooth, focused demo every time.

The judges need to feel the product in 3 minutes:
1. They hear the voice
2. They see someone speak into the mic
3. They see "Correct!" feedback
4. They see the progress bar move

If those 4 moments are polished, you win.
