export type GameMode = "EASY" | "NORMAL" | "HARD";
export type AnswerChoice = "A" | "B" | "C" | "D";

export type ApiUser = {
  id: string;
  email: string | null;
  name: string | null;
  image: string | null;
};

export type AuthSession = {
  user?: ApiUser;
  expires?: string;
};

export type IncompleteDailyGame = {
  id: string;
  mode: GameMode;
  stage: number;
  dailySetId: string | null;
};

export type GameQuestion = {
  id: number;
  stage: number;
  question: string;
  A: string;
  B: string;
  C: string;
  D: string;
};

export type Game = {
  id: string;
  playerId: string;
  type: "RANDOM" | "DAILY";
  stage: number;
  mode: GameMode;
  fiftyFifty: boolean;
  audiencePoll: boolean;
  dailySetId: string | null;
  startedAt: string;
  endedAt: string | null;
  questions: GameQuestion[];
};

export type ScoreEntry = {
  id: string;
  name: string;
  score: number;
};

export type MionaireEntry = {
  name: string;
  date: string | null;
};

export type PlayerRank = {
  name: string;
  score: number;
  rank: number;
};

export type PlayerStats = {
  name: string;
  image: string | null;
  overallScore: number;
  overallRank: number;
  dailyScoreAllTime: number;
  dailyScoreToday: number;
  gamesPlayed: number;
  bestStage: number;
  isMionaire: boolean;
};

export type AudiencePollResult = {
  answer: AnswerChoice;
  count: number;
  percent: number;
};

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status = 0,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

type RequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  form?: URLSearchParams;
  headers?: HeadersInit;
};

type ApiErrorBody = {
  error?: {
    code?: string;
    message?: string;
  };
};

function getApiUrl(path: string): string {
  if (!apiBaseUrl) {
    throw new ApiClientError(
      "NEXT_PUBLIC_API_BASE_URL is not configured. Add it to the web client's environment.",
    );
  }

  return `${apiBaseUrl}${path}`;
}

async function request<T>(
  path: string,
  {
    method = "GET",
    body,
    form,
    headers: additionalHeaders,
  }: RequestOptions = {},
): Promise<T> {
  const url = getApiUrl(path);
  const headers = new Headers(additionalHeaders);
  headers.set("accept", "application/json");

  if (body !== undefined) {
    headers.set("content-type", "application/json");
  }

  if (form) {
    headers.set("content-type", "application/x-www-form-urlencoded");
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: form ?? (body === undefined ? undefined : JSON.stringify(body)),
      cache: "no-store",
      credentials: "include",
    });
  } catch (error) {
    if (isApiClientError(error)) throw error;

    throw new ApiClientError(
      "Unable to reach the Mionaire API. Check NEXT_PUBLIC_API_BASE_URL and the API's CORS origin.",
    );
  }

  const responseText = await response.text();
  let payload: unknown = null;

  if (responseText) {
    try {
      payload = JSON.parse(responseText) as unknown;
    } catch {
      if (!response.ok) {
        throw new ApiClientError(
          `The API returned an invalid response (${response.status}).`,
          response.status,
        );
      }
    }
  }

  if (!response.ok) {
    const errorBody = payload as ApiErrorBody | null;
    throw new ApiClientError(
      errorBody?.error?.message ?? `API request failed (${response.status}).`,
      response.status,
      errorBody?.error?.code,
    );
  }

  return payload as T;
}

type AuthRedirectResponse = {
  url?: string;
};

function getBrowserCallbackUrl(): string {
  if (typeof window === "undefined") {
    throw new ApiClientError(
      "Authentication can only be started in a browser.",
    );
  }

  return window.location.href;
}

