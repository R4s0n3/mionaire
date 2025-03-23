'use client'

import LoadingSpinner from "@/app/_components/loading-spinner"
import { api } from "@/trpc/react"
import SideBar from "./side-bar"
import { useState } from "react"

import Link from "next/link"

export default function Game({game}:{game:string}){
    const [error, setError] = useState<string>()
    const [pickedAnswer, setPickedAnswer] = useState("")
    const {data, isLoading} = api.game.getGame.useQuery(game)
    
    const [currentStage, setCurrentStage] = useState(1)

    const utils = api.useUtils()
    const evalQuestion = api.question.eval.useMutation({
        onSuccess:async (data) => {
            setCurrentStage(data.stage)
            await utils.game.invalidate()
            setPickedAnswer("")
        },
        onError: err => setError(err.message)
    })

    
    const currentQuestion = data?.questions.find(q => q.stage === currentStage)

    if(isLoading || !currentQuestion) return <LoadingSpinner />

    const {A, B, C, D} = currentQuestion

    const answers = [{ A }, { B }, { C }, { D }]

    async function handlePickedAnswer(e:React.MouseEvent<HTMLButtonElement>){
        e.preventDefault()
        e.stopPropagation()

        const userAnswer = e.currentTarget.id
        setPickedAnswer(userAnswer)
        await evalQuestion.mutateAsync({
            gameId: game,
            choice: userAnswer,
            stage: currentStage
        })
    }
    if(error) return <div className="flex flex-col gap-8
     justify-center items-center text-center">
                <h5 className="text-3xl lg:text-5xl font-bold">{error}</h5>
                <div className="flex gap-4">

                <Link className="flex justify-center items-center text-center p-3 px-6 border-2 border-body hover:border-primary-light hover:bg-primary rounded-full bg-primary-dark text-xl" href="/play">New Game</Link>
                <Link className="flex justify-center items-center text-center p-3 px-6 border-2 border-body hover:border-primary-light hover:bg-primary rounded-full bg-primary-dark text-xl" href="/">Home</Link>
                </div>

    </div>
    return <div className="size-full min-h-screen relative flex justify-center items-center">
    <SideBar currentStage={data?.stage ?? 1} />
    <div className="w-full max-w-screen-xl gap-16 flex flex-col justify-center items-center p-4">

        <div className="w-full flex flex-col gap-4 justify-center items-center text-center">

        <h2 className="uppercase font-black">Stage {data?.stage}</h2>
        <h5 className="text-3xl lg:text-5xl font-bold">{currentQuestion?.question}</h5>
        </div>
        <div className="grid grid-cols-2 w-full gap-8">
            {answers.map((answer, idx) => {
                const key = Object.keys(answer)[0] as "A" | "B" | "C" | "D"
                const value = answer[key];
                return <button type="button" disabled={evalQuestion.isPending} id={key} onClick={handlePickedAnswer} key={idx} className={`col-span-2 lg:col-span-1 flex justify-center  items-center text-center p-3 px-6 cursor-pointer border-2 border-body hover:border-primary-light disabled:animate-pulse hover:bg-primary rounded-full text-xl ${pickedAnswer === key ? "bg-highlight-purple/50 text-highlight-purple border-highlight-purple" : "bg-primary-dark"}`}>{value}</button>})}
        </div>
    </div>
    </div>
}