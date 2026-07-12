"use client";

import { useCallback, useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";

import LoadingSpinner from "@/app/_components/loading-spinner";
import { useAuth } from "@/app/_components/auth-provider";
import {
  apiClient,
  isApiClientError,
  type AnswerChoice,
  type AudiencePollResult,
  type Game as ApiGame,
} from "@/lib/api-client";
import SideBar from "./side-bar";

interface GameProps {
  game: string;
}

interface Answer {
  key: AnswerChoice;
  value: string;
}

export default function Game({ game }: GameProps) {
  const { logout } = useAuth();
  const [data, setData] = useState<ApiGame | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pickedAnswer, setPickedAnswer] = useState<AnswerChoice | null>(null);
  const [rightAnswer, setRightAnswer] = useState<AnswerChoice | null>(null);
  const [fiftyFiftyHidden, setFiftyFiftyHidden] = useState<AnswerChoice[]>([]);
  const [audiencePollResults, setAudiencePollResults] = useState<
    AudiencePollResult[] | null
  >(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isUsingFiftyFifty, setIsUsingFiftyFifty] = useState(false);
  const [isUsingAudiencePoll, setIsUsingAudiencePoll] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  const handleRequestError = useCallback(
    (error: unknown, fallback: string) => {
      if (isApiClientError(error) && error.status === 401) {
        void logout().catch(() => undefined);
        return "Your session expired. Please sign in again.";
      }

      return error instanceof Error ? error.message : fallback;
    },
    [logout],
  );

  const loadGame = useCallback(
    async (showLoading = true) => {
      if (showLoading) setIsLoading(true);

      try {
        const { game: loadedGame } = await apiClient.getGame(game);
        setData(loadedGame);
        setError(null);
      } catch (error) {
        setError(handleRequestError(error, "Unable to load this game."));
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [game, handleRequestError],
  );

  useEffect(() => {
    void loadGame();
  }, [loadGame]);

  const currentStage = data?.stage ?? 1;
  const currentQuestion = data?.questions.find(
    (question) => question.stage === currentStage,
  );

  useEffect(() => {
    setFiftyFiftyHidden([]);
    setAudiencePollResults(null);
  }, [currentQuestion?.id]);

  async function evaluateAnswer(choice: AnswerChoice) {
    try {
      const result = await apiClient.answerQuestion(game, {
        choice,
        stage: currentStage,
      });
      setRightAnswer(result.answer);

      window.setTimeout(() => {
        void (async () => {
          setRightAnswer(null);
          setPickedAnswer(null);

          if (result.won) {
            setHasWon(true);
          } else if (result.isRight && !result.gameEnded) {
            await loadGame(false);
          } else if (!result.isRight) {
            setError(
              `Game Over - False Answer! \n Right Answer: ${getFullAnswer(result.answer)}`,
            );
          } else {
            setError("This game has ended.");
          }

          setIsEvaluating(false);
        })();
      }, 1000);
    } catch (error) {
      setPickedAnswer(null);
      setError(handleRequestError(error, "Unable to submit that answer."));
      setIsEvaluating(false);
    }
  }

  async function triggerFiftyFifty() {
    if (!currentQuestion || isUsingFiftyFifty) return;

    setIsUsingFiftyFifty(true);

    try {
      const result = await apiClient.useFiftyFifty(game, currentQuestion.id);
      setFiftyFiftyHidden(result.hiddenAnswers);
      setData((current) =>
        current ? { ...current, fiftyFifty: true } : current,
      );
    } catch (error) {
      setError(handleRequestError(error, "Unable to use 50:50."));
    } finally {
      setIsUsingFiftyFifty(false);
    }
  }

  async function triggerAudiencePoll() {
    if (!currentQuestion || isUsingAudiencePoll) return;

    setIsUsingAudiencePoll(true);

    try {
      const result = await apiClient.useAudiencePoll(game, currentQuestion.id);
      setAudiencePollResults(result.results);
      setData((current) =>
        current ? { ...current, audiencePoll: true } : current,
      );
    } catch (error) {
      setError(handleRequestError(error, "Unable to use the audience poll."));
    } finally {
      setIsUsingAudiencePoll(false);
    }
  }

  function handlePickedAnswer(event: MouseEvent<HTMLButtonElement>) {
    if (isEvaluating) return;

    event.preventDefault();
    const answer = event.currentTarget.id as AnswerChoice;
    setPickedAnswer(answer);
    setIsEvaluating(true);
    window.setTimeout(() => {
      void evaluateAnswer(answer);
    }, 800);
  }

  function getFullAnswer(letter: AnswerChoice) {
    if (!currentQuestion) return letter;
    return `${letter} - ${currentQuestion[letter]}`;
  }

  if (isLoading) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-4">
        <LoadingSpinner />
        <div>Loading new questions...</div>
      </div>
    );
  }

  if (hasWon) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 text-center">
        <h1 className="text-highlight-gold text-5xl font-black uppercase lg:text-7xl">
          You are a Mionaire!
        </h1>
        <p className="text-xl">You answered all 15 questions correctly.</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/play"
            className="border-body bg-primary-dark hover:border-primary-light hover:bg-primary flex items-center justify-center rounded-full border-2 p-3 px-6 text-xl"
          >
            Play Again
          </Link>
          <Link
            href="/leaderboard"
            className="border-body bg-primary-dark hover:border-primary-light hover:bg-primary flex items-center justify-center rounded-full border-2 p-3 px-6 text-xl"
          >
            View Leaderboard
          </Link>
        </div>
      </div>
    );
  }

  if (error || !data || !currentQuestion) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 text-center">
        <h5 className="flex flex-col gap-2 text-3xl font-bold lg:text-5xl">
          {(error ?? "Game data was not available.")
            .split("\n")
            .map((message, index) => (
              <span key={index}>{message}</span>
            ))}
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

  const answers: Answer[] = (["A", "B", "C", "D"] as AnswerChoice[]).map(
    (key) => ({
      key,
      value: currentQuestion[key],
    }),
  );

  const visibleAnswers = answers.map((answer) => ({
    ...answer,
    hidden: fiftyFiftyHidden.includes(answer.key),
  }));

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center">
      <SideBar
        currentStage={currentStage}
        fiftyFiftyUsed={data.fiftyFifty}
        audiencePollUsed={data.audiencePoll}
        fiftyFiftyPending={isUsingFiftyFifty}
        audiencePollPending={isUsingAudiencePoll}
        triggerFiftyFifty={triggerFiftyFifty}
        triggerAudiencePoll={triggerAudiencePoll}
        audiencePollResults={audiencePollResults}
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
              } ${
                pickedAnswer === key && !rightAnswer
                  ? "border-highlight-purple bg-highlight-purple/50 text-highlight-purple"
                  : ""
              } ${
                rightAnswer && pickedAnswer === key && rightAnswer === key
                  ? "animate-blink border-green-300 bg-green-300/80 text-green-300"
                  : ""
              } ${
                rightAnswer && pickedAnswer === key && rightAnswer !== key
                  ? "animate-blink border-red-300 bg-red-300/80 text-red-300"
                  : ""
              }`}
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
