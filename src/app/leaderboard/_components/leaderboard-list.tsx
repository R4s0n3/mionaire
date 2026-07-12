"use client";

import { useCallback } from "react";
import { Crown, User } from "lucide-react";

import { apiClient } from "@/lib/api-client";
import { useApiQuery } from "@/hooks/use-api-query";

interface LeaderboardListProps {
  currentUserId?: string;
}

export default function LeaderboardList({
  currentUserId,
}: LeaderboardListProps) {
  const query = useCallback(
    () => apiClient.getOverallScores().then(({ scores }) => scores),
    [],
  );
  const { data: userScores, error, isLoading } = useApiQuery(query);

  return (
    <div className="from-highlight-gold/90 text-body to-highlight-gold/60 border-highlight-gold relative flex aspect-video size-full flex-col items-center overflow-y-auto rounded-xl border bg-gradient-to-br shadow-xl">
      <h5 className="bg-highlight-gold text-highlight-purple sticky top-0 flex w-full items-center justify-center gap-1.5 p-2 px-4">
        <Crown size={14} />
        Allstars
        <Crown size={14} />
      </h5>
      {isLoading && <p className="p-4 text-center">Loading scores…</p>}
      {error && <p className="p-4 text-center text-red-900">{error.message}</p>}
      {!isLoading && !error && userScores?.length === 0 && (
        <p className="p-4 text-center">No scores yet.</p>
      )}
      {userScores
        ?.slice()
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((user, index) => (
          <div
            className={`bg-highlight-gold/20 flex w-full items-center gap-4 p-2 px-4 text-sm ${
              index % 2 ? "bg-highlight-gold/40 text-body" : ""
            } ${
              user.id === currentUserId
                ? "ring-offset-highlight-gold/60 ring-2 ring-white ring-offset-2"
                : ""
            }`}
            key={user.id}
          >
            <span>#{index + 1}</span>
            <span className="truncate">{user.name}</span>
            <span className="ml-auto text-center">{user.score}</span>
            {user.id === currentUserId && (
              <User size={14} className="text-highlight-purple" />
            )}
          </div>
        ))}
    </div>
  );
}
