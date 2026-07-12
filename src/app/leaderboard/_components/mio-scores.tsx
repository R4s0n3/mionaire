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
    <div className="bg-primary text-body border-primary from-primary/90 to-primary-dark/30 relative flex aspect-video size-full flex-col items-center overflow-y-auto rounded-xl border bg-gradient-to-br shadow-xl">
      <h5 className="bg-primary-dark sticky top-0 flex w-full justify-center p-2 px-4 uppercase">
        Recent Mionaires
      </h5>
      {isLoading && <p className="p-4 text-center">Loading scores…</p>}
      {error && <p className="p-4 text-center text-red-200">{error.message}</p>}
      {!isLoading && !error && mionaires?.length === 0 && (
        <div className="bg-primary-light flex w-full justify-between p-2 px-4">
          <p className="w-full text-center">No scores yet.</p>
        </div>
      )}
      {mionaires?.map((mionaire, index) => (
        <div
          className={`bg-primary-dark/20 flex w-full items-center justify-between p-2 px-4 text-sm ${
            index % 2 ? "bg-primary-light/20" : ""
          }`}
          key={`${mionaire.name}-${mionaire.date ?? index}`}
        >
          <p className="w-1/2 truncate">{mionaire.name}</p>
          <p className="w-full text-right text-xs">
            {mionaire.date
              ? new Date(mionaire.date).toLocaleDateString()
              : "Unknown date"}
          </p>
        </div>
      ))}
    </div>
  );
}
