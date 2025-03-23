import Link from "next/link";
import { auth } from "@/server/auth";
import { HydrateClient } from "@/trpc/server";
import Image from "next/image";
import { Trophy } from "lucide-react";


export default async function Home() {
  const session = await auth();
  console.log("DA SESH: ", session)
  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary to-primary-dark text-body relative">
      <Link href="/leaderboard" className="absolute top-4 right-4"><Trophy className="size-8 text-body" /></Link>
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <div className="size-42  relative radial-gradient-highlight">
        <Image className="animate-spin-slow drop-shadow-xs" fill src="/logo.svg" alt="logo" />
          </div>
          <div className="flex flex-col justify-center items-center">
          <h1 className="font-black text-2xl text-secondary-dark">
           WILL YOU BE OUR
           </h1>
          <h1 className="font-black text-primary-light text-6xl">
           MIONAIRE?
           </h1>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-col items-center justify-center gap-4">
              <p className="text-center text-xl">
                {session?.user && <span>Logged in as {session.user?.name ?? "anonymous"}</span>}
              </p>
              <Link
                href={session ? "/api/auth/signout" : "/api/auth/signin"}
                className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
              >
                {session ? "Sign out" : "Sign in"}
              </Link>
            </div>
          </div>

          {session?.user && <Link className="animate-pulse text-highlight-purple" href="/play">START GAME</Link>}
        </div>
      </main>
    </HydrateClient>
  );
}
