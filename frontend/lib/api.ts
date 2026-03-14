const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Returns a URL that streams TTS audio for the given text via the backend.
 * Use this as the `src` for AudioPlayer.
 * Example: ttsUrl("bread") → "http://localhost:4000/tts/bread"
 */
export function ttsUrl(text: string): string {
  return `${API_BASE_URL}/tts/${encodeURIComponent(text)}`;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `API error ${res.status}: ${res.statusText}${
        text ? ` — ${text.slice(0, 200)}` : ''
      }`,
    );
  }
  return (await res.json()) as T;
}

export interface LessonStartRequest {
  theme: string;
  goal_words: number;
  days: number;
}

export interface LessonStartResponse {
  session_id: string;
  first_word: string;
}

export interface WordLessonResponse {
  word: string;
  image?: string;
  audio_url?: string;
  sentence_examples?: string[];
}

export interface ConversationTurn {
  speaker: 'worker' | 'user';
  line: string;
  audio_url?: string;
}

export interface ConversationResponse {
  theme: string;
  turns: ConversationTurn[];
}

export interface SpeechCheckRequest {
  expected: string;
  audio_base64: string;
  session_id: string;
}

export interface SpeechCheckResponse {
  correct: boolean;
  similarity: number;
  transcript?: string;
}

export interface ProgressSaveRequest {
  session_id: string;
  word: string;
  sentence: string;
  correct: boolean;
  stage: number;
}

export interface ProgressResponse {
  words_learned: number;
  goal_words: number;
  theme: string;
  streak_days: number;
}

export interface PhotoAnalyzeRequest {
  image_base64: string;
  mime_type: string;
  session_id: string;
}

export interface PhotoAnalyzeResponse {
  label: string;
  word?: string;
  audio_url?: string;
  quiz_prompt?: string;
  sentence_example?: string;
}

export async function startLesson(
  payload: LessonStartRequest,
): Promise<LessonStartResponse> {
  const res = await fetch(`${API_BASE_URL}/lesson/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<LessonStartResponse>(res);
}

export async function getNextWord(params: {
  theme: string;
  session_id: string;
}): Promise<WordLessonResponse> {
  const url = new URL(`${API_BASE_URL}/lesson/word`);
  url.searchParams.set('theme', params.theme);
  url.searchParams.set('session_id', params.session_id);
  const res = await fetch(url.toString(), { method: 'GET' });
  return handleResponse<WordLessonResponse>(res);
}

export async function getConversation(params: {
  theme: string;
}): Promise<ConversationResponse> {
  const url = new URL(`${API_BASE_URL}/lesson/conversation`);
  url.searchParams.set('theme', params.theme);
  const res = await fetch(url.toString(), { method: 'GET' });
  return handleResponse<ConversationResponse>(res);
}

export async function speechCheck(
  payload: SpeechCheckRequest,
): Promise<SpeechCheckResponse> {
  const res = await fetch(`${API_BASE_URL}/speech/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<SpeechCheckResponse>(res);
}

export async function saveProgress(
  payload: ProgressSaveRequest,
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/progress/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  await handleResponse(res);
}

export async function getProgress(
  sessionId: string,
): Promise<ProgressResponse> {
  const res = await fetch(`${API_BASE_URL}/progress/${sessionId}`, {
    method: 'GET',
  });
  return handleResponse<ProgressResponse>(res);
}

export async function analyzePhoto(
  payload: PhotoAnalyzeRequest,
): Promise<PhotoAnalyzeResponse> {
  const res = await fetch(`${API_BASE_URL}/photo/identify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<PhotoAnalyzeResponse>(res);
}
