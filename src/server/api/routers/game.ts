import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

import { getQuestionsByStage } from "@/util/functions";

const today = new Date();
const startOfDay = new Date(today.setHours(0, 0, 0, 0));
const endOfDay = new Date(today.setHours(23, 59, 59, 999));

const DAILY_CUTOFF_HOUR = 1;
const TIMEZONE = "Europe/Paris";

function getCurrentDailySetId(): string {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setHours(DAILY_CUTOFF_HOUR, 0, 0, 0);

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  if (now < cutoff) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yYear = yesterday.getFullYear();
    const yMonth = String(yesterday.getMonth() + 1).padStart(2, "0");
    const yDay = String(yesterday.getDate()).padStart(2, "0");
    return `daily-${yYear}-${yMonth}-${yDay}`;
  }

  return `daily-${year}-${month}-${day}`;
}

export const gameRouter = createTRPCRouter({
  getPlayerRank: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session.user) return {};

    const existingUsers = await ctx.db.user.findMany({
      include: {
        games: true,
      },
    });
    const userScores = [];

    for (const user of existingUsers) {
      let userScore = 0;
      user.games.forEach((game) => {
        if (game.endedAt !== null) {
          const multiplier = (() => {
            switch (game.mode) {
              case "HARD":
                return 1.5;
              case "EASY":
                return 0.5;
              default:
                return 1;
            }
          })();

          userScore += Math.floor(game.stage * 100 * multiplier);
        }
      });
      userScores.push({ id: user.id, name: user.name, score: userScore });
    }
    const sortedScores = userScores.sort((a, b) => b.score - a.score);

    const playerScore = sortedScores.find(
      (score) => score.id === ctx.session.user.id,
    );

    if (!playerScore) return {};

    const rank = sortedScores.indexOf(playerScore) + 1;
    const { name, score } = playerScore;

    return { name, score, rank };
  }),
  getPlayerStats: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.session.user) return null;

    const player = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      include: { games: true },
    });

    if (!player) return null;

    let overallScore = 0;
    let dailyScoreAllTime = 0;
    let dailyScoreToday = 0;
    let gamesPlayed = 0;
    let bestStage = 0;
    const isMionaire = player.games.some(
      (g) => g.stage === 16 && g.endedAt !== null,
    );

    const getMultiplier = (mode: string) => {
      switch (mode) {
        case "HARD":
          return 1.5;
        case "EASY":
          return 0.5;
        default:
          return 1;
      }
    };

    const todayScores = new Map<string, number>();
    const allTimeScoresByDate = new Map<string, number>();

    for (const game of player.games) {
      if (game.endedAt === null) continue;

      gamesPlayed++;

      const multiplier = getMultiplier(game.mode);
      const gameScore = Math.floor(game.stage * 100 * multiplier);
      overallScore += gameScore;

      if (game.type === "daily") {
        if (game.dailySetId) {
          const todayExisting = todayScores.get(player.id);
          if (!todayExisting || gameScore > todayExisting) {
            todayScores.set(player.id, gameScore);
          }

          const playerDateKey = `${player.id}:${game.dailySetId}`;
          const allExisting = allTimeScoresByDate.get(playerDateKey);
          if (!allExisting || gameScore > allExisting) {
            allTimeScoresByDate.set(playerDateKey, gameScore);
          }
        }
      }

      const clearedStage = game.stage === 16 ? 15 : game.stage - 1;
      if (clearedStage > bestStage) {
        bestStage = clearedStage;
      }
    }

    dailyScoreToday = todayScores.get(player.id) ?? 0;
    for (const [key, score] of allTimeScoresByDate) {
      const playerId = key.split(":")[0];
      if (playerId === player.id) {
        dailyScoreAllTime += score;
      }
    }

    const allUsers = await ctx.db.user.findMany({
      include: { games: true },
    });

    const userScores = [];
    for (const user of allUsers) {
      let userScore = 0;
      user.games.forEach((g) => {
        if (g.endedAt !== null) {
          const m = (() => {
            switch (g.mode) {
              case "HARD":
                return 1.5;
              case "EASY":
                return 0.5;
              default:
                return 1;
            }
          })();
          userScore += Math.floor(g.stage * 100 * m);
        }
      });
      userScores.push({ id: user.id, score: userScore });
    }

    const sortedScores = userScores.sort((a, b) => b.score - a.score);
    const overallRank = sortedScores.findIndex((s) => s.id === player.id) + 1;

    return {
      name: player.name ?? "Unknown",
      image: player.image,
      overallScore,
      overallRank,
      dailyScoreAllTime,
      dailyScoreToday,
      gamesPlayed,
      bestStage,
      isMionaire,
    };
  }),
  getMionaires: publicProcedure.query(async ({ ctx }) => {
    const mionaires = await ctx.db.game.findMany({
      where: {
        stage: 16,
        endedAt: {
          not: null,
        },
      },
      orderBy: {
        endedAt: "asc",
      },
      include: {
        player: {
          select: {
            name: true,
          },
        },
      },
    });

    return mionaires.map((g) => ({
      name: g.player.name,
      date: `${new Date(g.endedAt!).toLocaleDateString()}`,
    }));
  }),
  getScores: publicProcedure.query(async ({ ctx }) => {
    const existingUsers = await ctx.db.user.findMany({
      include: {
        games: true,
      },
    });
    const userScores = [];

    for (const user of existingUsers) {
      let userScore = 0;
      user.games.forEach((game) => {
        if (game.endedAt !== null) {
          const multiplier = (() => {
            switch (game.mode) {
              case "HARD":
                return 1.5;
              case "EASY":
                return 0.5;
              default:
                return 1;
            }
          })();

          userScore += Math.floor(game.stage * 100 * multiplier);
        }
      });
      userScores.push({ id: user.id, name: user.name, score: userScore });
    }

    return userScores.sort((a, b) => b.score - a.score);
  }),
  getDailyScores: publicProcedure.query(async ({ ctx }) => {
    const games = await ctx.db.game.findMany({
      where: {
        type: "daily",
        endedAt: {
          not: null,
        },
        dailySetId: {
          not: null,
        },
      },
      include: {
        player: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const getMultiplier = (mode: string) => {
      switch (mode) {
        case "HARD":
          return 1.5;
        case "EASY":
          return 0.5;
        default:
          return 1;
      }
    };

    const scoresByDailySetAndPlayer = new Map<string, number>();

    for (const game of games) {
      if (!game.endedAt || !game.dailySetId) continue;
      const key = `${game.dailySetId}:${game.player.id}`;
      const gameScore = Math.floor(game.stage * 100 * getMultiplier(game.mode));

      const existing = scoresByDailySetAndPlayer.get(key);
      if (!existing || gameScore > existing) {
        scoresByDailySetAndPlayer.set(key, gameScore);
      }
    }

    const playerScores = new Map<
      string,
      { id: string; name: string; score: number }
    >();

    for (const [key, score] of scoresByDailySetAndPlayer) {
      const playerId = key.split(":")[1];
      const player = games.find((g) => g.player.id === playerId)?.player;
      if (!player) continue;

      const existing = playerScores.get(player.id);
      if (existing) {
        existing.score += score;
      } else {
        playerScores.set(player.id, {
          id: player.id,
          name: player.name ?? "Unknown",
          score,
        });
      }
    }

    return Array.from(playerScores.values()).sort((a, b) => b.score - a.score);
  }),
  getDailyScoresToday: publicProcedure.query(async ({ ctx }) => {
    const currentDailySetId = getCurrentDailySetId();
    const games = await ctx.db.game.findMany({
      where: {
        type: "daily",
        endedAt: {
          not: null,
        },
        dailySetId: currentDailySetId,
      },
      include: {
        player: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const getMultiplier = (mode: string) => {
      switch (mode) {
        case "HARD":
          return 1.5;
        case "EASY":
          return 0.5;
        default:
          return 1;
      }
    };

    const playerScores = new Map<
      string,
      { id: string; name: string; score: number }
    >();

    for (const game of games) {
      const gameScore = Math.floor(game.stage * 100 * getMultiplier(game.mode));

      const existing = playerScores.get(game.player.id);
      if (!existing || gameScore > existing.score) {
        playerScores.set(game.player.id, {
          id: game.player.id,
          name: game.player.name ?? "Unknown",
          score: gameScore,
        });
      }
    }

    return Array.from(playerScores.values()).sort((a, b) => b.score - a.score);
  }),
  makeDaily: protectedProcedure
    .input(
      z.object({
        mode: z.enum(["EASY", "NORMAL", "HARD"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { mode } = input;
      const currentDailySetId = getCurrentDailySetId();

      const existingGame = await ctx.db.game.findFirst({
        where: {
          playerId: ctx.session.user.id,
          type: "daily",
          mode,
          dailySetId: currentDailySetId,
        },
        include: {
          questions: {
            select: {
              stage: true,
              question: true,
              A: true,
              B: true,
              C: true,
              D: true,
            },
          },
        },
      });

      if (existingGame) {
        if (existingGame.endedAt === null) {
          return existingGame.id;
        }
        throw new Error(
          "You have already completed today's daily challenge for this mode!",
        );
      }

      const latestDailySet = await ctx.db.question.findFirst({
        where: {
          mode,
          isDaily: true,
          dailySetId: currentDailySetId,
        },
        select: {
          dailySetId: true,
        },
      });

      if (!latestDailySet) {
        throw new Error("no daily questions available. try again later.");
      }

      const questions = await ctx.db.question.findMany({
        where: {
          mode,
          isDaily: true,
          dailySetId: latestDailySet.dailySetId,
        },
        orderBy: {
          stage: "asc",
        },
      });

      if (!questions || questions.length < 15) {
        throw new Error("incomplete daily set. try again later.");
      }

      const pickedQuestions = getQuestionsByStage(
        questions.map((q) => ({ id: q.id, stage: q.stage })),
      );

      const createdGame = await ctx.db.game.create({
        data: {
          mode,
          type: "daily",
          dailySetId: currentDailySetId,
          questions: {
            connect: pickedQuestions,
          },
          player: {
            connect: {
              id: ctx.session.user.id,
            },
          },
        },
      });

      return createdGame.id;
    }),
  getIncompleteDailyGame: protectedProcedure.query(async ({ ctx }) => {
    const currentDailySetId = getCurrentDailySetId();

    const game = await ctx.db.game.findFirst({
      where: {
        playerId: ctx.session.user.id,
        type: "daily",
        endedAt: null,
        dailySetId: currentDailySetId,
      },
      select: {
        id: true,
        mode: true,
        stage: true,
      },
    });

    return game;
  }),
  getGame: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const game = await ctx.db.game.findUnique({
        where: {
          id: input,
        },
        include: {
          questions: {
            select: {
              id: true,
              stage: true,
              question: true,
              A: true,
              B: true,
              C: true,
              D: true,
            },
          },
        },
      });

      if (!game) {
        throw new Error("START A NEW GAME. — GAME NOT FOUND.");
      }

      if (game.playerId !== ctx.session.user.id) {
        throw new Error("START A NEW GAME. — INVALID SESSION.");
      }

      if (game.endedAt !== null) {
        throw new Error("START A NEW GAME. — GAME ENDED.");
      }

      return game;
    }),
  makeRandom: protectedProcedure
    .input(
      z.object({
        mode: z.enum(["EASY", "NORMAL", "HARD"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { mode } = input;

      const questions = await ctx.db.question.findMany({
        where: {
          mode,
        },
        orderBy: {
          stage: "asc",
        },
      });

      if (!questions) {
        throw new Error("no questions found. try again later.");
      }

      const pickedQuestions = getQuestionsByStage(
        questions.map((q) => ({ id: q.id, stage: q.stage })),
      );

      const createdGame = await ctx.db.game.create({
        data: {
          mode,
          type: "random",
          questions: {
            connect: pickedQuestions,
          },
          player: {
            connect: {
              id: ctx.session.user.id,
            },
          },
        },
      });

      return createdGame.id;
    }),
});
