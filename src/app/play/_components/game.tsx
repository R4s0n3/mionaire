"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/trpc/react";
import LoadingSpinner from "@/app/_components/loading-spinner";
import SideBar from "./side-bar";

interface GameProps {
  game: string;
}

interface Answer {
  key: "A" | "B" | "C" | "D";
  value: string;
}

export default function Game({ game }: GameProps) {
  const [error, setError] = useState<string | null>(null);
  const [pickedAnswer, setPickedAnswer] = useState<string>("");
  const [rightAnswer, setRightAnswer] = useState<string>("");
  const [fiftyFiftyHidden, setFiftyFiftyHidden] = useState<string[]>([]);
  const [audiencePollResults, setAudiencePollResults] = useState<
    { answer: string; percent: number }[] | null
  >(null);

  // Fetch game data
  const {
    data,
    isLoading,
    error: queryError,
  } = api.game.getGame.useQuery(game);

  const currentStage = data?.stage ?? 1;
  const utils = api.useUtils();

  const { mutate: evaluateAnswer, isPending: isEvaluating } =
    api.question.eval.useMutation({
      onSuccess: async (data) => {
        setRightAnswer(data.answer);
        if (data.isRight) {
          setTimeout(() => {
            setRightAnswer("");
            setPickedAnswer("");
            void utils.game.getGame.invalidate(game);
          }, 1000);
        } else {
          setTimeout(() => {
            setRightAnswer("");
            setPickedAnswer("");
            setError(
              `Game Over - False Answer! \n Right Answer: ${getFullAnswer(data.answer)}`,
            );
          }, 1000);
        }
      },
      onError: (err) => setError(err.message),
    });

  const { mutate: triggerFiftyFifty } = api.joker.useFiftyFifty.useMutation({
    onSuccess: (data) => {
      setFiftyFiftyHidden(data.hiddenAnswers);
    },
    onError: (err) => setError(err.message),
  });

  const { mutate: triggerAudiencePoll } = api.joker.useAudiencePoll.useMutation(
    {
      onSuccess: (data) => {
        setAudiencePollResults(data.results);
      },
      onError: (err) => setError(err.message),
    },
  );

  const currentQuestion = data?.questions.find((q) => q.stage === currentStage);

  useEffect(() => {
    setFiftyFiftyHidden([]);
    setAudiencePollResults(null);
  }, [currentQuestion?.id]);

  // Show loading with ads when fetching more questions
  if (isLoading || !currentQuestion) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-4">
        <LoadingSpinner />
        <div>Loading new questions...</div>
      </div>
    );
  }

  // Error state
  if (error || queryError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 text-center">
        <h5 className="flex flex-col gap-2 text-3xl font-bold lg:text-5xl">
          {error?.split("\n").map((i, idx) => <span key={idx}>{i}</span>) ??
            queryError?.message}
        </h5>
        <div className="flex gap-4">
          <Link
            href="/play"
            className="border-body bg-primary-dark hover:border-primary-light hover:bg-primary flex items-center justify-center rounded-full border-2 p-3 px-6 text-xl"
          >
            New Game
          </Link>
          <Link
            href="/"
            className="border-body bg-primary-dark hover:border-primary-light hover:bg-primary flex items-center justify-center rounded-full border-2 p-3 px-6 text-xl"
          >
            Home
          </Link>
        </div>
      </div>
    );
  }

  // Prepare answers
  const answers: Answer[] = ["A", "B", "C", "D"].map((key) => ({
    key: key as "A" | "B" | "C" | "D",
    value: currentQuestion[key as keyof typeof currentQuestion] as string,
  }));

  const visibleAnswers =
    fiftyFiftyHidden.length > 0
      ? answers.map((a) => ({
          ...a,
          hidden: fiftyFiftyHidden.includes(a.key),
        }))
      : answers.map((a) => ({ ...a, hidden: false }));

  const handlePickedAnswer = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const userAnswer = e.currentTarget.id as "A" | "B" | "C" | "D";
    setPickedAnswer(userAnswer);
    setTimeout(() => {
      evaluateAnswer({ gameId: game, choice: userAnswer, stage: currentStage });
    }, 800);
  };

  const getFullAnswer = (letter: string) => {
    if (!currentQuestion) return letter;
    const answerText = currentQuestion[
      letter as keyof typeof currentQuestion
    ] as string;
    return `${letter} - ${answerText}`;
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center">
      <SideBar
        currentStage={currentStage}
        fiftyFiftyUsed={!!data?.fifty_fifty}
        audiencePollUsed={!!data?.audience_poll}
        triggerFiftyFifty={triggerFiftyFifty}
        triggerAudiencePoll={triggerAudiencePoll}
        audiencePollResults={audiencePollResults}
        currentQuestionId={currentQuestion?.id}
        gameId={game}
      />
      <div className="flex w-full max-w-screen-xl flex-col items-center justify-center gap-16 p-4">
        <div className="flex w-full flex-col items-center justify-center gap-4 text-center">
          <h2 className="font-black uppercase">Stage {currentStage}</h2>
          <h5 className="text-2xl font-bold lg:text-4xl">
            {currentQuestion.question}
          </h5>
        </div>
        <div className="grid w-full grid-cols-2 gap-8">
          {visibleAnswers.map(({ key, value, hidden }) => (
            <button
              type="button"
              id={key}
              key={key}
              disabled={isEvaluating || hidden}
              onClick={handlePickedAnswer}
              className={`border-body bg-primary-dark hover:border-primary-light hover:bg-primary focus:border-highlight-purple focus:bg-highlight-purple/50 focus:text-highlight-purple group col-span-2 flex cursor-pointer items-center justify-between rounded-full border-2 p-3 px-6 text-xl disabled:opacity-15 lg:col-span-1 ${
                hidden ? "cursor-default opacity-0" : ""
              } ${pickedAnswer === key && !rightAnswer && "border-highlight-purple bg-highlight-purple/50 text-highlight-purple"} ${rightAnswer && pickedAnswer === key && rightAnswer === key && "animate-blink border-green-300 bg-green-300/80 text-green-300"} ${rightAnswer && pickedAnswer === key && rightAnswer !== key && "animate-blink border-red-300 bg-red-300/80 text-red-300"} `}
            >
              <span className="group-hover:border-primary-light group-hover:text-primary-light mr-2 border-r-2 px-2">
                {key}
              </span>{" "}
              <span>{value}</span>
            </button>
          ))}
        </div>
        {audiencePollResults && (
          <div className="grid w-full max-w-xl grid-cols-2 gap-4">
            {audiencePollResults.map(({ answer, percent }) => (
              <div key={answer} className="flex items-center gap-2">
                <span className="w-6 font-bold">{answer}</span>
                <div className="bg-primary-dark h-6 flex-1 overflow-hidden rounded-full">
                  <div
                    className="bg-highlight-purple/50 flex h-full items-center justify-end pr-2 text-sm"
                    style={{ width: `${percent}%` }}
                  >
                    {percent}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
