import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const jokerRouter = createTRPCRouter({
  useFiftyFifty: protectedProcedure
    .input(z.object({ gameId: z.string(), questionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { gameId, questionId } = input;

      const game = await ctx.db.game.findUnique({
        where: { id: gameId },
        include: {
          questions: {
            where: { id: questionId },
            select: {
              id: true,
              A: true,
              B: true,
              C: true,
              D: true,
              answer: true,
            },
          },
        },
      });

      if (!game || game.playerId !== ctx.session.user.id) {
        throw new Error("Game not found or not authorized");
      }

      if (game.fifty_fifty) {
        throw new Error("50:50 already used");
      }

      if (game.endedAt !== null) {
        throw new Error("Game ended");
      }

      const question = game.questions[0];
      if (!question) {
        throw new Error("Question not found");
      }

      const wrongAnswers = (["A", "B", "C", "D"] as const)
        .filter((key) => key !== question.answer)
        .sort(() => Math.random() - 0.5)
        .slice(0, 2);

      await ctx.db.game.update({
        where: { id: gameId },
        data: { fifty_fifty: true },
      });

      return { hiddenAnswers: wrongAnswers };
    }),

  useAudiencePoll: protectedProcedure
    .input(z.object({ gameId: z.string(), questionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { gameId, questionId } = input;

      const game = await ctx.db.game.findUnique({
        where: { id: gameId },
        include: {
          questions: {
            where: { id: questionId },
          },
        },
      });

      if (!game || game.playerId !== ctx.session.user.id) {
        throw new Error("Game not found or not authorized");
      }

      if (game.audience_poll) {
        throw new Error("Audience Poll already used");
      }

      if (game.endedAt !== null) {
        throw new Error("Game ended");
      }

      await ctx.db.game.update({
        where: { id: gameId },
        data: { audience_poll: true },
      });

      const votes = await ctx.db.vote.findMany({
        where: { questionId },
      });

      const counts = { A: 0, B: 0, C: 0, D: 0 };
      const total = votes.length;

      for (const vote of votes) {
        if (counts.hasOwnProperty(vote.choice)) {
          counts[vote.choice as keyof typeof counts]++;
        }
      }

      const results = Object.entries(counts).map(([answer, count]) => ({
        answer,
        count,
        percent: total > 0 ? Math.round((count / total) * 100) : 0,
      }));

      return { results, total };
    }),
});
