import Link from "next/link";
import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import { HomeIcon } from "lucide-react";
import PlayerRank from "./_components/player-rank";
import LeaderboardList from "./_components/leaderboard-list";


export default async function Leaderboard() {
  const session = await auth();
  void api.game.getScores.prefetch()

  if(session?.user){
    void api.game.getPlayerRank.prefetch()
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary to-primary-dark text-body relative">
      <Link href="/" className="absolute top-4 right-4">
      <HomeIcon className="size-8 text-body" />
      </Link>
      <div className="w-full max-w-xl flex justify-center items-center flex-col gap-8">

      {session?.user && <div className="w-full flex justify-center items-center flex-col gap-4 uppercase">
        <h1 className="text-3xl font-black">player rank</h1>
        <PlayerRank />
    </div>}
    <div className="w-full flex justify-center items-center flex-col gap-4 uppercase">
      <h1 className="text-3xl font-black">Leaderboard</h1>
      <LeaderboardList />
    </div>
      </div>

      </main>
    </HydrateClient>
  );
}
