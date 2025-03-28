import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import generateQuestion from "@/util/ai-functions";

export const gameRouter = createTRPCRouter({
  getPlayerRank: protectedProcedure
  .query(async ({ctx}) => {
    if(!ctx.session.user) return {}
    
    const existingUsers = await ctx.db.user.findMany({
      include:{
        games:true
      }
    })
    const userScores = []

    for(const user of existingUsers){
      let userScore = 0
      user.games.forEach(game => {  
        if(game.endedAt !== null){
          const multiplier = (() => {
            switch (game.mode) {
              case "HARD":
                return 1.5
              case "EASY":
                return 0.5
              default:
                return 1
            }
          })()

          userScore += Math.floor(game.stage * 100 * multiplier)
        }
      })
      userScores.push({ id:user.id, name:user.name, score: userScore })
    }    
    const sortedScores = userScores
    .sort((a,b) => b.score - a.score)

    const playerScore = sortedScores
    .find(score => score.id === ctx.session.user.id)

    if(!playerScore) return {}

    const rank = sortedScores.indexOf(playerScore) + 1
    const {name, score} = playerScore

    return {name, score, rank}
  }),
  getScores: publicProcedure
  .query(async ({ctx}) => {
    const existingUsers = await ctx.db.user.findMany({
      include:{
        games:true
      }
    })
    const userScores = []

    for(const user of existingUsers){
      let userScore = 0
      user.games.forEach(game => {  
        if(game.endedAt !== null){
          const multiplier = (() => {
            switch (game.mode) {
              case "HARD":
                return 1.5
              case "EASY":
                return 0.5
              default:
                return 1
            }
          })()

          userScore += Math.floor(game.stage * 100 * multiplier)
        }
      })
      userScores.push({ id:user.id, name:user.name, score: userScore })
    }

    return userScores
  }),
  getGame: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
        return ctx.db.game.findFirst({
            where:{
                id:input
            },
            include:{
                questions:{
                  select:{
                    stage:true,
                    question:true,
                    A: true,
                    B: true,
                    C: true,
                    D: true
                  }
                }
            }
        })
    }),
  create: protectedProcedure
    .input(z.object({ 
      mode: z.enum(["EASY", "NORMAL", "HARD"]),
    }))
    .mutation(async ({ ctx, input }) => {

    const { mode } = input
    // 1. Generate questions and transform them in one go using map
    const generatedQuestions = await generateQuestion({mode});
    const newQuestions = generatedQuestions.map((question, index) => ({
      question: question.question,
      A: question.A,
      B: question.B,
      C: question.C,
      D: question.D,
      answer: question.answer,
      mode,
      stage: index + 1
    }));

    // 2. Use prisma's create with nested writes in a single transaction
    const createdGame = await ctx.db.game.create({
      data: {
        stage: 1,
        mode,
        player: {
          connect: {
            id: ctx.session.user.id
          }
        },
        questions: {
          create:  newQuestions
        }
      }
    });

    return createdGame.id;
    }),
});
