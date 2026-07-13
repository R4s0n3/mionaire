"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Gamepad2,
  LogOut,
  Medal,
  Sparkles,
  Trophy,
  UserRound,
} from "lucide-react";

import BrandMark from "./_components/brand-mark";
import { useAuth } from "./_components/auth-provider";

type AuthMode = "login" | "register";

const inputClassName =
  "mt-1.5 w-full rounded-xl border border-white/15 bg-[#03061f]/70 px-4 py-3 text-base text-white outline-none transition placeholder:text-white/25 focus:border-secondary/70 focus:ring-4 focus:ring-secondary/10";

function AuthPanel() {
  const { isLoading, login, loginWithDiscord, logout, register, user } =
    useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        await login({ email, password });
      } else {
        await register({
          email,
          password,
          name: name.trim() || undefined,
        });
      }
      setPassword("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onDiscordSignIn() {
    setError(null);
    setIsSubmitting(true);

    try {
      await loginWithDiscord();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to start Discord sign-in.",
      );
      setIsSubmitting(false);
    }
  }

  async function onSignOut() {
    setError(null);
    setIsSubmitting(true);

    try {
      await logout();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to sign out.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div
        className="flex min-h-80 flex-col items-center justify-center gap-4"
        role="status"
      >
        <BrandMark className="text-secondary animate-spin text-5xl" />
        <p className="eyebrow">Preparing the studio</p>
      </div>
    );
  }

  if (user) {
    const playerName = user.name ?? user.email ?? "Player";

    return (
      <div className="flex min-h-80 flex-col justify-between gap-8">
        <div>
          <p className="eyebrow">Contestant confirmed</p>
          <div className="mt-5 flex items-center gap-4">
            {user.image ? (
              // OAuth avatar hosts are provider-controlled.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                className="border-highlight-gold/70 size-14 rounded-full border-2 object-cover shadow-lg"
              />
            ) : (
              <span className="border-secondary/40 bg-secondary/10 grid size-14 place-items-center rounded-full border">
                <UserRound
                  className="text-secondary size-6"
                  aria-hidden="true"
                />
              </span>
            )}
            <div className="min-w-0">
              <p className="text-xs tracking-[0.16em] text-white/45 uppercase">
                Tonight&apos;s player
              </p>
              <h2 className="truncate text-2xl font-black text-white">
                {playerName}
              </h2>
            </div>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-6 text-white/58">
            The lights are on and the money ladder is waiting. Take your seat
            when you&apos;re ready.
          </p>
        </div>

        {error && (
          <p
            className="rounded-xl border border-red-300/30 bg-red-400/10 p-3 text-sm text-red-100"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/play" className="show-button flex-1">
            Enter the hot seat{" "}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => void onSignOut()}
            disabled={isSubmitting}
            className="show-button-secondary sm:px-4"
            aria-label="Sign out"
          >
            <LogOut className="size-4" aria-hidden="true" />
            <span className="sm:hidden">Sign out</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div>
        <p className="eyebrow">Contestant check-in</p>
        <h2 className="mt-2 text-2xl font-black text-white">
          {mode === "login" ? "Welcome back." : "Join the game."}
        </h2>
        <p className="mt-1 text-sm leading-6 text-white/50">
          {mode === "login"
            ? "Sign in and return to the hot seat."
            : "Create your player profile in a few seconds."}
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 rounded-full border border-white/10 bg-black/20 p-1">
        {(["login", "register"] as AuthMode[]).map((authMode) => (
          <button
            key={authMode}
            type="button"
            onClick={() => {
              setMode(authMode);
              setError(null);
            }}
            className={`rounded-full px-3 py-2 text-xs font-black tracking-[0.12em] uppercase transition ${
              mode === authMode
                ? "bg-white/12 text-white shadow-sm"
                : "text-white/40 hover:text-white/70"
            }`}
            aria-pressed={mode === authMode}
          >
            {authMode === "login" ? "Sign in" : "Register"}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3.5">
        {mode === "register" && (
          <label className="text-xs font-bold tracking-[0.08em] text-white/68 uppercase">
            Player name{" "}
            <span className="font-normal text-white/30">· optional</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={12}
              autoComplete="nickname"
              placeholder="Your stage name"
              className={inputClassName}
            />
          </label>
        )}
        <label className="text-xs font-bold tracking-[0.08em] text-white/68 uppercase">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="player@example.com"
            required
            className={inputClassName}
          />
        </label>
        <label className="text-xs font-bold tracking-[0.08em] text-white/68 uppercase">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            maxLength={128}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            placeholder="At least 8 characters"
            required
            className={inputClassName}
          />
        </label>

        {error && (
          <p
            className="rounded-xl border border-red-300/30 bg-red-400/10 p-3 text-sm text-red-100"
            role="alert"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="show-button mt-1 w-full"
        >
          {isSubmitting
            ? "Please wait…"
            : mode === "login"
              ? "Enter the studio"
              : "Create player"}
          {!isSubmitting && (
            <ArrowRight className="size-4" aria-hidden="true" />
          )}
        </button>

        <div className="flex items-center gap-3 py-0.5" aria-hidden="true">
          <span className="h-px flex-1 bg-white/10" />
          <span className="text-[0.65rem] font-bold tracking-[0.16em] text-white/30 uppercase">
            or
          </span>
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <button
          type="button"
          onClick={() => void onDiscordSignIn()}
          disabled={isSubmitting}
          className="show-button-secondary w-full normal-case"
        >
          <Gamepad2 className="size-4 text-[#9ea7ff]" aria-hidden="true" />
          Continue with Discord
        </button>
      </form>
    </div>
  );
}

export default function Home() {
  return (
    <main className="show-stage text-body min-h-svh">
      <div className="show-grid pointer-events-none absolute inset-0 -z-1" />

      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-white no-underline"
          aria-label="Mionaire home"
        >
          <BrandMark className="text-secondary text-3xl" />
          <span className="text-sm font-black tracking-[0.22em]">MIONAIRE</span>
        </Link>
        <Link
          href="/leaderboard"
          className="show-button-secondary !min-h-10 !px-4"
        >
          <Trophy className="text-highlight-gold size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Hall of fame</span>
          <span className="sm:hidden">Scores</span>
        </Link>
      </header>

      <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-5 pt-6 pb-12 sm:px-8 lg:min-h-[calc(100svh-88px)] lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:px-10 lg:pt-0">
        <section className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <div className="brand-orbit mb-7 size-40 sm:size-48 lg:size-56">
            <BrandMark className="animate-spin-slow text-secondary text-[7rem] drop-shadow-[0_0_24px_rgba(89,230,255,0.35)] sm:text-[8.5rem] lg:text-[10rem]" />
          </div>

          <p className="eyebrow flex items-center gap-2">
            <Sparkles className="size-3.5" aria-hidden="true" />
            The ultimate trivia night
          </p>
          <h1 className="mt-3 max-w-3xl text-[clamp(2.75rem,9vw,6.4rem)] leading-[0.84] font-black tracking-[-0.055em] text-white uppercase">
            One question
            <span className="from-highlight-gold to-highlight-purple block bg-gradient-to-r via-[#fff0bd] bg-clip-text text-transparent">
              from glory.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-white/60 sm:text-lg">
            Fifteen questions. Two lifelines. One shot at the top prize. Trust
            your instincts and climb the ladder to become a Mionaire.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-xs font-bold tracking-[0.1em] text-white/45 uppercase lg:justify-start">
            <span className="flex items-center gap-2">
              <Medal
                className="text-highlight-gold size-4"
                aria-hidden="true"
              />
              $1,000,000 top prize
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="text-secondary size-4" aria-hidden="true" />
              Daily challenge
            </span>
          </div>
        </section>

        <section
          className="glass-panel relative mx-auto w-full max-w-md overflow-hidden rounded-[2rem] p-6 sm:p-8"
          aria-label="Player access"
        >
          <div className="bg-highlight-purple/12 absolute -top-24 -right-24 size-52 rounded-full blur-3xl" />
          <div className="bg-secondary/8 absolute -bottom-28 -left-28 size-56 rounded-full blur-3xl" />
          <div className="relative">
            <AuthPanel />
          </div>
        </section>
      </div>
    </main>
  );
}
