"use client";

import { api } from "@/trpc/react";
import { Trophy, User } from "lucide-react";

interface DailyScoresProps {
  currentUserId?: string;
}

export default function DailyScores({ currentUserId }: DailyScoresProps) {
  const [dailyScores] = api.game.getDailyScores.useSuspenseQuery();

  return (
    <div className="relative flex aspect-video size-full flex-col items-center overflow-y-auto rounded-xl border border-amber-400 bg-gradient-to-br from-amber-500/90 to-amber-700/60 shadow-xl">
      <h5 className="sticky top-0 flex w-full items-center justify-center gap-1.5 bg-amber-600 p-2 px-4 text-white">
        <Trophy size={14} />
        Daily Legends
        <Trophy size={14} />
      </h5>
      {dailyScores.length === 0 && (
        <div className={`flex w-full justify-between bg-amber-500/40 p-2 px-4`}>
          <p className="w-full text-center text-white">no daily scores yet..</p>
        </div>
      )}
      {dailyScores.slice(0, 10).map((u, i) => (
        <div
          className={`flex w-full items-center gap-4 bg-amber-500/20 p-2 px-4 text-sm ${i % 2 && "bg-amber-500/40 text-white"} ${u.id === currentUserId ? "ring-2 ring-white ring-offset-2 ring-offset-amber-500/60" : ""}`}
          key={u.id}
        >
          <span className="text-white">#{i + 1}</span>
          <span className="truncate text-white">{u.name}</span>
          <span className="ml-auto text-center text-white">{u.score}</span>
          {u.id === currentUserId && <User size={14} className="text-white" />}
        </div>
      ))}
    </div>
  );
}
