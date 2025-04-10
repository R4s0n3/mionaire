'use client'

import { api } from "@/trpc/react"

export default function MioScoreList(){
    const [mioScores] = api.game.getMionaires.useSuspenseQuery()
    return <div className="size-full aspect-video flex flex-col items-center bg-gradient-to-br from-primary/90 to-primary-dark/30 border border-primary shadow-xl rounded-xl overflow-y-auto relative text-body">
        <h5 className="sticky top-0 p-2 px-4 w-full flex justify-center bg-primary-dark uppercase ">Recent Mionaires</h5>
        {mioScores.length === 0 && <div className={`p-2 px-4 w-full flex justify-between bg-primary-light`}>
            <p className="text-center w-full">no scores..</p>
        </div>}
        {mioScores.map((u, i) => <div className={`p-2 px-4 text-sm w-full flex justify-between items-center bg-primary-dark/20 ${i % 2 && "bg-primary-light/20"}`} key={i}>
            <p className="truncate w-1/2">{u.name}</p> 
            <p className="text-right text-xs w-full">{u.date}</p>
        </div>)}
       
    </div>
}