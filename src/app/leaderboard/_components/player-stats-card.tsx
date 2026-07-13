"use client";

import { useCallback } from "react";
import {
  Calendar,
  Crown,
  Star,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";

import BrandMark from "@/app/_components/brand-mark";
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
        className="glass-panel rounded-3xl p-6 text-center text-sm text-white/42"
        role="status"
      >
        Loading your player card…
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div
        className="glass-panel rounded-3xl p-5 text-center text-sm text-red-100"
        role="alert"
      >
        {error?.message ??
          "Your player statistics are not available right now."}
      </div>
    );
  }

  const metrics = [
    {
      label: "Best stage",
      value: `Stage ${stats.bestStage}`,
      icon: Target,
      color: "text-secondary",
    },
    {
      label: "Today",
      value: stats.dailyScoreToday,
      icon: Calendar,
      color: "text-green-300",
    },
    {
      label: "Daily total",
      value: stats.dailyScoreAllTime,
      icon: Trophy,
      color: "text-highlight-gold",
    },
    {
      label: "Games played",
      value: stats.gamesPlayed,
      icon: TrendingUp,
      color: "text-highlight-purple",
    },
  ];

  return (
    <div className="glass-panel border-highlight-purple/25 relative mx-auto w-full max-w-5xl overflow-hidden rounded-[2rem]">
      <BrandMark className="text-highlight-purple/4 pointer-events-none absolute -top-20 -right-20 text-[20rem]" />
      <div className="relative p-6 sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            {stats.image ? (
              // OAuth avatar hosts are provider-controlled.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={stats.image}
                alt=""
                className="border-highlight-gold/65 size-16 flex-none rounded-full border-2 object-cover shadow-lg"
              />
            ) : (
              <div className="border-highlight-gold/50 bg-highlight-purple/15 grid size-16 flex-none place-items-center rounded-full border-2">
                <span className="text-highlight-gold text-2xl font-black">
                  {stats.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <p className="eyebrow">Your player card</p>
              <h2 className="mt-1 truncate text-2xl font-black tracking-wide text-white uppercase">
                {stats.name}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                <Crown
                  size={15}
                  className="text-highlight-gold"
                  aria-hidden="true"
                />
                <span className="text-highlight-gold font-bold">
                  Rank #{stats.overallRank}
                </span>
                {stats.isMionaire && (
                  <span className="flex items-center gap-1 rounded-full bg-green-300/10 px-2 py-0.5 text-xs font-bold text-green-300">
                    <Star
                      size={12}
                      className="fill-green-300"
                      aria-hidden="true"
                    />{" "}
                    Mionaire
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="border-highlight-gold/20 bg-highlight-gold/6 rounded-2xl border px-5 py-4 text-left sm:text-right">
            <p className="text-[0.65rem] font-bold tracking-[0.15em] text-white/38 uppercase">
              All-stars score
            </p>
            <p className="text-highlight-gold mt-1 text-4xl font-black tabular-nums">
              {stats.overallScore.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metrics.map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="rounded-2xl border border-white/7 bg-white/4 p-4"
            >
              <Icon className={`size-4 ${color}`} aria-hidden="true" />
              <p className="mt-3 text-[0.63rem] font-bold tracking-[0.11em] text-white/35 uppercase">
                {label}
              </p>
              <p className="mt-1 text-lg font-black text-white">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
