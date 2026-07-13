"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Home,
  LockKeyhole,
  Split,
  Users,
  XCircle,
} from "lucide-react";

import LoadingSpinner from "@/app/_components/loading-spinner";
import { useAuth } from "@/app/_components/auth-provider";
import {
  apiClient,
  isApiClientError,
  type AnswerChoice,
  type AudiencePollResult,
  type Game as ApiGame,
} from "@/lib/api-client";
import { stages } from "@/util/stages";
import SideBar from "./side-bar";

interface GameProps {
  game: string;
}

interface Answer {
  key: AnswerChoice;
  value: string;
}

type GameResult =
  | { kind: "won" }
  | { kind: "lost"; correctAnswer: string; reachedStage: number }
  | { kind: "ended" };

export default function Game({ game }: GameProps) {
  const { logout } = useAuth();
  const [data, setData] = useState<ApiGame | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pickedAnswer, setPickedAnswer] = useState<AnswerChoice | null>(null);
  const [rightAnswer, setRightAnswer] = useState<AnswerChoice | null>(null);
  const [fiftyFiftyHidden, setFiftyFiftyHidden] = useState<AnswerChoice[]>([]);
  const [audiencePollResults, setAudiencePollResults] = useState<
    AudiencePollResult[] | null
  >(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isUsingFiftyFifty, setIsUsingFiftyFifty] = useState(false);
  const [isUsingAudiencePoll, setIsUsingAudiencePoll] = useState(false);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const revealTimeoutRef = useRef<number | null>(null);

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
        setFatalError(null);
        setNotice(null);
      } catch (error) {
        const message = handleRequestError(error, "Unable to load this game.");
        if (showLoading) setFatalError(message);
        else setNotice(message);
      } finally {
        if (showLoading) setIsLoading(false);
      }
    },
    [game, handleRequestError],
  );

  useEffect(() => {
    void loadGame();

    return () => {
      if (revealTimeoutRef.current !== null) {
        window.clearTimeout(revealTimeoutRef.current);
      }
    };
  }, [loadGame]);

  const currentStage = data?.stage ?? 1;
  const currentQuestion = data?.questions.find(
    (question) => question.stage === currentStage,
  );

  useEffect(() => {
    setFiftyFiftyHidden([]);
    setAudiencePollResults(null);
    setPickedAnswer(null);
    setRightAnswer(null);
  }, [currentQuestion?.id]);

  function getFullAnswer(letter: AnswerChoice) {
    if (!currentQuestion) return letter;
    return `${letter} · ${currentQuestion[letter]}`;
  }

  async function evaluateAnswer(choice: AnswerChoice) {
    try {
      const result = await apiClient.answerQuestion(game, {
        choice,
        stage: currentStage,
      });
      setRightAnswer(result.answer);
      setLiveMessage(
        result.isRight
          ? `Correct. The answer is ${getFullAnswer(result.answer)}.`
          : `Incorrect. The correct answer is ${getFullAnswer(result.answer)}.`,
      );

      revealTimeoutRef.current = window.setTimeout(() => {
        setRightAnswer(null);
        setPickedAnswer(null);

        if (result.won) {
          setGameResult({ kind: "won" });
        } else if (result.isRight && !result.gameEnded) {
          void loadGame(false).finally(() => setIsEvaluating(false));
          return;
        } else if (!result.isRight) {
          setGameResult({
            kind: "lost",
            correctAnswer: getFullAnswer(result.answer),
            reachedStage: currentStage,
          });
        } else {
          setGameResult({ kind: "ended" });
        }

        setIsEvaluating(false);
      }, 1800);
    } catch (error) {
      setNotice(handleRequestError(error, "Unable to submit that answer."));
      setRightAnswer(null);
      setIsEvaluating(false);
    }
  }

  function selectAnswer(choice: AnswerChoice) {
    if (isEvaluating || rightAnswer || fiftyFiftyHidden.includes(choice))
      return;
    setPickedAnswer(choice);
    setNotice(null);
    setLiveMessage(`Answer ${choice} selected. Lock it in when you are ready.`);
  }

  function lockAnswer() {
    if (!pickedAnswer || isEvaluating) return;
    setNotice(null);
    setIsEvaluating(true);
    setLiveMessage(`Answer ${pickedAnswer} locked in.`);
    void evaluateAnswer(pickedAnswer);
  }

  async function triggerFiftyFifty() {
    if (!currentQuestion || isUsingFiftyFifty || isEvaluating) return;

    setIsUsingFiftyFifty(true);
    setNotice(null);

    try {
      const result = await apiClient.useFiftyFifty(game, currentQuestion.id);
      setFiftyFiftyHidden(result.hiddenAnswers);
      setData((current) =>
        current ? { ...current, fiftyFifty: true } : current,
      );
      if (pickedAnswer && result.hiddenAnswers.includes(pickedAnswer)) {
        setPickedAnswer(null);
      }
      setLiveMessage("50:50 used. Two incorrect answers were removed.");
    } catch (error) {
      setNotice(handleRequestError(error, "Unable to use 50:50."));
    } finally {
      setIsUsingFiftyFifty(false);
    }
  }

  async function triggerAudiencePoll() {
    if (!currentQuestion || isUsingAudiencePoll || isEvaluating) return;

    setIsUsingAudiencePoll(true);
    setNotice(null);

    try {
      const result = await apiClient.useAudiencePoll(game, currentQuestion.id);
      setAudiencePollResults(result.results);
      setData((current) =>
        current ? { ...current, audiencePoll: true } : current,
      );
      setLiveMessage("Audience poll results are now available.");
    } catch (error) {
      setNotice(handleRequestError(error, "Unable to use the audience poll."));
    } finally {
      setIsUsingAudiencePoll(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-5 text-center">
        <LoadingSpinner />
        <p className="broadcast-note">please stand by</p>
      </div>
    );
  }

  if (gameResult) {
    const won = gameResult.kind === "won";
    const lost = gameResult.kind === "lost";
    const previousStageAmount = lost
      ? (stages[Math.max(0, gameResult.reachedStage - 2)]?.amount ?? 0)
      : 0;

    return (
      <div className="relative flex min-h-svh items-center justify-center px-4 py-12 text-center">
        <section className="glass-panel relative w-full max-w-xl p-6 sm:p-9">
          <span className="broadcast-note">
            {won ? "budget alert" : "end of tape"}
          </span>
          {won && (
            // A weird little relic from the original project. It has earned this moment.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/dance.gif"
              alt=""
              className="mx-auto mt-5 h-28 w-auto motion-reduce:hidden"
            />
          )}
          <h1 className="mt-6 text-4xl leading-none font-black text-white uppercase sm:text-6xl">
            {won
              ? "You are a Mionaire."
              : lost
                ? "That's the show."
                : "Transmission over."}
          </h1>
          <p className="mx-auto mt-5 max-w-md font-mono text-sm leading-6 text-white/65">
            {won
              ? "somehow, you knew all fifteen. accounting has been notified."
              : lost
                ? `wrong. it was ${gameResult.correctAnswer}. previous rung: $${previousStageAmount.toLocaleString()}.`
                : "the machine says this game is finished."}
          </p>
          {won && (
            <p className="text-highlight-gold mt-6 font-mono text-4xl font-black sm:text-6xl">
              $1,000,000
            </p>
          )}
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/play" className="show-button">
              again
            </Link>
            <Link href="/leaderboard" className="show-button-secondary">
              scores
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (fatalError || !data || !currentQuestion) {
    return (
      <div className="flex min-h-svh items-center justify-center px-4 text-center">
        <section className="glass-panel w-full max-w-lg p-7 sm:p-9">
          <span className="broadcast-note">technical difficulties</span>
          <h1 className="mt-6 text-4xl font-black text-white uppercase">
            signal lost.
          </h1>
          <p
            className="mt-4 font-mono text-sm leading-6 text-white/65"
            role="alert"
          >
            {fatalError ?? "Game data was not available."}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/play" className="show-button">
              new game
            </Link>
            <Link href="/" className="show-button-secondary">
              home
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const answers: Answer[] = (["A", "B", "C", "D"] as AnswerChoice[]).map(
    (key) => ({ key, value: currentQuestion[key] }),
  );
  const currentAmount = stages[currentStage - 1]?.amount ?? 0;

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-[1500px] flex-col px-4 py-4 sm:px-6 lg:px-8">
      <header className="relative flex min-h-12 items-center justify-between gap-4 pr-14 xl:pr-0">
        {isEvaluating ? (
          <span
            className="icon-button cursor-wait opacity-40"
            aria-label="Final answer is being evaluated"
          >
            <Home className="size-5" aria-hidden="true" />
          </span>
        ) : (
          <Link
            href="/"
            className="icon-button"
            aria-label="Leave game and return home"
          >
            <Home className="size-5" aria-hidden="true" />
          </Link>
        )}
        <span className="broadcast-note absolute left-1/2 -translate-x-1/2">
          MIO-TV
        </span>
        <span className="font-mono text-[0.68rem] font-bold text-white/58 uppercase">
          Q {currentStage}/15
        </span>
      </header>

      <div className="grid flex-1 items-center gap-6 py-6 xl:grid-cols-[minmax(0,1fr)_17.5rem] xl:gap-8">
        <section className="mx-auto flex w-full max-w-5xl flex-col items-center">
          <div className="flex w-full flex-col items-center justify-between gap-4 border-b-2 border-dashed border-white/15 pb-4 sm:flex-row">
            <p className="text-highlight-gold font-mono text-lg font-black">
              Q {String(currentStage).padStart(2, "0")} / $
              {currentAmount.toLocaleString()}
            </p>
            <div className="flex items-center gap-2" aria-label="Lifelines">
              <button
                type="button"
                onClick={() => void triggerFiftyFifty()}
                disabled={data.fiftyFifty || isUsingFiftyFifty || isEvaluating}
                data-used={data.fiftyFifty}
                className="lifeline-button"
                aria-label={
                  data.fiftyFifty ? "50:50 lifeline used" : "Use 50:50 lifeline"
                }
              >
                <Split
                  className="text-highlight-gold size-4"
                  aria-hidden="true"
                />
                {isUsingFiftyFifty ? "wait…" : "50 / 50"}
              </button>
              <button
                type="button"
                onClick={() => void triggerAudiencePoll()}
                disabled={
                  data.audiencePoll || isUsingAudiencePoll || isEvaluating
                }
                data-used={data.audiencePoll}
                className="lifeline-button"
                aria-label={
                  data.audiencePoll
                    ? "Audience lifeline used"
                    : "Ask the audience"
                }
              >
                <Users className="text-secondary size-4" aria-hidden="true" />
                {isUsingAudiencePoll ? "asking…" : "ask room"}
              </button>
            </div>
          </div>

          <div className="border-secondary/45 mt-5 w-full border-y-2 px-3 py-7 text-center sm:px-8 sm:py-9">
            <h1 className="mx-auto max-w-4xl text-xl leading-snug font-black text-white sm:text-3xl lg:text-[2.15rem]">
              {currentQuestion.question}
            </h1>
          </div>

          <div className="mt-5 grid w-full gap-3 sm:grid-cols-2 sm:gap-4">
            {answers.map(({ key, value }) => {
              const hidden = fiftyFiftyHidden.includes(key);
              const state = rightAnswer
                ? key === rightAnswer
                  ? "correct"
                  : key === pickedAnswer
                    ? "wrong"
                    : "idle"
                : key === pickedAnswer
                  ? "selected"
                  : "idle";

              return (
                <button
                  type="button"
                  key={key}
                  disabled={isEvaluating || hidden}
                  onClick={() => selectAnswer(key)}
                  className={`answer-option ${
                    rightAnswer && (state === "correct" || state === "wrong")
                      ? "animate-blink"
                      : ""
                  }`}
                  data-state={state}
                  aria-hidden={hidden}
                  aria-pressed={pickedAnswer === key}
                >
                  <span className="option-key">{key}</span>
                  <span className="text-sm leading-5 font-bold sm:text-base">
                    {value}
                  </span>
                  {state === "correct" && (
                    <CheckCircle2
                      className="ml-auto size-5 flex-none text-green-100"
                      aria-hidden="true"
                    />
                  )}
                  {state === "wrong" && (
                    <XCircle
                      className="ml-auto size-5 flex-none text-red-100"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {audiencePollResults && (
            <section
              className="mt-5 w-full border-y-2 border-dashed border-white/15 py-4"
              aria-labelledby="audience-poll-title"
            >
              <h2 id="audience-poll-title" className="eyebrow">
                the audience has spoken (badly)
              </h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 sm:gap-x-5">
                {audiencePollResults.map(({ answer, percent }) => (
                  <div
                    key={answer}
                    className="grid grid-cols-[1.5rem_1fr_2.5rem] items-center gap-2"
                  >
                    <span className="text-highlight-gold font-mono text-xs font-black">
                      {answer}
                    </span>
                    <div className="bg-primary-dark h-3 overflow-hidden">
                      <div
                        className="bg-highlight-purple h-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="font-mono text-xs text-white/65">
                      {percent}%
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {notice && (
            <p
              className="mt-4 w-full border-l-4 border-red-300 bg-red-400/10 p-3 font-mono text-xs text-red-100"
              role="alert"
            >
              {notice}
            </p>
          )}

          <div className="mt-5 flex w-full justify-end">
            <button
              type="button"
              onClick={lockAnswer}
              disabled={!pickedAnswer || isEvaluating}
              className="show-button w-full sm:w-auto sm:min-w-56"
            >
              {isEvaluating ? (
                <>
                  <LoadingSpinner compact /> computer says…
                </>
              ) : (
                <>
                  <LockKeyhole className="size-4" aria-hidden="true" />
                  {pickedAnswer ? `lock ${pickedAnswer}` : "final answer?"}
                </>
              )}
            </button>
          </div>

          <p className="sr-only" aria-live="polite">
            {liveMessage}
          </p>
        </section>

        <SideBar currentStage={currentStage} />
      </div>
    </div>
  );
}