async function runAuthAction(
  path: string,
  fields: Record<string, string> = {},
): Promise<string | null> {
  const { csrfToken } = await request<{ csrfToken: string }>("/auth/csrf");
  const payload = await request<AuthRedirectResponse>(path, {
    method: "POST",
    form: new URLSearchParams({
      ...fields,
      csrfToken,
      callbackUrl: getBrowserCallbackUrl(),
      redirect: "false",
    }),
    headers: { "X-Auth-Return-Redirect": "1" },
  });

  if (!payload.url) return null;

  const redirectUrl = new URL(payload.url, getApiUrl("/"));
  const authError = redirectUrl.searchParams.get("error");
  if (authError) {
    if (authError === "CredentialsSignin") {
      throw new ApiClientError("Invalid email or password.", 401, authError);
    }

    throw new ApiClientError(
      "Authentication failed. Please try again.",
      401,
      authError,
    );
  }

  return redirectUrl.toString();
}

export const apiClient = {
  register(input: { email: string; password: string; name?: string }) {
    return request<{ user: ApiUser }>("/api/v1/auth/register", {
      method: "POST",
      body: input,
    });
  },

  getSession() {
    return request<AuthSession | null>("/auth/session");
  },

  signInWithCredentials(input: { email: string; password: string }) {
    return runAuthAction("/auth/callback/credentials", input);
  },

  async signInWithDiscord() {
    const redirectUrl = await runAuthAction("/auth/signin/discord");
    if (!redirectUrl) {
      throw new ApiClientError("Discord sign-in did not return a redirect.");
    }

    window.location.assign(redirectUrl);
  },

  signOut() {
    return runAuthAction("/auth/signout");
  },

  startRandomGame(mode: GameMode) {
    return request<{ gameId: string }>("/api/v1/games/random", {
      method: "POST",
      body: { mode },
    });
  },

  startDailyGame(mode: GameMode) {
    return request<{ gameId: string }>("/api/v1/games/daily", {
      method: "POST",
      body: { mode },
    });
  },

  getIncompleteDailyGame() {
    return request<{ game: IncompleteDailyGame | null }>(
      "/api/v1/games/incomplete-daily",
    );
  },

  getGame(gameId: string) {
    return request<{ game: Game }>(
      `/api/v1/games/${encodeURIComponent(gameId)}`,
    );
  },

  answerQuestion(
    gameId: string,
    input: { choice: AnswerChoice; stage: number },
  ) {
    return request<{
      isRight: boolean;
      answer: AnswerChoice;
      won: boolean;
      gameEnded: boolean;
    }>(`/api/v1/games/${encodeURIComponent(gameId)}/answer`, {
      method: "POST",
      body: input,
    });
  },

  useFiftyFifty(gameId: string, questionId: number) {
    return request<{ hiddenAnswers: AnswerChoice[] }>(
      `/api/v1/games/${encodeURIComponent(gameId)}/jokers/fifty-fifty`,
      {
        method: "POST",
        body: { questionId },
      },
    );
  },

  useAudiencePoll(gameId: string, questionId: number) {
    return request<{ results: AudiencePollResult[]; total: number }>(
      `/api/v1/games/${encodeURIComponent(gameId)}/jokers/audience-poll`,
      {
        method: "POST",
        body: { questionId },
      },
    );
  },

  getPlayerRank() {
    return request<{ rank: PlayerRank | null }>("/api/v1/me/rank");
  },

  getPlayerStats() {
    return request<{ stats: PlayerStats | null }>("/api/v1/me/stats");
  },

  getOverallScores() {
    return request<{ scores: ScoreEntry[] }>("/api/v1/leaderboards/overall");
  },

  getDailyScores() {
    return request<{ scores: ScoreEntry[] }>("/api/v1/leaderboards/daily");
  },

  getDailyScoresToday() {
    return request<{ scores: ScoreEntry[] }>(
      "/api/v1/leaderboards/daily/today",
    );
  },

  getMionaires() {
    return request<{ mionaires: MionaireEntry[] }>(
      "/api/v1/leaderboards/mionaires",
    );
  },
};
