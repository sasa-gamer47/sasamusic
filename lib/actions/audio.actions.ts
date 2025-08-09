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

export async function generateTimedLyrics({ rawLyrics, sttOutput }: GenerateTimedLyricsParams): Promise<LyricLine[]> {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        You are an AI assistant specialized in aligning song lyrics with speech-to-text transcriptions.
        Your task is to take a block of raw song lyrics and a list of transcribed words with their start and end times,
        and then output the raw lyrics broken down into lines, with an inferred start timestamp for each line.

        Rules:
        1. The output must be a JSON array of objects, where each object has 'timestamp' (number, in seconds) and 'text' (string) properties.
        2. The 'text' for each object must be an exact line from the provided raw lyrics. Do not modify the lyric text.
        3. The 'timestamp' for each lyric line should be the 'startTime' of the *first word* of that line as found in the 'sttOutput'.
        4. If a lyric line is not found in the 'sttOutput' or cannot be reliably aligned, infer its timestamp based on the preceding line's end time or a reasonable gap, but prioritize direct alignment. If no reliable timestamp can be inferred, use 0.
        5. Maintain the original order of the lyric lines.
        6. Be precise with timestamps, using floating-point numbers.

        Raw Lyrics:
        ${rawLyrics}

        Speech-to-Text Output (word by word with timestamps):
        ${JSON.stringify(sttOutput, null, 2)}

        Please provide the output in the following JSON format:
        [
            { "timestamp": 0.0, "text": "First lyric line" },
            { "timestamp": 5.123, "text": "Second lyric line" },
            // ...
        ]
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const parsed = extractJsonFromText<LyricLine[]>(text);
        if (!parsed) {
            throw new Error('Failed to parse Gemini response for timed lyrics.');
        }
        return parsed;

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

        // 4. Use the existing generateTimedLyrics function to align raw lyrics with STT output
        const timedLyrics = await generateTimedLyrics({ rawLyrics, sttOutput });

        return timedLyrics;
    } catch (error) {
        handleError(error);
        throw error;
    }
}
