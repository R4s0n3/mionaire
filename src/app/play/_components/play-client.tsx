"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import LoadingSpinner from "@/app/_components/loading-spinner";
import { useAuth } from "@/app/_components/auth-provider";
import Game from "./game";
import PickMode from "./pick-mode";

export default function PlayClient({ gameId }: { gameId?: string }) {
  const { isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/");
  }, [isLoading, router, user]);

  if (isLoading || !user) {
    return (
      <main className="text-body from-primary to-primary-dark flex min-h-screen flex-col items-center justify-center bg-gradient-to-b">
        <LoadingSpinner />
      </main>
    );
  }

  return (
    <main className="text-body from-primary to-primary-dark flex min-h-screen flex-col items-center justify-center bg-gradient-to-b">
      {gameId ? <Game game={gameId} /> : <PickMode />}
    </main>
  );
}
