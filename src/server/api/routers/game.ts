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
  getMionaires: publicProcedure
  .query(async ({ctx}) => {
    const mionaires = await ctx.db.game.findMany({
      where:{
        stage:16,
        endedAt:{
          not:null
        }
      },
      orderBy:{
        endedAt:"asc"
      },
      include: {
        player: {
          select:{
            name:true
          }
        }
      }
    })

    return mionaires.map(g => ({
      name:g.player.name,
      date: `${new Date(g.endedAt!).toLocaleDateString()}`
    }))
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
  makeDaily: protectedProcedure
  .input(z.object({
    mode: z.enum(['EASY', 'NORMAL', 'HARD'])
  }))
  .query(async ({ctx, input}) => {

    const{ mode } = input

    const questionsToday = await ctx.db.question.findMany({
      where:{
        mode,
        createdAt:{
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy:{
        stage: 'asc'
      }
    })

    if(!questionsToday){
      throw new Error("no questions found. try again later.")
    }

    const pickedQuestions = getQuestionsByStage(questionsToday
      .map(q => ({id:q.id, stage:q.stage})))
      
    const createdGame = await ctx.db.game.create({
      data:{
        mode,
        type:"daily",
        questions:{
          connect:pickedQuestions
        },
        player:{
          connect:{
            id: ctx.session.user.id
          }
        }
      }
    })

    return createdGame.id
  }),
  getGame: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {

        const game  = await ctx.db.game.findUnique({
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

        if(!game){
          throw new Error("START A NEW GAME. — GAME NOT FOUND.")
        }

        if(game.playerId !== ctx.session.user.id){
          throw new Error("START A NEW GAME. — INVALID SESSION.")
        }

        if(game.endedAt !== null){
          throw new Error("START A NEW GAME. — GAME ENDED.")
         }

         return game
    }),
  makeRandom: protectedProcedure
    .input(z.object({ 
      mode: z.enum(["EASY", "NORMAL", "HARD"]),
    }))
    .mutation(async ({ ctx, input }) => {

      const{ mode } = input

      const questions = await ctx.db.question.findMany({
        where:{
          mode
        },
        orderBy:{
          stage: 'asc'
        }
      })
  
      if(!questions){
        throw new Error("no questions found. try again later.")
      }
  
      const pickedQuestions = getQuestionsByStage(questions
        .map(q => ({id:q.id, stage:q.stage})))
        
      const createdGame = await ctx.db.game.create({
        data:{
          mode,
          type:"random",
          questions:{
            connect:pickedQuestions
          },
          player:{
            connect:{
              id: ctx.session.user.id
            }
          }
        }
      })
  
      return createdGame.id
    }),
});
