'use server'

import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { handleError } from '@/lib/utils';
import { Readable } from 'stream';
import { LyricLine } from '@/types';

interface WordTimestamp {
    word: string;
    startTime: number;
    endTime: number;
}

interface GenerateTimedLyricsParams {
    rawLyrics: string;
    sttOutput: WordTimestamp[];
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

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

        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
        let parsedLyrics: LyricLine[];

        if (jsonMatch && jsonMatch[1]) {
            parsedLyrics = JSON.parse(jsonMatch[1]);
        } else {
            parsedLyrics = JSON.parse(text);
        }
        
        return parsedLyrics;

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

        let sttOutput: WordTimestamp[];
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);

        if (jsonMatch && jsonMatch[1]) {
            sttOutput = JSON.parse(jsonMatch[1]);
        } else {
            try {
                sttOutput = JSON.parse(text);
            } catch (parseError) {
                console.error("Failed to parse STT output directly:", parseError);
                sttOutput = [];
            }
        }

        // 4. Use the existing generateTimedLyrics function to align raw lyrics with STT output
        const timedLyrics = await generateTimedLyrics({ rawLyrics, sttOutput });

        return timedLyrics;
    } catch (error) {
        handleError(error);
        throw error;
    }
}
