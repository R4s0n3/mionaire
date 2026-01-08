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

    for (const game of player.games) {
      if (game.endedAt === null) continue;

      gamesPlayed++;

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

      const gameScore = Math.floor(game.stage * 100 * multiplier);
      overallScore += gameScore;

      if (game.type === "daily") {
        dailyScoreAllTime += gameScore;
        if (game.endedAt >= startOfDay && game.endedAt <= endOfDay) {
          dailyScoreToday += gameScore;
        }
      }

      if (game.stage > bestStage) {
        bestStage = game.stage;
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

    const playerScores = new Map<
      string,
      { id: string; name: string; score: number }
    >();

    for (const game of games) {
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
      const gameScore = Math.floor(game.stage * 100 * multiplier);

      const existing = playerScores.get(game.player.id);
      if (existing) {
        existing.score += gameScore;
      } else {
        playerScores.set(game.player.id, {
          id: game.player.id,
          name: game.player.name ?? "Unknown",
          score: gameScore,
        });
      }
    }

    return Array.from(playerScores.values()).sort((a, b) => b.score - a.score);
  }),
  getDailyScoresToday: publicProcedure.query(async ({ ctx }) => {
    const games = await ctx.db.game.findMany({
      where: {
        type: "daily",
        endedAt: {
          not: null,
          gte: startOfDay,
          lte: endOfDay,
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

    const playerScores = new Map<
      string,
      { id: string; name: string; score: number }
    >();

    for (const game of games) {
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
      const gameScore = Math.floor(game.stage * 100 * multiplier);

      const existing = playerScores.get(game.player.id);
      if (existing) {
        existing.score += gameScore;
      } else {
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

      const questionsToday = await ctx.db.question.findMany({
        where: {
          mode,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        orderBy: {
          stage: "asc",
        },
      });

      if (!questionsToday) {
        throw new Error("no questions found. try again later.");
      }

      const pickedQuestions = getQuestionsByStage(
        questionsToday.map((q) => ({ id: q.id, stage: q.stage })),
      );

      const createdGame = await ctx.db.game.create({
        data: {
          mode,
          type: "daily",
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
  makeChallenger: protectedProcedure
    .input(
      z.object({
        mode: z.enum(["EASY", "NORMAL", "HARD"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { mode } = input;

      // Get the latest daily set for this mode
      const latestDailySet = await ctx.db.question.findFirst({
        where: {
          mode,
          isDaily: true,
        },
        orderBy: {
          createdAt: "desc",
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
          type: "challenger",
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
