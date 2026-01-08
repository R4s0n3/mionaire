"use client";

import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import LoadingSpinner from "@/app/_components/loading-spinner";
import { useState } from "react";

type GameType = "random" | "daily" | "challenger";

export default function PickMode() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string>();
  const [gameType, setGameType] = useState<GameType>("random");

  const { mutateAsync: createRandom, isPending: randomPending } =
    api.game.makeRandom.useMutation({
      onSuccess: (data) => {
        router.push(`?game=${data}`);
      },
      onError: (error) => {
        setErrorMsg(error.message);
      },
    });

  const { mutateAsync: createDaily, isPending: dailyPending } =
    api.game.makeDaily.useMutation({
      onSuccess: (data) => {
        router.push(`?game=${data}`);
      },
      onError: (error) => {
        setErrorMsg(error.message);
      },
    });

  const { mutateAsync: createChallenger, isPending: challengerPending } =
    api.game.makeChallenger.useMutation({
      onSuccess: (data) => {
        router.push(`?game=${data}`);
      },
      onError: (error) => {
        setErrorMsg(error.message);
      },
    });

  async function handleClickedButton(
    event: React.MouseEvent<HTMLButtonElement>,
    type: GameType,
  ) {
    const eventMode = event.currentTarget.value as "EASY" | "NORMAL" | "HARD";

    switch (type) {
      case "random":
        await createRandom({ mode: eventMode });
        break;
      case "daily":
        await createDaily({ mode: eventMode });
        break;
      case "challenger":
        await createChallenger({ mode: eventMode });
        break;
    }
  }

  const isPending = randomPending || dailyPending || challengerPending;

  if (errorMsg) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-4">
        <h5>Error:</h5>
        <h6>{errorMsg}</h6>
        <p>reload page</p>
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

      {/* Game Type Selection */}
      <div className="flex w-full justify-center gap-4 p-4">
        {[
          { type: "random" as GameType, label: "RANDOM" },
          { type: "daily" as GameType, label: "DAILY" },
          { type: "challenger" as GameType, label: "CHALLENGER" },
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

      {/* Difficulty Selection */}
      <div className="flex w-full flex-col justify-between gap-8 p-4 lg:flex-row">
        {["EASY", "NORMAL", "HARD"].map((mode) => (
          <button
            onClick={(e) => handleClickedButton(e, gameType)}
            type="button"
            value={mode}
            key={mode}
            className="hover:border-highlight-purple hover:text-highlight-purple flex-1 rounded-full border-2 p-2 px-6"
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Description */}
      <div className="text-center text-sm text-gray-600">
        {gameType === "random" &&
          "Play with randomly selected questions from our database."}
        {gameType === "daily" && "Play with questions created today."}
        {gameType === "challenger" &&
          "Compete with the latest AI-generated daily challenge questions!"}
      </div>
    </div>
  );
}
