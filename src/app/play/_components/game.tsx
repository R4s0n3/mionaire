'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '@/trpc/react'
import LoadingSpinner from '@/app/_components/loading-spinner'
import SideBar from './side-bar'

interface GameProps {
  game: string
}

interface Answer {
  key: 'A' | 'B' | 'C' | 'D'
  value: string
}

export default function Game({ game }: GameProps) {
  const [error, setError] = useState<string | null>(null)
  const [pickedAnswer, setPickedAnswer] = useState<string>('')
  const [rightAnswer, setRightAnswer] = useState<string>('')

  // Fetch game data
  const { data, isLoading, error: queryError } = api.game.getGame.useQuery(game)

  const currentStage = data?.stage ?? 1
  const utils = api.useUtils()

  const { mutate: evaluateAnswer, isPending: isEvaluating } = api.question.eval.useMutation({
    onSuccess: async (data) => {
      setRightAnswer(data.answer)
      if (data.isRight) {
        setTimeout(() => {
          setRightAnswer('')
          setPickedAnswer('')
          void utils.game.getGame.invalidate(game)
        }, 1000)
      } else {
        setTimeout(() => {
          setRightAnswer('')
          setPickedAnswer('')
        setError(`Game Over - False Answer! \n Right Answer: ${data.answer}`)
      }, 1000)
      }
    },
    onError: (err) => setError(err.message),
  })

  const currentQuestion = data?.questions.find((q) => q.stage === currentStage)



  // Show loading with ads when fetching more questions
  if (isLoading  || !currentQuestion) {
    return (
      <div className='w-full flex justify-center items-center flex-col gap-4'>
        <LoadingSpinner />
        <div>Loading new questions...</div>
      </div>
    )
  }

  // Error state
  if (error || queryError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 text-center">
        
        <h5 className="text-3xl flex flex-col gap-2 font-bold lg:text-5xl">{error?.split("\n").map((i,idx) => <span key={idx}>{i}</span>) ?? queryError?.message}</h5>
        <div className="flex gap-4">
          <Link href="/play" className="flex items-center justify-center rounded-full border-2 border-body bg-primary-dark p-3 px-6 text-xl hover:border-primary-light hover:bg-primary">
            New Game
          </Link>
          <Link href="/" className="flex items-center justify-center rounded-full border-2 border-body bg-primary-dark p-3 px-6 text-xl hover:border-primary-light hover:bg-primary">
            Home
          </Link>
        </div>
      </div>
    )
  }

  // Prepare answers
  const answers: Answer[] = ['A', 'B', 'C', 'D'].map((key) => ({
    key: key as 'A' | 'B' | 'C' | 'D',
    value: currentQuestion[key as keyof typeof currentQuestion] as string,
  }))

  const handlePickedAnswer = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    const userAnswer = e.currentTarget.id as 'A' | 'B' | 'C' | 'D'
    setPickedAnswer(userAnswer)
    setTimeout(() => {
      evaluateAnswer({ gameId: game, choice: userAnswer, stage: currentStage })
    },800)
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center">
      <SideBar currentStage={currentStage} />
      <div className="flex w-full max-w-screen-xl flex-col items-center justify-center gap-16 p-4">
        <div className="flex w-full flex-col items-center justify-center gap-4 text-center">
          <h2 className="font-black uppercase">Stage {currentStage}</h2>
          <h5 className="text-2xl font-bold lg:text-4xl">{currentQuestion.question}</h5>
        </div>
        <div className="grid w-full grid-cols-2 gap-8">
          {answers.map(({ key, value }) => (
            <button
              type="button"
              id={key}
              key={key}
              disabled={isEvaluating}
              onClick={handlePickedAnswer}
              className={`
                col-span-2 
                flex items-center justify-between 
                rounded-full border-2 
                cursor-pointer
                p-3 px-6 text-xl 
                lg:col-span-1
                border-body bg-primary-dark
                hover:border-primary-light hover:bg-primary
                disabled:animate-pulse
                focus:border-highlight-purple focus:bg-highlight-purple/50 focus:text-highlight-purple
                group
                ${pickedAnswer === key && !rightAnswer && 'border-highlight-purple bg-highlight-purple/50 text-highlight-purple'}
                ${rightAnswer && pickedAnswer === key && rightAnswer === key && 'border-green-300 bg-green-300/80 text-green-300 animate-blink'}
                ${rightAnswer && pickedAnswer === key && rightAnswer !== key && 'border-red-300 bg-red-300/80 text-red-300 animate-blink'} 
              `}
            >
             <span className=' group-hover:border-primary-light group-hover:text-primary-light px-2 border-r-2 mr-2'>{key}</span> <span>{value}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}