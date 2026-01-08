"use client";

import { api } from "@/trpc/react";
import { Crown, User } from "lucide-react";

interface LeaderboardListProps {
  currentUserId?: string;
}

export default function LeaderboardList({
  currentUserId,
}: LeaderboardListProps) {
  const [userScores] = api.game.getScores.useSuspenseQuery();

  return (
    <div className="from-highlight-gold/90 text-body to-highlight-gold/60 border-highlight-gold relative flex aspect-video size-full flex-col items-center overflow-y-auto rounded-xl border bg-gradient-to-br shadow-xl">
      <h5 className="bg-highlight-gold text-highlight-purple sticky top-0 flex w-full items-center justify-center gap-1.5 p-2 px-4">
        <Crown size={14} />
        Allstars
        <Crown size={14} />
      </h5>
      {userScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map((u, i) => (
          <div
            className={`bg-highlight-gold/20 flex w-full items-center gap-4 p-2 px-4 text-sm ${i % 2 && "bg-highlight-gold/40 text-body"} ${u.id === currentUserId ? "ring-offset-highlight-gold/60 ring-2 ring-white ring-offset-2" : ""}`}
            key={u.id}
          >
            <span>#{i + 1}</span>
            <span className="truncate">{u.name}</span>
            <span className="ml-auto text-center">{u.score}</span>
            {u.id === currentUserId && (
              <User size={14} className="text-highlight-purple" />
            )}
          </div>
        ))}
    </div>
  );
}
