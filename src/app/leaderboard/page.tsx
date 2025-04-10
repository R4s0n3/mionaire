import Link from "next/link";
import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import { HomeIcon } from "lucide-react";
import PlayerRank from "./_components/player-rank";
import LeaderboardList from "./_components/leaderboard-list";
import MioScoreList from "./_components/mio-scores";


export default async function Leaderboard() {
  const session = await auth();
  void api.game.getScores.prefetch()
  void api.game.getMionaires.prefetch()

  if(session?.user){
    void api.game.getPlayerRank.prefetch()
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col gap-8 p-4 items-center justify-center bg-gradient-to-b from-primary to-primary-dark text-body relative pt-8 pb-16">
      <Link href="/" className="absolute top-4 right-4">
      <HomeIcon className="size-8 text-body" />
      </Link>
      <h1 className="text-4xl uppercase font-black">Leaderboard</h1>
      <div className="w-full max-w-xl grid lg:grid-cols-[auto_1fr] gap-8">

      {session?.user && <div className="col-span-1 w-full flex justify-center items-center flex-col gap-4 uppercase aspect-video ">
        <PlayerRank />
    </div>}
    <div className="col-span-1">
      <MioScoreList />
    </div>
    <div className="w-full odd:col-span-full flex justify-center items-center flex-col gap-4 uppercase">
      
      <LeaderboardList />
    </div>
      </div>

      </main>
    </HydrateClient>
  );
}
