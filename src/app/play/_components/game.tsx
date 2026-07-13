"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Home,
  LockKeyhole,
  RotateCcw,
  Sparkles,
  Split,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";

import BrandMark from "@/app/_components/brand-mark";
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
        <div>
          <p className="eyebrow">The studio is getting ready</p>
          <p className="mt-2 text-sm text-white/42">Loading your questions…</p>
        </div>
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
        <div className="show-grid pointer-events-none absolute inset-0 -z-1" />
        <section className="glass-panel relative w-full max-w-2xl overflow-hidden rounded-[2rem] p-7 sm:p-12">
          <div
            className={`mx-auto grid size-20 place-items-center rounded-full border ${
              won
                ? "border-highlight-gold/60 bg-highlight-gold/12 text-highlight-gold"
                : "border-secondary/35 bg-secondary/8 text-secondary"
            }`}
          >
            {won ? (
              <Trophy className="size-9" aria-hidden="true" />
            ) : (
              <XCircle className="size-9" aria-hidden="true" />
            )}
          </div>
          <p className="eyebrow mt-6">
            {won ? "The million is yours" : "The run is over"}
          </p>
          <h1 className="mt-3 text-4xl leading-none font-black tracking-[-0.04em] text-white uppercase sm:text-6xl">
            {won
              ? "You are a Mionaire!"
              : lost
                ? "What a run."
                : "Game complete."}
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base leading-7 text-white/58">
            {won
              ? "You conquered all fifteen questions and reached the top of the money ladder."
              : lost
                ? `The correct answer was ${gameResult.correctAnswer}. Your ladder high point before this question was $${previousStageAmount.toLocaleString()}.`
                : "This game has ended. Start a new run when you are ready for another shot."}
          </p>
          {won && (
            <p className="from-highlight-gold to-highlight-gold mt-7 bg-gradient-to-r via-white bg-clip-text text-5xl font-black text-transparent sm:text-7xl">
              $1,000,000
            </p>
          )}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/play" className="show-button">
              <RotateCcw className="size-4" aria-hidden="true" /> Play again
            </Link>
            <Link href="/leaderboard" className="show-button-secondary">
              <Trophy className="size-4" aria-hidden="true" /> Hall of fame
            </Link>
          </div>
        </section>
      </div>
    );
  }

  if (fatalError || !data || !currentQuestion) {
    return (
      <div className="flex min-h-svh items-center justify-center px-4 text-center">
        <section className="glass-panel w-full max-w-xl rounded-[2rem] p-8 sm:p-10">
          <AlertTriangle
            className="text-highlight-gold mx-auto size-10"
            aria-hidden="true"
          />
          <p className="eyebrow mt-5">We hit a technical pause</p>
          <h1 className="mt-3 text-3xl font-black text-white">
            The game couldn&apos;t load.
          </h1>
          <p className="mt-4 text-sm leading-6 text-white/55" role="alert">
            {fatalError ?? "Game data was not available."}
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/play" className="show-button">
              New game
            </Link>
            <Link href="/" className="show-button-secondary">
              Home
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
        <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2 text-white">
          <BrandMark className="text-secondary text-2xl" />
          <span className="hidden text-xs font-black tracking-[0.2em] sm:inline">
            MIONAIRE
          </span>
        </div>
        <span className="text-[0.68rem] font-bold tracking-[0.12em] text-white/38 uppercase">
          <span className="hidden sm:inline">Question </span>
          {currentStage} / 15
        </span>
      </header>

      <div className="grid flex-1 items-center gap-6 py-6 xl:grid-cols-[minmax(0,1fr)_17.5rem] xl:gap-8">
        <section className="mx-auto flex w-full max-w-5xl flex-col items-center">
          <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="text-center sm:text-left">
              <p className="eyebrow">Playing for</p>
              <p className="text-highlight-gold mt-1 text-3xl font-black tracking-[-0.02em] sm:text-4xl">
                ${currentAmount.toLocaleString()}
              </p>
            </div>

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
                {isUsingFiftyFifty ? "Working…" : "50 : 50"}
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
                {isUsingAudiencePoll ? "Polling…" : "Audience"}
              </button>
            </div>
          </div>

          <div className="glass-panel border-secondary/30 relative mt-7 w-full overflow-hidden rounded-[1.75rem] px-5 py-7 text-center sm:px-10 sm:py-9">
            <div className="via-secondary/80 absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent to-transparent" />
            <p className="eyebrow">Question {currentStage}</p>
            <h1 className="mx-auto mt-4 max-w-4xl text-xl leading-snug font-black text-white sm:text-3xl lg:text-[2.15rem]">
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
              className="glass-panel mt-5 w-full rounded-2xl p-4 sm:p-5"
              aria-labelledby="audience-poll-title"
            >
              <div className="flex items-center justify-between">
                <h2
                  id="audience-poll-title"
                  className="flex items-center gap-2 text-sm font-black text-white"
                >
                  <Users className="text-secondary size-4" aria-hidden="true" />{" "}
                  Audience poll
                </h2>
                <span className="text-[0.65rem] tracking-[0.1em] text-white/35 uppercase">
                  Studio vote
                </span>
              </div>
              <div className="mt-4 grid grid-cols-4 items-end gap-2 sm:gap-4">
                {audiencePollResults.map(({ answer, percent }) => (
                  <div
                    key={answer}
                    className="flex flex-col items-center gap-2"
                  >
                    <span className="text-xs font-black text-white">
                      {percent}%
                    </span>
                    <div className="flex h-16 w-full items-end overflow-hidden rounded-t-md bg-white/5 sm:h-20">
                      <div
                        className="from-highlight-purple to-secondary w-full bg-gradient-to-t transition-[height] duration-500"
                        style={{ height: `${percent}%` }}
                      />
                    </div>
                    <span className="option-key !size-7 text-[0.65rem]">
                      {answer}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {notice && (
            <p
              className="mt-4 w-full rounded-xl border border-red-300/30 bg-red-400/10 p-3 text-center text-sm text-red-100"
              role="alert"
            >
              {notice}
            </p>
          )}

          <div className="mt-5 flex w-full flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-center text-xs leading-5 text-white/38 sm:text-left">
              {rightAnswer
                ? rightAnswer === pickedAnswer
                  ? "Correct — moving up the ladder…"
                  : "The correct answer is highlighted."
                : pickedAnswer
                  ? `Answer ${pickedAnswer} selected. Change it or make it final.`
                  : "Choose carefully. Nothing is final until you lock it in."}
            </p>
            <button
              type="button"
              onClick={lockAnswer}
              disabled={!pickedAnswer || isEvaluating}
              className="show-button w-full sm:w-auto sm:min-w-56"
            >
              {isEvaluating ? (
                <>
                  <LoadingSpinner compact /> Final answer…
                </>
              ) : (
                <>
                  <LockKeyhole className="size-4" aria-hidden="true" /> Lock in
                  answer
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

      <footer className="flex items-center justify-center gap-2 pb-2 text-[0.65rem] tracking-[0.1em] text-white/22 uppercase">
        <Sparkles className="size-3" aria-hidden="true" /> Trust your first
        instinct
        <ArrowRight className="size-3" aria-hidden="true" /> Play for the
        million
      </footer>
    </div>
  );
}
