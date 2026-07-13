"use client";

import { useCallback } from "react";

import { apiClient } from "@/lib/api-client";
import { useApiQuery } from "@/hooks/use-api-query";

export default function MioScoreList() {
  const query = useCallback(
    () => apiClient.getMionaires().then(({ mionaires }) => mionaires),
    [],
  );
  const { data: mionaires, error, isLoading } = useApiQuery(query);

  return (
    <section className="glass-panel flex min-h-64 flex-col overflow-hidden">
      <header className="border-b-2 border-dashed border-white/15 px-4 py-3">
        <h2 className="text-secondary font-mono text-sm font-black uppercase">
          mionaires
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
        {!isLoading && !error && mionaires?.length === 0 && (
          <p className="p-6 text-center font-mono text-xs text-white/55">
            club currently empty.
          </p>
        )}
        <ol>
          {mionaires?.map((mionaire, index) => (
            <li
              className="grid grid-cols-[2.2rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-white/8 px-3 py-2.5 text-sm text-white/68"
              key={`${mionaire.name}-${mionaire.date ?? index}`}
            >
              <span className="text-highlight-gold font-mono text-xs font-black">
                #{index + 1}
              </span>
              <span className="truncate font-bold text-white">
                {mionaire.name}
              </span>
              <time
                className="font-mono text-xs text-white/42 tabular-nums"
                dateTime={mionaire.date ?? undefined}
              >
                {mionaire.date
                  ? new Date(mionaire.date).toLocaleDateString()
                  : "?"}
              </time>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
