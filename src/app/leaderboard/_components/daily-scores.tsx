"use client";

import { useCallback } from "react";

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
  const { data: scores, error, isLoading } = useApiQuery(query);

  return (
    <section className="glass-panel flex min-h-64 flex-col overflow-hidden">
      <header className="border-b-2 border-dashed border-white/15 px-4 py-3">
        <h2 className="text-highlight-gold font-mono text-sm font-black uppercase">
          daily / all time
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
        {!isLoading && !error && scores?.length === 0 && (
          <p className="p-6 text-center font-mono text-xs text-white/55">
            empty tape.
          </p>
        )}
        <ol>
          {scores?.slice(0, 10).map((user, index) => {
            const isCurrent = user.id === currentUserId;
            return (
              <li
                className={`grid grid-cols-[2.2rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/8 px-3 py-2.5 text-sm ${
                  isCurrent
                    ? "border-l-highlight-gold bg-highlight-gold/8 border-l-4 text-white"
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
                    <span className="text-highlight-gold">(you)</span>
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
