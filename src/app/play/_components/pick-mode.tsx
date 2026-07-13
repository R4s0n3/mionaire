"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";

import LoadingSpinner from "@/app/_components/loading-spinner";
import { useAuth } from "@/app/_components/auth-provider";
import {
  apiClient,
  isApiClientError,
  type GameMode,
  type IncompleteDailyGame,
} from "@/lib/api-client";

type GameType = "random" | "daily";

const difficultyOptions: { mode: GameMode; note: string }[] = [
  { mode: "EASY", note: "we'd like you to come back." },
  { mode: "NORMAL", note: "the usual amount of unfair." },
  { mode: "HARD", note: "the researcher was unsupervised." },
];

export default function PickMode() {
  const router = useRouter();
  const { logout } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string>();
  const [dailyLookupError, setDailyLookupError] = useState<string>();
  const [gameType, setGameType] = useState<GameType>("random");
  const [gameMode, setGameMode] = useState<GameMode>("NORMAL");
  const [incompleteDailyGame, setIncompleteDailyGame] =
    useState<IncompleteDailyGame | null>(null);
  const [isLoadingDailyGame, setIsLoadingDailyGame] = useState(true);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void apiClient
      .getIncompleteDailyGame()
      .then(({ game }) => {
        if (!cancelled) setIncompleteDailyGame(game);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (isApiClientError(error) && error.status === 401) {
          void logout().catch(() => undefined);
          return;
        }
        setDailyLookupError(
          error instanceof Error ? error.message : "Unable to load games.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingDailyGame(false);
      });

    return () => {
      cancelled = true;
    };
  }, [logout]);

  async function startGame() {
    setErrorMsg(undefined);
    setIsPending(true);

    try {
      const { gameId } =
        gameType === "random"
          ? await apiClient.startRandomGame(gameMode)
          : await apiClient.startDailyGame(gameMode);
      router.push(`/play?game=${encodeURIComponent(gameId)}`);
    } catch (error) {
      if (isApiClientError(error) && error.status === 401) {
        void logout().catch(() => undefined);
        return;
      }
      setErrorMsg(
        error instanceof Error ? error.message : "Unable to create a game.",
      );
    } finally {
      setIsPending(false);
    }
  }

  const dailyStartBlocked =
    gameType === "daily" && (isLoadingDailyGame || !!incompleteDailyGame);
  const selectedDifficulty = difficultyOptions.find(
    ({ mode }) => mode === gameMode,
  );

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-4xl flex-col px-4 py-5 sm:px-7">
      <header className="flex items-center justify-between">
        <span className="broadcast-note">MIO-TV · menu</span>
        <Link href="/" className="show-button-secondary !min-h-10 !px-3">
          <ArrowLeft className="size-4" aria-hidden="true" /> back
        </Link>
      </header>

      <div className="my-auto py-10">
        <div>
          <p className="eyebrow">tonight&apos;s program</p>
          <h1 className="mt-2 text-5xl leading-none font-black text-white uppercase sm:text-7xl">
            New game?
          </h1>
          <p className="mt-3 font-mono text-sm text-white/58">
            questions may be difficult.
          </p>
        </div>

        {incompleteDailyGame && !isLoadingDailyGame && (
          <section className="border-highlight-gold bg-primary mt-7 flex flex-col gap-4 border-2 p-4 sm:flex-row sm:items-center">
            <RotateCcw
              className="text-highlight-gold size-5 flex-none"
              aria-hidden="true"
            />
            <p className="flex-1 font-mono text-xs leading-5 text-white/72">
              WE LEFT THE TAPE RUNNING — Q.{incompleteDailyGame.stage} ·{" "}
              {incompleteDailyGame.mode}
            </p>
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/play?game=${encodeURIComponent(incompleteDailyGame.id)}`,
                )
              }
              className="show-button"
            >
              continue <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </section>
        )}

        <section className="glass-panel mt-7 p-5 sm:p-7">
          <fieldset>
            <legend className="eyebrow">tape</legend>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(["random", "daily"] as GameType[]).map((type) => {
                const selected = gameType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setGameType(type)}
                    className={`min-h-12 border-2 px-4 font-mono text-sm font-black uppercase ${
                      selected
                        ? "border-secondary bg-secondary text-primary-dark"
                        : "bg-primary-dark border-white/18 text-white/58 hover:border-white/45 hover:text-white"
                    }`}
                    aria-pressed={selected}
                  >
                    {selected ? "> " : ""}
                    {type}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 font-mono text-xs text-white/45">
              {gameType === "random"
                ? "fresh questions from the box."
                : "same questions for everyone today."}
            </p>
          </fieldset>

          <div className="my-6 border-t-2 border-dashed border-white/12" />

          <fieldset>
            <legend className="eyebrow">difficulty knob</legend>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {difficultyOptions.map(({ mode }) => {
                const selected = gameMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setGameMode(mode)}
                    className={`min-h-12 border-2 px-2 font-mono text-xs font-black uppercase sm:text-sm ${
                      selected
                        ? "border-highlight-gold bg-highlight-gold text-primary-dark"
                        : "bg-primary-dark border-white/18 text-white/58 hover:border-white/45 hover:text-white"
                    }`}
                    aria-pressed={selected}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 min-h-5 font-mono text-xs text-white/58">
              {selectedDifficulty?.note}
            </p>
          </fieldset>

          {dailyLookupError && (
            <p
              className="border-highlight-gold bg-highlight-gold/8 mt-5 border-l-4 p-3 font-mono text-xs text-amber-100"
              role="status"
            >
              daily tape check failed. starting may still work.
            </p>
          )}

          {errorMsg && (
            <p
              className="mt-5 border-l-4 border-red-300 bg-red-400/10 p-3 text-sm text-red-100"
              role="alert"
            >
              {errorMsg}
            </p>
          )}

          <div className="mt-6 flex justify-end border-t-2 border-dashed border-white/12 pt-5">
            <button
              type="button"
              onClick={() => void startGame()}
              disabled={isPending || dailyStartBlocked}
              className="show-button w-full sm:w-auto sm:min-w-44"
            >
              {isPending ? (
                <>
                  <LoadingSpinner compact /> cueing…
                </>
              ) : isLoadingDailyGame && gameType === "daily" ? (
                "checking tape…"
              ) : incompleteDailyGame && gameType === "daily" ? (
                "continue above"
              ) : (
                <>
                  start <ArrowRight className="size-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
