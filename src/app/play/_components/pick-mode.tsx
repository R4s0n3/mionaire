'use client'

import { api } from "@/trpc/react"
import { useRouter } from "next/navigation"
import LoadingSpinner from "@/app/_components/loading-spinner"
import { useState } from "react"

export default function PickMode(){
    const router = useRouter()
    const [errorMsg, setErrorMsg] = useState<string>()
    const {mutateAsync:createGame, isPending, isSuccess} = api.game.makeRandom.useMutation({
        onSuccess: (data) => {
            router.push(`?game=${data}`)
        },
        onError:(error) => {
            setErrorMsg(error.message)
        }
    })

    async function handleClickedButton(
        event: React. MouseEvent<HTMLButtonElement>
    ){
        const eventMode = event.
        currentTarget.value as "EASY" | "NORMAL" | "HARD"
        await createGame({mode: eventMode})
    }

    if(errorMsg){
        return <div className="w-full flex flex-col items-center justify-center gap-4 ">
            
            <h5>Error:</h5>
            <h6>{errorMsg}</h6>
            <p>reload page</p>
            </div>
    }
    if(isPending || isSuccess){
        return <div className="w-full flex flex-col items-center justify-center gap-4 ">
            <LoadingSpinner />
            <h5>Creating game...</h5>
            </div>
    }

    return <div className="w-full max-w-xl flex justify-center items-center flex-col gap-8">
        <h2 className="text-4xl font-bold">PICK A MODE</h2>
        <div className="w-full flex justify-between gap-8 p-4 flex-col lg:flex-row ">
        {["EASY", "NORMAL", "HARD"].map((mode, idx)=> <button
        onClick={handleClickedButton}
        type="button"
        value={mode}
        key={idx}
            className="p-2 border-2 hover:border-highlight-purple hover:text-highlight-purple flex-1 rounded-full px-6" 
        >
            {mode}
        </button>)}
        </div>
    </div>
}