"use client";

import { useCallback } from "react";
import { Sparkles } from "lucide-react";

import BrandMark from "@/app/_components/brand-mark";
import { apiClient } from "@/lib/api-client";
import { useApiQuery } from "@/hooks/use-api-query";

export default function MioScoreList() {
  const query = useCallback(
    () => apiClient.getMionaires().then(({ mionaires }) => mionaires),
    [],
  );
  const { data: mionaires, error, isLoading } = useApiQuery(query);

  return (
    <section className="glass-panel relative flex min-h-80 flex-col overflow-hidden rounded-3xl">
      <BrandMark className="text-secondary/3 pointer-events-none absolute -right-12 -bottom-12 text-[14rem]" />
      <header className="relative flex items-center gap-4 border-b border-white/8 p-5">
        <span className="bg-secondary/10 text-secondary grid size-11 flex-none place-items-center rounded-xl">
          <Sparkles className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">The million club</p>
          <h2 className="mt-0.5 text-xl font-black text-white">
            Recent Mionaires
          </h2>
        </div>
      </header>
      <div className="relative flex-1 p-3">
        {isLoading && (
          <p className="p-6 text-center text-sm text-white/45" role="status">
            Loading the million club…
          </p>
        )}
        {error && (
          <p className="p-6 text-center text-sm text-red-200" role="alert">
            {error.message}
          </p>
        )}
        {!isLoading && !error && mionaires?.length === 0 && (
          <p className="p-6 text-center text-sm text-white/40">
            The velvet rope is waiting for its first name.
          </p>
        )}
        <ol className="flex flex-col gap-1">
          {mionaires?.map((mionaire, index) => (
            <li
              className="grid grid-cols-[2.2rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/62 odd:bg-white/3"
              key={`${mionaire.name}-${mionaire.date ?? index}`}
            >
              <span className="bg-highlight-gold/10 text-highlight-gold grid size-7 place-items-center rounded-full text-[0.65rem] font-black">
                {index + 1}
              </span>
              <span className="truncate font-bold text-white">
                {mionaire.name}
              </span>
              <time
                className="text-xs text-white/35 tabular-nums"
                dateTime={mionaire.date ?? undefined}
              >
                {mionaire.date
                  ? new Date(mionaire.date).toLocaleDateString()
                  : "Unknown"}
              </time>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
