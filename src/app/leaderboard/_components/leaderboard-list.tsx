"use client";

import { useCallback } from "react";

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
    <section className="glass-panel flex min-h-64 flex-col overflow-hidden">
      <header className="border-b-2 border-dashed border-white/15 px-4 py-3">
        <h2 className="text-highlight-purple font-mono text-sm font-black uppercase">
          overall
        </h2>
      </header>
      <div className="flex-1 p-3">
        {isLoading && (
          <p
            className="p-6 text-center font-mono text-xs text-white/55"
            role="status"
          >
            loading…
          </p>
        )}
        {error && (
          <p
            className="p-6 text-center font-mono text-xs text-red-200"
            role="alert"
          >
            {error.message}
          </p>
        )}
        {!isLoading && !error && rankedScores?.length === 0 && (
          <p className="p-6 text-center font-mono text-xs text-white/55">
            no evidence.
          </p>
        )}
        <ol>
          {rankedScores?.map((user, index) => {
            const isCurrent = user.id === currentUserId;
            return (
              <li
                className={`grid grid-cols-[2.2rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/8 px-3 py-2.5 text-sm ${
                  isCurrent
                    ? "border-l-highlight-purple bg-highlight-purple/10 border-l-4 text-white"
                    : "text-white/68"
                }`}
                key={user.id}
              >
                <span
                  className={`font-mono font-black ${index < 3 ? "text-highlight-gold" : "text-white/35"}`}
                >
                  #{index + 1}
                </span>
                <span className="truncate font-bold">
                  {user.name}{" "}
                  {isCurrent && (
                    <span className="text-highlight-purple">(you)</span>
                  )}
                </span>
                <span className="font-mono font-black text-white tabular-nums">
                  {user.score}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
