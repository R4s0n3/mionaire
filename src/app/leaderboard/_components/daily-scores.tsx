"use client";

import { useCallback } from "react";
import { Trophy, User } from "lucide-react";

import { apiClient } from "@/lib/api-client";
import { useApiQuery } from "@/hooks/use-api-query";

interface DailyScoresProps {
  currentUserId?: string;
}

export default function DailyScores({ currentUserId }: DailyScoresProps) {
  const query = useCallback(
    () => apiClient.getDailyScores().then(({ scores }) => scores),
    [],
  );
  const { data: dailyScores, error, isLoading } = useApiQuery(query);

  return (
    <div className="relative flex aspect-video size-full flex-col items-center overflow-y-auto rounded-xl border border-amber-400 bg-gradient-to-br from-amber-500/90 to-amber-700/60 shadow-xl">
      <h5 className="sticky top-0 flex w-full items-center justify-center gap-1.5 bg-amber-600 p-2 px-4 text-white">
        <Trophy size={14} />
        Daily Legends
        <Trophy size={14} />
      </h5>
      {isLoading && (
        <p className="p-4 text-center text-white">Loading scores…</p>
      )}
      {error && <p className="p-4 text-center text-red-100">{error.message}</p>}
      {!isLoading && !error && dailyScores?.length === 0 && (
        <div className="flex w-full justify-between bg-amber-500/40 p-2 px-4">
          <p className="w-full text-center text-white">No daily scores yet.</p>
        </div>
      )}
      {dailyScores?.slice(0, 10).map((user, index) => (
        <div
          className={`flex w-full items-center gap-4 bg-amber-500/20 p-2 px-4 text-sm ${
            index % 2 ? "bg-amber-500/40 text-white" : ""
          } ${
            user.id === currentUserId
              ? "ring-2 ring-white ring-offset-2 ring-offset-amber-500/60"
              : ""
          }`}
          key={user.id}
        >
          <span className="text-white">#{index + 1}</span>
          <span className="truncate text-white">{user.name}</span>
          <span className="ml-auto text-center text-white">{user.score}</span>
          {user.id === currentUserId && (
            <User size={14} className="text-white" />
          )}
        </div>
      ))}
    </div>
  );
}
