import PlayClient from "./_components/play-client";

export default async function GamePage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string | string[] }>;
}) {
  const { game } = await searchParams;
  const gameId = typeof game === "string" ? game : undefined;

  return <PlayClient gameId={gameId} />;
}
