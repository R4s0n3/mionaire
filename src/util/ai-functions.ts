import OpenAI from "openai";
import { system_prompt } from "./system-prompt";
import { env } from "@/env";

const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: env.OPENROUTER_API_KEY,
    // Add default timeout to prevent hanging
    timeout: 30000, // 30 seconds
});

export type GenQuestion = {
    question: string;
    A: string;
    B: string;
    C: string;
    D: string;
    stage: number;
    answer: string;
};

// Predefine constants outside the function to avoid repeated creation
const DEFAULT_MODE = "NORMAL";
const QUESTION_COUNT = 15;
const MODEL = "openrouter/quasar-alpha";

export default async function generateQuestion({ mode = DEFAULT_MODE } = {}): Promise<GenQuestion[]> {
    try {
        // Minimize string interpolation by pre-building the prompt
        const prompt = `${system_prompt}\n\n` +
            `** Always create ${QUESTION_COUNT} unique questions.\n` +
            `** ${mode}\n` +
            `** Output: Deliver in JSON format always!\n\n` +
            `type JsonOutput = {
                question: string;
                A: string;
                B: string;
                C: string;
                stage: number;
                D: string;
                answer: string;
            }[]`;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: prompt }],
            temperature: 0.6,
            frequency_penalty: 0,
            presence_penalty: 0,
            max_tokens: 4000,
            model: MODEL,
            response_format: { type: "json_object" },
            // Add stream: false to ensure complete response
            stream: false,
        });

        console.log("AI RESPONSE: ",completion)
        const content = completion.choices[0]?.message.content;
        if (!content) {
            throw new Error("No valid response from API");
        }
        console.log("AI CONTENT: ",content)
        const result = JSON.parse(content) as { questions: GenQuestion[] };
        console.log("PARSED RESULT: ", result)
        
        // Validate the response structure
        if (!result.questions || !Array.isArray(result.questions) || result.questions.length !== QUESTION_COUNT) {
            throw new Error(`Invalid response format or incorrect number of questions`);
        }

        return result.questions;
    } catch (error) {
        // Improve error handling
        console.error("Failed to generate questions:", error);
        throw error instanceof Error ? error : new Error("Unknown error in question generation");
    }
}