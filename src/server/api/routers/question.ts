import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";
import generateQuestion from "@/util/ai-functions";

export const questionRouter = createTRPCRouter({
  eval: protectedProcedure
    .input(z.object({ 
      gameId: z.string(),
      choice: z.string(),
      stage: z.number()
    }))
    .mutation(async ({ ctx, input }) => {

     const { choice, stage, gameId} = input
     
     const existingGame = await ctx.db.game.findUnique({
      where:{
        id:gameId
      },include:{
        questions:true
      }
     })
     if(existingGame?.endedAt !== null){
      throw new Error("GAME FINISHED ALREADY")
     }
     
     if(!existingGame){
      throw new Error("NO GAME FOUND!")
     }

     const gameQuestions = existingGame.questions

     const currentQuestion = gameQuestions.find(
      q => q.stage === stage
     )


     if(currentQuestion?.answer !== choice){
        await ctx.db.game.update({
          where:{
            id: gameId
          },
          data:{
            endedAt: new Date()
          }
        })

        throw new Error("WRONG ANSWER, GAME OVER!")
     }

     if(stage === 15){
      await ctx.db.game.update({
        where:{
          id:gameId
        },
        data:{
          endedAt: new Date()
        }
       })

       throw new Error("CONGRATULATIONS! YOU ARE THE MIONAIRE!!")
     }

     const syncedGame = await ctx.db.game.update({
      where:{
        id:gameId
      },
      data:{
        stage: {
          increment: 1
        }
      }
     })

     const mode = syncedGame.mode
     const newStage = syncedGame.stage

     const generatedQuestion = await generateQuestion({ stage:newStage, mode, questions: gameQuestions.map(q => {
      const { A, B, C, D, question, answer } = q

      return {
        question,
        answer,
        A, B, C, D
      }

     }) })
     const { question, A, B, C, D, answer } = generatedQuestion

     const createdQuestion = await ctx.db.question.create({
        data: {
          question,
          A,
          B,
          C,
          D,
          answer,
          mode,
          stage: newStage,
          games: {
            connect:{
              id: gameId
            }
          }
        },
        select:{
          question:true,
          stage:true,
          A:true,
          B:true,
          C:true,
          D:true
        },
      });
     
      return createdQuestion
    }),
});
