"use client";

import { useCallback } from "react";
import { Medal, UserRound } from "lucide-react";

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
  const { data: scores, error, isLoading } = useApiQuery(query);
  const rankedScores = scores
    ?.slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return (
    <section className="glass-panel flex min-h-80 flex-col overflow-hidden rounded-3xl">
      <header className="flex items-center gap-4 border-b border-white/8 p-5">
        <span className="bg-highlight-purple/12 text-highlight-purple grid size-11 flex-none place-items-center rounded-xl">
          <Medal className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow !text-highlight-purple">Career ranking</p>
          <h2 className="mt-0.5 text-xl font-black text-white">All-stars</h2>
        </div>
      </header>
      <div className="flex-1 p-3">
        {isLoading && (
          <p className="p-6 text-center text-sm text-white/45" role="status">
            Loading all-stars…
          </p>
        )}
        {error && (
          <p className="p-6 text-center text-sm text-red-200" role="alert">
            {error.message}
          </p>
        )}
        {!isLoading && !error && rankedScores?.length === 0 && (
          <p className="p-6 text-center text-sm text-white/40">
            No scores yet. A new legend can still be first.
          </p>
        )}
        <ol className="flex flex-col gap-1">
          {rankedScores?.map((user, index) => {
            const isCurrent = user.id === currentUserId;
            return (
              <li
                className={`grid grid-cols-[2.2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                  isCurrent
                    ? "bg-highlight-purple/12 ring-highlight-purple/35 text-white ring-1"
                    : "text-white/62 odd:bg-white/3"
                }`}
                key={user.id}
              >
                <span
                  className={`font-black ${index < 3 ? "text-highlight-gold" : "text-white/30"}`}
                >
                  #{index + 1}
                </span>
                <span className="truncate font-bold">
                  {user.name}{" "}
                  {isCurrent && (
                    <span className="text-highlight-purple">(You)</span>
                  )}
                </span>
                <span className="flex items-center gap-2 font-black text-white tabular-nums">
                  {user.score}
                  {isCurrent && (
                    <UserRound
                      className="text-highlight-purple size-3.5"
                      aria-hidden="true"
                    />
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
