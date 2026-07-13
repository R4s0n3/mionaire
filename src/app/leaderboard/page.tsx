"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
        <span className="broadcast-note">MIO-TV · archive</span>
        <Link href="/" className="show-button-secondary !min-h-10 !px-3">
          <ArrowLeft className="size-4" aria-hidden="true" /> home
        </Link>
      </header>

      <div className="mx-auto w-full max-w-5xl px-5 pt-8 pb-16 sm:px-8">
        <div>
          <p className="eyebrow">receipts from previous broadcasts</p>
          <h1 className="mt-2 text-6xl leading-none font-black text-white uppercase sm:text-8xl">
            Scores.
          </h1>
          <p className="mt-3 font-mono text-sm text-white/58">
            people who knew things.
          </p>
        </div>

        {user && (
          <section className="mt-8" aria-label="Your player statistics">
            <PlayerStatsCard />
          </section>
        )}

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <DailyScoresToday currentUserId={user?.id} />
          <DailyScores currentUserId={user?.id} />
          <LeaderboardList currentUserId={user?.id} />
          <MioScoreList />
        </div>
      </div>
    </main>
  );
}
