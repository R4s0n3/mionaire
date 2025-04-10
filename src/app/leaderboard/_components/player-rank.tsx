'use client'

import { api } from "@/trpc/react"

export default function PlayerRank(){
    const [playerRank] = api.game.getPlayerRank.useSuspenseQuery()
    
    return <div className="size-full flex flex-col gap-4 p-2 px-4 justify-between items-center bg-gradient-to-br from-highlight-purple/90 to-highlight-purple/60 border border-highlight-purple shadow-xl rounded-2xl">
        <div className="flex gap-8 justify-between w-full">

        <div className="flex flex-col ">

        <h5 >PLAYER:</h5>
        <span className="text-2xl text-highlight-gold">{playerRank.name}</span>
        </div>
        

        <div className="flex justify-center flex-col items-center text-center">
        <h5 >Rank:</h5>
        <span className="text-2xl text-secondary">#{playerRank.rank}</span>
      
        </div>
        </div>
        <div className=" text-center text-sm">
        <h5>Allstars Score:</h5>
        <span className="text-secondary text-xs">{playerRank.score}</span>
        </div>
    </div>
}