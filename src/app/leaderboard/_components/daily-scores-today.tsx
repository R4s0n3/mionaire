"use client";

import { api } from "@/trpc/react";
import { Calendar, User } from "lucide-react";

interface DailyScoresTodayProps {
  currentUserId?: string;
}

export default function DailyScoresToday({
  currentUserId,
}: DailyScoresTodayProps) {
  const [dailyScoresToday] = api.game.getDailyScoresToday.useSuspenseQuery();

  return (
    <div className="relative flex aspect-video size-full flex-col items-center overflow-y-auto rounded-xl border border-blue-400 bg-gradient-to-br from-blue-500/90 to-blue-700/60 shadow-xl">
      <h5 className="sticky top-0 flex w-full items-center justify-center gap-1.5 bg-blue-600 p-2 px-4 text-white">
        <Calendar size={14} />
        Today&apos;s Daily
        <Calendar size={14} />
      </h5>
      {dailyScoresToday.length === 0 && (
        <div className={`flex w-full justify-between bg-blue-500/40 p-2 px-4`}>
          <p className="w-full text-center text-white">no scores yet today..</p>
        </div>
      )}
      {dailyScoresToday
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((u, i) => (
          <div
            className={`flex w-full items-center gap-4 bg-blue-500/20 p-2 px-4 text-sm ${i % 2 && "bg-blue-500/40 text-white"} ${u.id === currentUserId ? "ring-2 ring-white ring-offset-2 ring-offset-blue-500/60" : ""}`}
            key={u.id}
          >
            <span className="text-white">#{i + 1}</span>
            <span className="truncate text-white">{u.name}</span>
            <span className="ml-auto text-center text-white">{u.score}</span>
            {u.id === currentUserId && (
              <User size={14} className="text-white" />
            )}
          </div>
        ))}
    </div>
  );
}
