import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const questionRouter = createTRPCRouter({
  eval: protectedProcedure
    .input(
      z.object({
        gameId: z.string(),
        choice: z.string(),
        stage: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { choice, stage, gameId } = input;

      const existingGame = await ctx.db.game.findUnique({
        where: {
          id: gameId,
        },
        include: {
          questions: true,
        },
      });

      if (!existingGame) {
        throw new Error("START A NEW GAME. — NO GAME.");
      }

      if (existingGame.playerId !== ctx.session.user.id) {
        throw new Error("NOT ALLOWED!");
      }

      if (existingGame.endedAt !== null) {
        throw new Error("START A NEW GAME. — GAME ENDED.");
      }

      const gameQuestions = existingGame.questions;

      const currentQuestion = gameQuestions.find((q) => q.stage === stage);

      if (!currentQuestion) {
        throw new Error("Question not found");
      }

      const { answer } = currentQuestion;

      await ctx.db.vote
        .create({
          data: {
            questionId: currentQuestion.id,
            gameId,
            choice,
          },
        })
        .catch((_e) => {
          // Vote might already exist, ignore error
        });

      if (answer !== choice) {
        await ctx.db.game.update({
          where: {
            id: gameId,
          },
          data: {
            endedAt: new Date(),
          },
        });

        return {
          isRight: answer === choice,
          answer,
        };
      }

      if (stage === 15) {
        await ctx.db.game.update({
          where: {
            id: gameId,
          },
          data: {
            stage: 16,
            endedAt: new Date(),
          },
        });

        return {
          isRight: answer === choice,
          answer,
        };
      }

      await ctx.db.game.update({
        where: {
          id: gameId,
        },
        data: {
          stage: {
            increment: 1,
          },
        },
      });

      return {
        isRight: answer === choice,
        answer,
      };
    }),
});
