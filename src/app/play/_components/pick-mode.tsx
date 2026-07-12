"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";

import LoadingSpinner from "@/app/_components/loading-spinner";
import { useAuth } from "@/app/_components/auth-provider";
import {
  apiClient,
  isApiClientError,
  type GameMode,
  type IncompleteDailyGame,
} from "@/lib/api-client";

type GameType = "random" | "daily";

export default function PickMode() {
  const router = useRouter();
  const { logout } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string>();
  const [dailyLookupError, setDailyLookupError] = useState<string>();
  const [gameType, setGameType] = useState<GameType>("random");
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

  async function handleClickedButton(
    event: MouseEvent<HTMLButtonElement>,
    type: GameType,
  ) {
    const mode = event.currentTarget.value as GameMode;

    setErrorMsg(undefined);
    setIsPending(true);

    try {
      const { gameId } =
        type === "random"
          ? await apiClient.startRandomGame(mode)
          : await apiClient.startDailyGame(mode);
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

  if (errorMsg) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-4">
        <h5>Error:</h5>
        <h6>{errorMsg}</h6>
        <p>Reload the page and try again.</p>
      </div>
    );
  }

  if (isPending) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-4">
        <LoadingSpinner />
        <h5>Creating game...</h5>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-2xl flex-col items-center justify-center gap-8">
      <h2 className="text-4xl font-bold">PICK A MODE</h2>

      {!isLoadingDailyGame && incompleteDailyGame && (
        <div className="w-full rounded-xl border-2 border-amber-400 bg-amber-400/10 p-4 text-center">
          <p className="mb-2 text-amber-400">
            You have an incomplete daily game!
          </p>
          <button
            type="button"
            onClick={() =>
              router.push(
                `/play?game=${encodeURIComponent(incompleteDailyGame.id)}`,
              )
            }
            className="rounded-full border-2 border-amber-400 px-6 py-2 text-amber-400 hover:bg-amber-400 hover:text-black"
          >
            Continue Game (Stage {incompleteDailyGame.stage})
          </button>
        </div>
      )}

      {!isLoadingDailyGame && dailyLookupError && (
        <p className="w-full rounded-xl border border-amber-400/60 bg-amber-400/10 p-3 text-center text-sm text-amber-200">
          We could not check for an unfinished daily game. You can still start a
          new game below.
        </p>
      )}

      <div className="flex w-full justify-center gap-4 p-4">
        {[
          { type: "random" as GameType, label: "RANDOM" },
          { type: "daily" as GameType, label: "DAILY" },
        ].map(({ type, label }) => (
          <button
            key={type}
            type="button"
            onClick={() => setGameType(type)}
            className={`rounded-full border-2 p-2 px-6 ${
              gameType === type
                ? "border-highlight-purple text-highlight-purple bg-purple-100"
                : "hover:border-highlight-purple hover:text-highlight-purple border-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex w-full flex-col justify-between gap-8 p-4 lg:flex-row">
        {(["EASY", "NORMAL", "HARD"] as GameMode[]).map((mode) => (
          <button
            onClick={(event) => handleClickedButton(event, gameType)}
            type="button"
            value={mode}
            key={mode}
            className="hover:border-highlight-purple hover:text-highlight-purple flex-1 rounded-full border-2 p-2 px-6"
          >
            {mode}
          </button>
        ))}
      </div>

      <div className="text-center text-sm text-gray-600">
        {gameType === "random" &&
          "Play with randomly selected questions from our database."}
        {gameType === "daily" &&
          "Play today's curated daily challenge questions!"}
      </div>
    </div>
  );
}
