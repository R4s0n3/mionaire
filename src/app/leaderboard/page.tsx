"use client";

import Link from "next/link";
import { HomeIcon } from "lucide-react";

import { useAuth } from "@/app/_components/auth-provider";
import DailyScoresToday from "./_components/daily-scores-today";
import DailyScores from "./_components/daily-scores";
import LeaderboardList from "./_components/leaderboard-list";
import MioScoreList from "./_components/mio-scores";
import PlayerStatsCard from "./_components/player-stats-card";

export default function Leaderboard() {
  const { user } = useAuth();

  return (
    <main className="from-primary to-primary-dark text-body relative flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b p-4 pt-8 pb-16">
      <Link href="/" className="absolute top-4 right-4">
        <HomeIcon className="text-body size-8" />
      </Link>
      <h1 className="text-4xl font-black uppercase">Leaderboard</h1>
      {user && <PlayerStatsCard />}
      <div className="grid w-full max-w-5xl gap-4 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr]">
        <div className="col-span-full lg:col-span-1">
          <DailyScoresToday currentUserId={user?.id} />
        </div>
        <div className="col-span-full lg:col-span-1">
          <DailyScores currentUserId={user?.id} />
        </div>
        <div className="flex w-full flex-col items-center justify-center gap-4 uppercase">
          <LeaderboardList currentUserId={user?.id} />
        </div>
        <div className="flex w-full flex-col items-center justify-center gap-4 uppercase">
          <MioScoreList />
        </div>
      </div>
    </main>
  );
}
