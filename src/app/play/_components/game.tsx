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

  // Fetch game data
  const { data, isLoading, error: queryError } = api.game.getGame.useQuery(game)

  const currentStage = data?.stage ?? 1
  const utils = api.useUtils()

  const { mutateAsync: evaluateAnswer, isPending: isEvaluating } = api.question.eval.useMutation({
    onSuccess: async (isCorrect) => {
      if (isCorrect) {
        setPickedAnswer('')
        await utils.game.getGame.invalidate(game)
    } else {
        setError('Game Over - False Answer')
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
        
        <h5 className="text-3xl font-bold lg:text-5xl">{error ?? queryError?.message}</h5>
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
    await evaluateAnswer({ gameId: game, choice: userAnswer, stage: currentStage })
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center">
      <SideBar currentStage={currentStage} />
      <div className="flex w-full max-w-screen-xl flex-col items-center justify-center gap-16 p-4">
        <div className="flex w-full flex-col items-center justify-center gap-4 text-center">
          <h2 className="font-black uppercase">Stage {currentStage}</h2>
          <h5 className="text-3xl font-bold lg:text-5xl">{currentQuestion.question}</h5>
        </div>
        <div className="grid w-full grid-cols-2 gap-8">
          {answers.map(({ key, value }) => (
            <button
              type="button"
              id={key}
              key={key}
              disabled={isEvaluating}
              onClick={handlePickedAnswer}
              className={`col-span-2 flex items-center justify-center rounded-full border-2 border-body p-3 px-6 text-xl hover:border-primary-light hover:bg-primary disabled:animate-pulse lg:col-span-1 ${
                pickedAnswer === key
                  ? 'border-highlight-purple bg-highlight-purple/50 text-highlight-purple'
                  : 'bg-primary-dark'
              }`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}