'use client'

import { api } from "@/trpc/react"
import { useRouter } from "next/navigation"
import LoadingSpinner from "@/app/_components/loading-spinner"
export default function PickMode(){
    const router = useRouter()

    const {mutateAsync:createGame, isPending} = api.game.create.useMutation({
        onSuccess: (data) => {
            router.push(`?game=${data}`)
        }
    })

    async function handleClickedButton(
        event: React. MouseEvent<HTMLButtonElement>
    ){
        const eventMode = event.
        currentTarget.value as "EASY" | "NORMAL" | "HARD"
        await createGame({mode: eventMode})
    }

    if(isPending){
        return <LoadingSpinner />
    }

    return <div className="w-full max-w-xl flex justify-center items-center flex-col gap-8">
        <h2 className="text-4xl font-bold">PICK A MODE</h2>
        <div className="w-full flex justify-between gap-8 flex-col lg:flex-row ">
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