"use client";

import { api } from "@/trpc/react";
import {
  Crown,
  Star,
  Trophy,
  Target,
  Calendar,
  TrendingUp,
} from "lucide-react";

export default function PlayerStatsCard() {
  const [stats] = api.game.getPlayerStats.useSuspenseQuery();

  if (!stats) return null;

  return (
    <div className="from-primary via-primary to-primary-dark border-highlight-purple relative w-full max-w-5xl overflow-hidden rounded-2xl border-2 bg-gradient-to-br shadow-2xl">
      <div className="absolute inset-0 bg-[url('/logo.png')] bg-center bg-no-repeat opacity-5" />

      <div className="relative flex flex-col gap-6 p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {stats.image ? (
              <img
                src={stats.image}
                alt={stats.name}
                className="border-highlight-gold h-16 w-16 rounded-full border-2 shadow-lg"
              />
            ) : (
              <div className="bg-highlight-purple border-highlight-gold flex h-16 w-16 items-center justify-center rounded-full border-2 shadow-lg">
                <span className="text-highlight-gold text-2xl font-bold">
                  {stats.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-2xl font-black tracking-wide text-white uppercase">
                {stats.name}
              </h2>
              <div className="mt-1 flex items-center gap-2">
                <Crown size={16} className="text-highlight-gold" />
                <span className="text-highlight-gold font-semibold">
                  Rank #{stats.overallRank}
                </span>
                {stats.isMionaire && (
                  <>
                    <span className="text-white">•</span>
                    <span className="flex items-center gap-1 font-semibold text-green-400">
                      <Star size={14} className="fill-green-400" />
                      Mionaire
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm tracking-wider text-gray-300 uppercase">
              Allstars Score
            </p>
            <p className="text-highlight-gold text-4xl font-black">
              {stats.overallScore.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex flex-col items-center gap-1 rounded-xl bg-white/10 p-4">
            <Target size={20} className="text-blue-400" />
            <p className="text-xs text-gray-300 uppercase">Best Stage</p>
            <p className="text-xl font-bold text-white">
              Stage {stats.bestStage}
            </p>
          </div>

          <div className="flex flex-col items-center gap-1 rounded-xl bg-white/10 p-4">
            <Calendar size={20} className="text-green-400" />
            <p className="text-xs text-gray-300 uppercase">
              Today&apos;s Daily
            </p>
            <p className="text-xl font-bold text-white">
              {stats.dailyScoreToday}
            </p>
          </div>

          <div className="flex flex-col items-center gap-1 rounded-xl bg-white/10 p-4">
            <Trophy size={20} className="text-amber-400" />
            <p className="text-xs text-gray-300 uppercase">Daily All-Time</p>
            <p className="text-xl font-bold text-white">
              {stats.dailyScoreAllTime}
            </p>
          </div>

          <div className="flex flex-col items-center gap-1 rounded-xl bg-white/10 p-4">
            <TrendingUp size={20} className="text-purple-400" />
            <p className="text-xs text-gray-300 uppercase">Games Played</p>
            <p className="text-xl font-bold text-white">{stats.gamesPlayed}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
