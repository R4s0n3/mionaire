'use client'

import { api } from "@/trpc/react"

export default function LeaderboardList(){
    const [userScores] = api.game.getScores.useSuspenseQuery()

    return <div className="w-full bg-primary-dark max-h-80 overflow-y-auto">
        {userScores.sort((a,b) => b.score - a.score).slice(0, 10).map((u, i) => <div className={`p-2 px-4 flex justify-between bg-primary-dark ${i % 2 && "bg-primary-light"}`} key={i}>
            <span>#{i + 1}</span> 
            <span>{u.score}</span>
            <span>{u.name}</span> 
        </div>)}
    </div>
}