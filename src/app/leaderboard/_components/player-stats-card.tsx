"use client";

import { useCallback } from "react";

import { apiClient } from "@/lib/api-client";
import { useApiQuery } from "@/hooks/use-api-query";

export default function PlayerStatsCard() {
  const query = useCallback(async () => {
    const { stats } = await apiClient.getPlayerStats();
    return stats;
  }, []);
  const { data: stats, error, isLoading } = useApiQuery(query);

  if (isLoading) {
    return (
      <div
        className="border-secondary border-l-4 p-3 font-mono text-xs text-white/55"
        role="status"
      >
        checking your file…
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div
        className="border-l-4 border-red-300 p-3 font-mono text-xs text-red-100"
        role="alert"
      >
        {error?.message ?? "player file unavailable."}
      </div>
    );
  }

  const metrics = [
    ["rank", `#${stats.overallRank}`],
    ["score", stats.overallScore.toLocaleString()],
    ["best q.", `${stats.bestStage}/15`],
    ["games", stats.gamesPlayed.toLocaleString()],
  ];

  return (
    <div className="glass-panel p-4 sm:flex sm:items-center sm:gap-6">
      <div className="border-b-2 border-dashed border-white/15 pb-3 sm:w-48 sm:border-r-2 sm:border-b-0 sm:pr-5 sm:pb-0">
        <p className="eyebrow">your file</p>
        <h2 className="mt-1 truncate text-2xl font-black text-white uppercase">
          {stats.name}
        </h2>
        {stats.isMionaire && (
          <span className="text-highlight-gold font-mono text-[0.65rem]">
            verified mionaire
          </span>
        )}
      </div>
      <dl className="mt-4 grid flex-1 grid-cols-2 gap-3 sm:mt-0 sm:grid-cols-4">
        {metrics.map(([label, value]) => (
          <div key={label}>
            <dt className="font-mono text-[0.62rem] font-bold text-white/42 uppercase">
              {label}
            </dt>
            <dd className="mt-1 font-mono text-lg font-black text-white">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
