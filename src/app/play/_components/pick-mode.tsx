"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CalendarDays,
  Check,
  Flame,
  Gauge,
  RotateCcw,
  Shuffle,
  Sparkles,
} from "lucide-react";

import BrandMark from "@/app/_components/brand-mark";
import LoadingSpinner from "@/app/_components/loading-spinner";
import { useAuth } from "@/app/_components/auth-provider";
import {
  apiClient,
  isApiClientError,
  type GameMode,
  type IncompleteDailyGame,
} from "@/lib/api-client";

type GameType = "random" | "daily";

const difficultyOptions: {
  mode: GameMode;
  title: string;
  description: string;
  icon: typeof Gauge;
}[] = [
  {
    mode: "EASY",
    title: "Warm-up",
    description: "A friendly climb with familiar topics.",
    icon: Gauge,
  },
  {
    mode: "NORMAL",
    title: "Classic",
    description: "The full studio challenge, as intended.",
    icon: Brain,
  },
  {
    mode: "HARD",
    title: "Expert",
    description: "Obscure facts and very little mercy.",
    icon: Flame,
  },
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

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-7xl flex-col px-4 py-5 sm:px-7 lg:px-10">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-white"
          aria-label="Mionaire home"
        >
          <BrandMark className="text-secondary text-3xl" />
          <span className="hidden text-sm font-black tracking-[0.2em] sm:inline">
            MIONAIRE
          </span>
        </Link>
        <Link href="/" className="show-button-secondary !min-h-10 !px-4">
          <ArrowLeft className="size-4" aria-hidden="true" /> Home
        </Link>
      </header>

      <div className="mx-auto my-auto w-full max-w-5xl py-10 lg:py-14">
        <div className="text-center">
          <p className="eyebrow flex items-center justify-center gap-2">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Choose tonight&apos;s challenge
          </p>
          <h1 className="mt-3 text-4xl leading-none font-black tracking-[-0.035em] text-white uppercase sm:text-6xl">
            Take the hot seat.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/55 sm:text-base">
            Pick a show format and set your difficulty. Every run still has
            fifteen questions between you and the million.
          </p>
        </div>

        {incompleteDailyGame && !isLoadingDailyGame && (
          <section className="glass-panel border-highlight-gold/30 mx-auto mt-8 flex max-w-3xl flex-col items-center gap-4 rounded-2xl p-5 text-center sm:flex-row sm:text-left">
            <span className="bg-highlight-gold/12 text-highlight-gold grid size-12 flex-none place-items-center rounded-full">
              <RotateCcw className="size-5" aria-hidden="true" />
            </span>
            <div className="flex-1">
              <p className="text-highlight-gold text-xs font-black tracking-[0.14em] uppercase">
                Your daily run is still live
              </p>
              <p className="mt-1 text-sm text-white/58">
                Continue from question {incompleteDailyGame.stage} on{" "}
                {incompleteDailyGame.mode.toLowerCase()} difficulty.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/play?game=${encodeURIComponent(incompleteDailyGame.id)}`,
                )
              }
              className="show-button w-full sm:w-auto"
            >
              Resume game <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </section>
        )}

        <section className="glass-panel mt-8 rounded-[2rem] p-5 sm:p-8">
          <fieldset>
            <legend className="eyebrow">1 · Select a format</legend>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {[
                {
                  type: "random" as const,
                  icon: Shuffle,
                  title: "Open challenge",
                  badge: "Play anytime",
                  description:
                    "A fresh mix drawn from the full question vault.",
                },
                {
                  type: "daily" as const,
                  icon: CalendarDays,
                  title: "Daily spotlight",
                  badge: "One set today",
                  description: "The same curated ladder faced by every player.",
                },
              ].map(({ type, icon: Icon, title, badge, description }) => {
                const selected = gameType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setGameType(type)}
                    className={`relative flex items-start gap-4 rounded-2xl border p-5 text-left transition ${
                      selected
                        ? "border-secondary/60 bg-secondary/10 shadow-[0_0_28px_rgba(89,230,255,0.08)]"
                        : "border-white/10 bg-black/10 hover:border-white/25 hover:bg-white/4"
                    }`}
                    aria-pressed={selected}
                  >
                    <span
                      className={`grid size-11 flex-none place-items-center rounded-xl ${
                        selected
                          ? "bg-secondary/15 text-secondary"
                          : "bg-white/7 text-white/55"
                      }`}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-white">{title}</span>
                        <span className="rounded-full bg-white/6 px-2 py-0.5 text-[0.62rem] font-bold tracking-[0.08em] text-white/42 uppercase">
                          {badge}
                        </span>
                      </span>
                      <span className="mt-1.5 block text-sm leading-5 text-white/48">
                        {description}
                      </span>
                    </span>
                    {selected && (
                      <Check
                        className="text-secondary absolute top-4 right-4 size-4"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="my-7 h-px bg-white/8" />

          <fieldset>
            <legend className="eyebrow">2 · Set the difficulty</legend>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {difficultyOptions.map(
                ({ mode, title, description, icon: Icon }) => {
                  const selected = gameMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setGameMode(mode)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-highlight-gold/65 bg-highlight-gold/9"
                          : "border-white/10 bg-black/10 hover:border-white/25"
                      }`}
                      aria-pressed={selected}
                    >
                      <span className="flex items-center gap-3">
                        <Icon
                          className={`size-4 ${selected ? "text-highlight-gold" : "text-white/45"}`}
                          aria-hidden="true"
                        />
                        <span
                          className={`text-xs font-black tracking-[0.1em] uppercase ${selected ? "text-highlight-gold" : "text-white/72"}`}
                        >
                          {mode}
                        </span>
                      </span>
                      <span className="mt-3 block font-black text-white">
                        {title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-white/42">
                        {description}
                      </span>
                    </button>
                  );
                },
              )}
            </div>
          </fieldset>

          {dailyLookupError && (
            <p
              className="mt-5 rounded-xl border border-amber-300/25 bg-amber-300/8 p-3 text-sm text-amber-100"
              role="status"
            >
              We couldn&apos;t check for an unfinished daily game. You can still
              start a new challenge.
            </p>
          )}

          {errorMsg && (
            <p
              className="mt-5 rounded-xl border border-red-300/30 bg-red-400/10 p-3 text-sm text-red-100"
              role="alert"
            >
              {errorMsg}
            </p>
          )}

          <div className="mt-7 flex flex-col items-center justify-between gap-4 border-t border-white/8 pt-6 sm:flex-row">
            <p className="text-center text-xs leading-5 text-white/38 sm:text-left">
              {gameType === "daily" ? "Daily spotlight" : "Open challenge"} ·{" "}
              {gameMode.toLowerCase()} difficulty
            </p>
            <button
              type="button"
              onClick={() => void startGame()}
              disabled={isPending || dailyStartBlocked}
              className="show-button w-full sm:w-auto sm:min-w-56"
            >
              {isPending ? (
                <>
                  <LoadingSpinner compact /> Preparing game…
                </>
              ) : isLoadingDailyGame && gameType === "daily" ? (
                "Checking daily game…"
              ) : incompleteDailyGame && gameType === "daily" ? (
                "Resume above"
              ) : (
                <>
                  Start the game{" "}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
