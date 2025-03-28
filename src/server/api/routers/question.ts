import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
} from "@/server/api/trpc";

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
      throw new Error("START A NEW GAME. — GAME ENDED.")
     }
     
     if(!existingGame){
      throw new Error("START A NEW GAME. — NO GAME.")
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

      return false
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

     await ctx.db.game.update({
      where:{
        id:gameId
      },
      data:{
        stage: {
          increment: 1
        }
      }
     })

     
     return true

    }),
});
