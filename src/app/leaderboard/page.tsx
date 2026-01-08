import Link from "next/link";
import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import { HomeIcon } from "lucide-react";
import LeaderboardList from "./_components/leaderboard-list";
import MioScoreList from "./_components/mio-scores";
import DailyScores from "./_components/daily-scores";
import DailyScoresToday from "./_components/daily-scores-today";
import PlayerStatsCard from "./_components/player-stats-card";

export default async function Leaderboard() {
  const session = await auth();
  void api.game.getScores.prefetch();
  void api.game.getMionaires.prefetch();
  void api.game.getDailyScores.prefetch();
  void api.game.getDailyScoresToday.prefetch();

  if (session?.user) {
    void api.game.getPlayerStats.prefetch();
  }

  return (
    <HydrateClient>
      <main className="from-primary to-primary-dark text-body relative flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-b p-4 pt-8 pb-16">
        <Link href="/" className="absolute top-4 right-4">
          <HomeIcon className="text-body size-8" />
        </Link>
        <h1 className="text-4xl font-black uppercase">Leaderboard</h1>
        {session?.user && <PlayerStatsCard />}
        <div className="grid w-full max-w-5xl gap-4 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr]">
          <div className="col-span-full lg:col-span-1">
            <DailyScoresToday currentUserId={session?.user?.id} />
          </div>
          <div className="col-span-full lg:col-span-1">
            <DailyScores currentUserId={session?.user?.id} />
          </div>
          <div className="flex w-full flex-col items-center justify-center gap-4 uppercase">
            <LeaderboardList currentUserId={session?.user?.id} />
          </div>
          <div className="flex w-full flex-col items-center justify-center gap-4 uppercase">
            <MioScoreList />
          </div>
        </div>
      </main>
    </HydrateClient>
  );
}
