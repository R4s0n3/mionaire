import OpenAI from "openai";
import { env } from "@/env";
import { system_prompt } from "./system-prompt";
import demo_examples from './examples'
import { shuffle } from "./functions";

const openai = new OpenAI({
        baseURL: 'https://api.deepseek.com',
        apiKey: env.DEEPSEEK_API_KEY
});

export type GenQuestion = {
    question: string,
    A: string,
    B: string,
    C: string,
    D: string,
    answer: string,
}

export default async function generateQuestion({
    stage,
    mode,
    questions }: { stage: number, mode:string, questions: GenQuestion[]}): Promise<GenQuestion> {
    const shuffledExamples = shuffle(demo_examples)

    let result
    const prompt = `
                ${system_prompt}
                Output: Deliver in JSON format.

                GOOD EXAMPLES:
                ${JSON.stringify(shuffledExamples.slice(0,15))}
            `
        const completion = await openai.chat.completions.create({
        messages: [
            { role: "system", content: prompt },
            { role: "user", content: `
                currentStage: ${stage}
                mode: ${mode}

                CURRENT GAME QUESTIONS::
                ${JSON.stringify(questions)}
                ` },
        ],
        temperature: 1.23,
        max_tokens: 300,
        model: "deepseek-chat",
        response_format: { "type": "json_object",  }    
      });

      if (completion.choices[0]?.message.content) {
          result = JSON.parse(completion.choices[0].message.content) as GenQuestion
      } else {
        throw new Error("No valid response from OpenAI API.");
        }
      
      return result

}