'use server'

import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { handleError } from '@/lib/utils';
import { Readable } from 'stream';
import { LyricLine } from '@/types';

function tryParseJson<T>(raw: string): T | null {
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

function extractJsonFromText<T>(text: string): T | null {
    // 1) Try direct JSON
    const direct = tryParseJson<T>(text);
    if (direct !== null) return direct;

    // 2) Try fenced code blocks with or without language
    const fencePatterns = [
        /```json\s*([\s\S]*?)\s*```/i,
        /```\s*([\s\S]*?)\s*```/,
    ];
    for (const pattern of fencePatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            const parsed = tryParseJson<T>(match[1]);
            if (parsed !== null) return parsed;
        }
    }

    // 3) Try extracting the largest array or object slice
    const arrayStart = text.indexOf('[');
    const arrayEnd = text.lastIndexOf(']');
    if (arrayStart !== -1 && arrayEnd > arrayStart) {
        const candidate = text.slice(arrayStart, arrayEnd + 1);
        const parsed = tryParseJson<T>(candidate);
        if (parsed !== null) return parsed;
    }
    const objStart = text.indexOf('{');
    const objEnd = text.lastIndexOf('}');
    if (objStart !== -1 && objEnd > objStart) {
        const candidate = text.slice(objStart, objEnd + 1);
        const parsed = tryParseJson<T>(candidate);
        if (parsed !== null) return parsed;
    }

    return null;
}

interface WordTimestamp {
    word: string;
    startTime: number;
    endTime: number;
}

interface GenerateTimedLyricsParams {
    rawLyrics: string;
    sttOutput: WordTimestamp[];
}

// Use server-side env var for Gemini API key and fail fast if missing
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set. Add it to your environment (e.g., .env.local) to use Gemini features.');
}
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface GenerateTimedLyricsFromAudioParams {
    rawLyrics: string;
    audioUrl: string;
    audioMimeType: string;
}

// Deterministic alignment of lyrics to STT word timings
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function tokenize(text: string): string[] {
    const normalized = normalizeText(text);
    return normalized.length ? normalized.split(' ') : [];
}

function findStartIndexForLine(
    sttWords: string[],
    lineWords: string[],
    startSearchIndex: number
): number {
    if (lineWords.length === 0) return -1;

    const tryMatch = (k: number): number => {
        if (k <= 0) return -1;
        for (let i = startSearchIndex; i <= sttWords.length - k; i++) {
            let allMatch = true;
            for (let j = 0; j < k; j++) {
                if (sttWords[i + j] !== lineWords[j]) {
                    allMatch = false;
                    break;
                }
            }
            if (allMatch) return i;
        }
        return -1;
    };

    // Try matching the first 5, then 4, 3, 2, and 1 words
    for (let k = Math.min(5, lineWords.length); k >= 1; k--) {
        const idx = tryMatch(k);
        if (idx !== -1) return idx;
    }

    // Fallback: find the earliest occurrence of any of the first 3 words
    const candidateWords = lineWords.slice(0, Math.min(3, lineWords.length));
    let earliest = -1;
    for (let i = startSearchIndex; i < sttWords.length; i++) {
        if (candidateWords.includes(sttWords[i])) {
            earliest = i;
            break;
        }
    }
    return earliest;
}

function alignLyricsToStt(rawLyrics: string, sttOutput: WordTimestamp[]): LyricLine[] {
    const lines = rawLyrics
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    if (!lines.length) return [];

    const sttWords = sttOutput.map(w => normalizeText(w.word)).filter(Boolean);
    const result: LyricLine[] = [];
    let searchCursor = 0;
    let lastTimestamp = 0;

    for (const line of lines) {
        const lineWords = tokenize(line);

        let timestamp = 0;
        if (sttWords.length && lineWords.length) {
            const idx = findStartIndexForLine(sttWords, lineWords, searchCursor);
            if (idx !== -1) {
                timestamp = sttOutput[idx].startTime;
                searchCursor = idx + 1; // move forward to preserve order
            } else {
                // Could not find a match; infer a timestamp slightly after last
                timestamp = Math.max(lastTimestamp + 1.0, lastTimestamp);
            }
        } else {
            // No STT available; monotonically increase timestamps
            timestamp = lastTimestamp + 1.0;
        }

        result.push({ timestamp, text: line });
        lastTimestamp = timestamp;
    }

    return result;
}

export async function generateTimedLyrics({ rawLyrics, sttOutput }: GenerateTimedLyricsParams): Promise<LyricLine[]> {
    try {
        // Prefer deterministic alignment to avoid zero timestamps
        return alignLyricsToStt(rawLyrics, sttOutput);

    } catch (error) {
        handleError(error);
        throw error;
    }
}

export async function generateTimedLyricsFromAudio({ rawLyrics, audioUrl, audioMimeType }: GenerateTimedLyricsFromAudioParams): Promise<LyricLine[]> {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // 1. Fetch the audio from the provided URL
        const audioResponse = await fetch(audioUrl);
        if (!audioResponse.ok) {
            throw new Error(`Failed to fetch audio from URL: ${audioResponse.statusText}`);
        }
        const audioBuffer = await audioResponse.arrayBuffer(); // Get audio as ArrayBuffer

        // Convert ArrayBuffer to a Buffer. The 'data' field expects a Uint8Array or Array of numbers.
        // Node.js Buffer is compatible.
        const audioBytes = Buffer.from(audioBuffer); 

        // 2. Prepare the prompt with the audio file data
        const promptParts: Part[] = [
            {
                text: `Transcribe the following audio and provide each word along with its start and end time.
                       The output must be a JSON array of objects, where each object has 'word' (string), 'startTime' (number, in seconds), and 'endTime' (number, in seconds) properties.
                       Be precise with timestamps, using floating-point numbers.
                       If the audio cannot be transcribed or word timings cannot be determined, return an empty array.`,
            },
            {
                inlineData: {
                    mimeType: audioMimeType, // Use the appropriate MIME type for the audio
                    data: audioBytes.toString('base64'),
                },
            },
        ];

        // 3. Send the content (text prompt + audio file) to Gemini for transcription
        const result = await model.generateContent(promptParts as Part[]);
        const response = await result.response;
        const text = response.text();

        let sttOutput = extractJsonFromText<WordTimestamp[]>(text) ?? [];
        if (!Array.isArray(sttOutput)) {
            sttOutput = [];
        }

        // 4. Align raw lyrics with STT output deterministically
        const timedLyrics = alignLyricsToStt(rawLyrics, sttOutput);

        return timedLyrics;
    } catch (error) {
        handleError(error);
        throw error;
    }
}
