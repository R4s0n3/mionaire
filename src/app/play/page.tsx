
import { auth } from "@/server/auth";
import { HydrateClient } from "@/trpc/server";

import PickMode from "./_components/pick-mode";
import Game from "./_components/game";
import { redirect } from "next/navigation";

export default async function GamePage({
    searchParams,
  }: {
    searchParams: Promise<{ game: string }>
  }) {

    const gameId = (await searchParams).game
    const session = await auth();

  if (!session?.user) redirect("/")


  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary to-primary-dark text-body">
       {gameId ?
        <Game game={gameId} />
        :
        <PickMode />
       }
      </main>
    </HydrateClient>
  );
}
