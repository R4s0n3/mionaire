'use client'

import { api } from "@/trpc/react"

export default function PlayerRank(){
    const [playerRank] = api.game.getPlayerRank.useSuspenseQuery()
    
    return <div className="w-full flex p-2 px-4 justify-between items-center bg-highlight-purple">
        <div className="flex justify-center items-center text-center">
        #{playerRank.rank}
        </div>
            <span>{playerRank.score}</span>
            <span>{playerRank.name}</span>
    </div>
}