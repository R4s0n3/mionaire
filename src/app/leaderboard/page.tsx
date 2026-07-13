"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles, Trophy } from "lucide-react";

import BrandMark from "@/app/_components/brand-mark";
import { useAuth } from "@/app/_components/auth-provider";
import DailyScoresToday from "./_components/daily-scores-today";
import DailyScores from "./_components/daily-scores";
import LeaderboardList from "./_components/leaderboard-list";
import MioScoreList from "./_components/mio-scores";
import PlayerStatsCard from "./_components/player-stats-card";

export default function Leaderboard() {
  const { user } = useAuth();

  return (
    <main className="show-stage text-body min-h-svh">
      <div className="show-grid pointer-events-none absolute inset-0 -z-1" />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-white"
          aria-label="Mionaire home"
        >
          <BrandMark className="text-secondary text-3xl" />
          <span className="text-sm font-black tracking-[0.22em]">MIONAIRE</span>
        </Link>
        <Link href="/" className="show-button-secondary !min-h-10 !px-4">
          <ArrowLeft className="size-4" aria-hidden="true" /> Home
        </Link>
      </header>

      <div className="mx-auto w-full max-w-7xl px-5 pt-8 pb-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="eyebrow flex items-center justify-center gap-2">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Champions of the hot seat
          </p>
          <h1 className="mt-3 text-5xl leading-none font-black tracking-[-0.045em] text-white uppercase sm:text-7xl">
            Hall of fame.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-white/52 sm:text-base">
            Today&apos;s sharpest minds, all-time legends, and the latest
            players to conquer the million.
          </p>
        </div>

        {user && (
          <section className="mt-10" aria-label="Your player statistics">
            <PlayerStatsCard />
          </section>
        )}

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <DailyScoresToday currentUserId={user?.id} />
          <DailyScores currentUserId={user?.id} />
          <LeaderboardList currentUserId={user?.id} />
          <MioScoreList />
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 text-[0.68rem] font-bold tracking-[0.12em] text-white/25 uppercase">
          <Trophy
            className="text-highlight-gold/50 size-3.5"
            aria-hidden="true"
          />
          Fifteen questions separate players from legends
        </div>
      </div>
    </main>
  );
}
