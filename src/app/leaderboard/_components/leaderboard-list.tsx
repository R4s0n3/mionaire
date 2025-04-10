'use client'

import { api } from "@/trpc/react"
import { Crown } from "lucide-react"

export default function LeaderboardList(){
    const [userScores] = api.game.getScores.useSuspenseQuery()

    return <div className="size-full aspect-video flex flex-col items-center bg-gradient-to-br from-highlight-gold/90 text-body to-highlight-gold/60 border border-highlight-gold shadow-xl rounded-xl overflow-y-auto relative">
        <h5 className="sticky top-0 p-2 px-4 w-full flex items-center gap-1.5 justify-center bg-highlight-gold text-highlight-purple">
            <Crown size={14} />
            Allstars
            <Crown size={14} />
            </h5>
        {userScores.sort((a,b) => b.score - a.score).slice(0, 10).map((u, i) => <div className={`p-2 px-4 w-full flex gap-4 text-sm items-center bg-highlight-gold/20 ${i % 2 && "bg-highlight-gold/40 text-body"}`} key={i}>
            <span>#{i + 1}</span> 
            <span className="truncate">{u.name}</span> 
            <span className="text-center ml-auto">{u.score}</span>
        </div>)}
       
    </div>
}