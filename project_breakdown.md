# VoiceFirst ESL Hackathon Project Breakdown

This document breaks down the repository structure and assigns files and responsibilities across 5 team members.

---

## Complete Project Structure

```
/
├── frontend/               # Next.js app
│   ├── app/
│   │   ├── page.tsx            # Home — goal + theme selection
│   │   ├── lesson/
│   │   │   ├── word/page.tsx       # Stage 1: Word lesson
│   │   │   ├── sentence/page.tsx   # Stage 2: Sentence practice
│   │   │   ├── conversation/page.tsx # Stage 3: Conversation scenario
│   │   │   ├── photo/page.tsx      # NEW Stage: Photo Learning via Camera
│   │   │   └── mission/page.tsx    # Stage 5: Daily mission (nice-to-have)
│   │   └── progress/page.tsx   # Progress dashboard
│   ├── components/
│   │   ├── WordLesson.tsx
│   │   ├── SentencePractice.tsx
│   │   ├── ConversationMode.tsx
│   │   ├── PhotoCapture.tsx    # Camera / File upload component
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
│   │   ├── photo.js            # POST /photo/analyze route (Gemini)
│   │   └── progress.js         # /progress/* routes
│   ├── services/
│   │   ├── elevenlabs.js       # ElevenLabs TTS wrapper
│   │   ├── stt.js              # ElevenLabs STT wrapper
│   │   ├── gemini.js           # Gemini Vision API wrapper
│   │   └── lessonEngine.js     # Lesson + sentence generation logic
│   ├── data/
│   │   └── words.json          # Word bank organized by theme
│   └── index.js
│
├── project_breakdown.md    # This file
└── CLAUDE.md
```

---

## Team Responsibilities by File

### **1. Frontend Developer (UI & UX Flow)**
*You are building the visual skeleton and navigation of the app. Your priority is making the screens look clean and clear (especially for users with low literacy).*
- **`frontend/app/page.tsx`**: The home screen where users select their learning goal and theme (Grocery, Work, etc.).
- **`frontend/app/lesson/word/page.tsx`**: The UI for Stage 1 (showing the word and the image).
- **`frontend/app/lesson/sentence/page.tsx`**: The UI for Stage 2 (showing the sentences).
- **`frontend/app/lesson/conversation/page.tsx`**: The UI for Stage 3 (the chat-like interface for the dialogue).
- **`frontend/app/lesson/photo/page.tsx`**: The UI for the new Photo Learning stage (displaying camera view and quiz results).
- **`frontend/components/ProgressDashboard.tsx`**: The dashboard component showing the user's progress and daily streak.
- **`frontend/app/progress/page.tsx`**: The main page that hosts the Progress Dashboard.

### **2. Frontend Developer (Audio & Mic Integration)**
*You are building the interactive heart of the app. Your priority is making sure the browser can cleanly play the AI's audio and seamlessly record the user's voice.*
- **`frontend/components/MicButton.tsx`**: The component that controls recording (starting/stopping MediaRecorder, handling permissions).
- **`frontend/components/WordLesson.tsx`**: The specific logic that handles the user tapping the mic, speaking the word, and getting feedback.
- **`frontend/components/SentencePractice.tsx`**: The logic for the sentence repetition stage.
- **`frontend/components/ConversationMode.tsx`**: The logic for handling the back-and-forth audio in the conversation scenario.
- **`frontend/components/PhotoCapture.tsx`**: The component handling Web Camera API access and image uploading for the Gemini AI.
- **`frontend/components/AudioPlayer.tsx`**: A reusable component to play ElevenLabs audio streams.
- **`frontend/lib/audio.ts`**: Helper functions for the Web Audio API and chunking audio data.
- **`frontend/lib/api.ts`**: The fetch calls that connect the frontend to the backend routes.

### **3. Backend Developer (Core API & State Management)**
*You are the traffic controller. Your priority is building the Express server, managing where the user is in the lesson, and saving their progress.*
- **`backend/index.js`**: The main Express server entry point.
- **`backend/routes/lesson.js`**: Routes for starting a lesson and getting the next word/conversation (`/lesson/start`, `/lesson/word`, `/lesson/conversation`).
- **`backend/routes/photo.js`**: Route to receive images uploaded to the frontend and process them via Gemini Vision.
- **`backend/routes/progress.js`**: Routes for saving and retrieving user progress (`/progress/save`, `/progress/:session_id`).
- **`backend/services/lessonEngine.js`**: The logic that decides what stage the user is on, what word comes next, and how sentences are generated.
- **Storage/DB**: Setting up the connection (Supabase or simple JSON) to save `UserProgress` and `PracticeLog` data models.

### **4. AI Integration Specialist (ElevenLabs STT & TTS)**
*You are the voice engine. Your priority is integrating ElevenLabs to generate natural voices and accurately transcribe the user's speech.*
- **`backend/services/elevenlabs.js`**: The wrapper around the ElevenLabs API for converting text to speech (TTS).
- **`backend/services/stt.js`**: The wrapper around ElevenLabs Speech-to-Text to transcribe the incoming mic audio.
- **`backend/services/gemini.js`**: The wrapper around the Gemini Vision API to identify user-uploaded images (e.g., medicine bottles).
- **`backend/routes/speech.js`**: The `/speech/check` route. It receives the audio buffer from the frontend, sends it to STT, and runs the fuzzy-matching logic to see if the transcript matches the expected sentence.

### **5. Product & Content Lead**
*You are the curriculum director. Your priority is creating the actual learning material and ensuring the demo goes perfectly.*
- **`backend/data/words.json`**: Building out the robust dictionary of caregiver-specific words (medicine, doctor, emergency, etc.) with image paths and initial sentences.
- **Conversation Scripts**: Writing the JSON structures for the real-world caregiver dialogues (e.g., interacting with a patient or reporting an emergency).
- **Testing & QA**: Acting as the primary tester of the app to ensure the learning flow and photo-identification quiz feel completely intuitive.
- **Demo Script**: Writing the 3-minute presentation focusing tightly on the new Caregiver use case and the Gemini Photo snap loop.
