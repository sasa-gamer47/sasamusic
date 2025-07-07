'use server'

import { GoogleGenerativeAI } from '@google/generative-ai';
import { handleError } from '@/lib/utils';
import { LyricLine } from '@/types';

// Ensure GEMINI_API_KEY environment variable is set
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface WordTimestamp {
    word: string;
    startTime: number;
    endTime: number;
}

interface GenerateTimedLyricsParams {
    rawLyrics: string;
    sttOutput: WordTimestamp[];
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

        // Attempt to parse the JSON response
        // Gemini often wraps JSON in markdown code blocks, so we need to extract it
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        let parsedLyrics: LyricLine[];

        if (jsonMatch && jsonMatch[1]) {
            parsedLyrics = JSON.parse(jsonMatch[1]);
        } else {
            // If no markdown block, try to parse directly (might be raw JSON)
            parsedLyrics = JSON.parse(text);
        }
        
        return parsedLyrics;

    } catch (error) {
        handleError(error);
        throw error; // Re-throw to be caught by the calling function
    }
}
