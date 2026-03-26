import OpenAI from "openai";
import { env } from "@/env";
import { GameMode } from "@prisma/client";
import { THEMES } from "./helper/themes";
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://mionaire.miomideal.com", // Optional. Site URL for rankings on openrouter.ai.
    "X-Title": "Mionaire by Mio Mideal", // Optional. Site title for rankings on openrouter.ai.
  },
  apiKey: env.OPENROUTER_API_KEY,
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

const DIFFICULTY_CONFIG = {
  [GameMode.EASY]: {
    description:
      "basic knowledge suitable for beginners, covering common facts most people know",
    progression:
      "start with very basic trick or misleading questions (stages 1-5), then gradually introduce slightly more specific knowledge (stages 6-15)",
    validation:
      "Make sure the correct answer is clearly one of the options and most educated people would know it",
  },
  [GameMode.NORMAL]: {
    description:
      "require some knowledge but not expert level; a typical trivia fan should get most correct",
    progression:
      "start with accessible knowledge (stages 1-7), then moderately challenging (stages 8-15). Each stage builds slightly on previous complexity",
    validation:
      "Ensure variety in questions and that correct answers are unambiguous. Avoid overly obscure facts—aim for 'interesting' not 'impossible'",
  },
  [GameMode.HARD]: {
    description:
      "challenging and requiring deep knowledge, but still answerable by someone with strong general knowledge or interest in the topic",
    progression:
      "stages 1-8 are difficult but fair (expert-level facts that are documented and learnable), stages 9-15 are very difficult but still have logical reasoning paths or are based on well-known historical/cultural facts",
    validation:
      "Ensure correct answers are verifiable from reliable sources and make logical sense. Distractors should be plausible but clearly wrong upon reflection. Avoid trivia requiring obscure or contradictory sources",
  },
};

const QUESTION_STYLES = {
  [GameMode.EASY]: [
    "straightforward and clear",
    "conversational and friendly",
    "with a light twist or surprise",
  ],
  [GameMode.NORMAL]: [
    "engaging with interesting context",
    "thought-provoking but fair",
    "with a clever angle or connection",
  ],
  [GameMode.HARD]: [
    "intellectually challenging",
    "with sophisticated framing",
    "connecting concepts in unexpected ways",
  ],
};

const createPrompt = (mode: GameMode, themes: string[], seed: string) => {
  const config = DIFFICULTY_CONFIG[mode];
  const styles = QUESTION_STYLES[mode];

  return `Generate 15 trivia questions for a "${mode}" difficulty quiz game.

Themes (1 question each): ${themes.join(", ")}

Requirements:
- Questions should ${config.description}
- ${config.progression}
- Each question has 4 options (A, B, C, D) with exactly one correct answer
- ${config.validation}
- Avoid direct questions ("What/Who/When/Which/The/In...")
- Vary phrasing across all 15 questions. none of them should sound similar
- Cycle through these styles: ${styles.join(", ")}
- Make questions engaging, easy to understand and memorable, not robotic
- Keep the length of each question short

Seed: ${seed}

Respond with ONLY a JSON array, no markdown:
[
  {"stage": 1, "question": "...", "A": "...", "B": "...", "C": "...", "D": "...", "answer": "A"},
  ...
]`;
};

export async function generateQuestionSet(
  mode: GameMode,
  themes: string[],
): Promise<QuestionSet> {
  try {
    const seed = `${Date.now()}-${mode}-${Math.random().toString(36).substring(7)}`;
    const prompt = createPrompt(mode, themes, seed);

    const response = await openai.chat.completions.create({
      model: env.OPENROUTER_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a trivia question generator. Create engaging, varied questions that feel natural and conversational. Always respond with valid JSON only, no markdown.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 4000,
      temperature: 0.69,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    const cleaned = content.replace(/^```json?\n?|\n?```$/g, "").trim();

    let questions: GeneratedQuestion[];
    try {
      questions = JSON.parse(cleaned) as GeneratedQuestion[];
    } catch {
      throw new Error("Failed to parse generated questions as JSON");
    }

    if (!Array.isArray(questions) || questions.length !== 15) {
      throw new Error("Invalid question set: must be array of 15 questions");
    }

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
  themes: string[] = THEMES,
  maxRetries = 3,
): Promise<QuestionSet[]> {
  const sets: QuestionSet[] = [];
  const usedThemes = new Set<string>();

  for (const mode of [GameMode.EASY, GameMode.NORMAL, GameMode.HARD]) {
    let attempts = 0;
    let success = false;

    while (attempts < maxRetries && !success) {
      try {
        // Select 5 random themes that haven't been used yet
        const availableThemes = themes.filter((t) => !usedThemes.has(t));
        if (availableThemes.length < 5) {
          throw new Error(
            `Not enough unique themes to generate all sets. Need 5, only have ${availableThemes.length}.`,
          );
        }

        // Shuffle and pick 5 themes
        const shuffled = [...availableThemes].sort(() => Math.random() - 0.5);
        const selectedThemes = shuffled.slice(0, 5);

        console.log(
          `Generating ${mode} questions with themes: ${selectedThemes.join(", ")} (attempt ${attempts + 1
          }/${maxRetries})`,
        );
        const set = await generateQuestionSet(mode, selectedThemes);
        sets.push(set);

        for (const t of selectedThemes) {
          usedThemes.add(t);
        }

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
