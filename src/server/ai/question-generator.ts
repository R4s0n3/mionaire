import OpenAI from "openai";
import { env } from "@/env";
import { GameMode } from "@prisma/client";

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://mionaire.miomideal.com', // Optional. Site URL for rankings on openrouter.ai.
    'X-Title': 'Mionaire by Mio Mideal', // Optional. Site title for rankings on openrouter.ai.
  },
  apiKey: env.OPENAI_API_KEY,
});

export interface GeneratedQuestion {
  stage: number;
  question: string;
  A: string;
  B: string;
  C: string;
  D: string;
  answer: string;
}

export interface QuestionSet {
  mode: GameMode;
  questions: GeneratedQuestion[];
}

const PROMPTS = {
  [GameMode.EASY]: `Generate 15 trivia questions for an EASY difficulty quiz game. Questions should be basic general knowledge, suitable for beginners. Cover topics like history, geography, science basics, pop culture, etc. Each question must have 4 options (A, B, C, D) and one correct answer.

Format as JSON array of objects:
[
  {
    "stage": 1,
    "question": "Question text?",
    "A": "Option A",
    "B": "Option B",
    "C": "Option C",
    "D": "Option D",
    "answer": "A"
  },
  ...
]

Ensure questions progress in difficulty slightly through stages 1-15. Make sure the correct answer is clearly one of the options.`,

  [GameMode.NORMAL]: `Generate 15 trivia questions for a NORMAL difficulty quiz game. Questions should be standard general knowledge, requiring some knowledge but not expert level. Mix of history, science, literature, sports, geography, current events, etc.

Format as JSON array of objects:
[
  {
    "stage": 1,
    "question": "Question text?",
    "A": "Option A",
    "B": "Option B",
    "C": "Option C",
    "D": "Option D",
    "answer": "A"
  },
  ...
]

Questions should increase in complexity from stage 1 to 15. Ensure variety in topics and correct answers are unambiguous.`,

  [GameMode.HARD]: `Generate 15 trivia questions for a HARD difficulty quiz game. Questions should be challenging, requiring deep knowledge or niche expertise. Include advanced science, history details, literature, obscure facts, complex current events, etc.

Format as JSON array of objects:
[
  {
    "stage": 1,
    "question": "Question text?",
    "A": "Option A",
    "B": "Option B",
    "C": "Option C",
    "D": "Option D",
    "answer": "A"
  },
  ...
]

Make questions progressively more difficult through stages 1-15. Include some questions that might stump experts. Ensure correct answers are verifiable and options are plausible distractors.`,
};

export async function generateQuestionSet(
  mode: GameMode,
): Promise<QuestionSet> {
  try {
    const prompt = PROMPTS[mode];

    const response = await openai.chat.completions.create({
      model: "openai/gpt-oss-120b:free", // Use cheaper model for trivia generation
      messages: [
        {
          role: "system",
          content:
            "You are a trivia question generator. Always respond with valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    // Parse JSON
    let questions: GeneratedQuestion[];
    try {
      questions = JSON.parse(content) as GeneratedQuestion[];
    } catch {
      throw new Error("Failed to parse generated questions as JSON");
    }

    // Validate structure
    if (!Array.isArray(questions) || questions.length !== 15) {
      throw new Error("Invalid question set: must be array of 15 questions");
    }

    // Validate each question
    for (const q of questions) {
      if (
        !q.stage ||
        !q.question ||
        !q.A ||
        !q.B ||
        !q.C ||
        !q.D ||
        !q.answer
      ) {
        throw new Error(`Invalid question structure: ${JSON.stringify(q)}`);
      }
      if (!["A", "B", "C", "D"].includes(q.answer)) {
        throw new Error(`Invalid answer: ${q.answer}`);
      }
    }

    return { mode, questions };
  } catch (error) {
    console.error(`Failed to generate questions for ${mode}:`, error);
    throw error;
  }
}

export async function generateAllDailySets(
  maxRetries = 3,
): Promise<QuestionSet[]> {
  const sets: QuestionSet[] = [];

  for (const mode of [GameMode.EASY, GameMode.NORMAL, GameMode.HARD]) {
    let attempts = 0;
    let success = false;

    while (attempts < maxRetries && !success) {
      try {
        console.log(
          `Generating ${mode} questions (attempt ${attempts + 1}/${maxRetries})`,
        );
        const set = await generateQuestionSet(mode);
        sets.push(set);
        success = true;
        console.log(`Successfully generated ${mode} questions`);
      } catch (error) {
        attempts++;
        console.error(
          `Failed to generate ${mode} questions (attempt ${attempts}/${maxRetries}):`,
          error,
        );

        if (attempts >= maxRetries) {
          console.error(`Exhausted retries for ${mode} questions`);
        } else {
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
        }
      }
    }
  }

  if (sets.length === 0) {
    throw new Error("Failed to generate any question sets after all retries");
  }

  if (sets.length < 3) {
    console.warn(
      `Only generated ${sets.length}/3 question sets. Some modes failed.`,
    );
  }

  return sets;
}
