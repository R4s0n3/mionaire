import OpenAI from "openai";
import { env } from "@/env";
import { system_prompt } from "./system-prompt";


const openai = new OpenAI({
        baseURL: 'https://api.aimlapi.com/v1',
        apiKey: "db75b81aacdf47ba96afdae6e0963dc2"
});

export type GenQuestion = {
    question: string,
    A: string,
    B: string,
    C: string,
    D: string,
    answer: string,
}

export default async function generateQuestion({mode = "NORMAL"}): Promise<GenQuestion[]> {

    let result
    const prompt = `
                ${system_prompt}

                ** Always create 15 unique questions.

                ** ${mode}
                
                ** Output: Deliver in JSON format.
                type JsonOutput = {
                    question: string;
                    A: string;
                    B: string;
                    C: string;
                    stage: number; // key 1 - 15
                    D: string;
                    answer: string;
                }[]
            `
        const completion = await openai.chat.completions.create({
        messages: [
            { role: "system", content: prompt }
        ],
        temperature:0.6,
        frequency_penalty: 0,
        presence_penalty:0,
        max_tokens: 8000,
        model: "gpt-4o",
        response_format: { "type": "json_object",  }    
      });

      if (completion.choices[0]?.message.content) {
          result = JSON.parse(completion.choices[0].message.content) as ResultObject 
      } else {
        throw new Error("No valid response from OpenAI API.");
        }
      return result.questions

}

type ResultObject = {
    questions: GenQuestion[]
}