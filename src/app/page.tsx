"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowRight, Gamepad2, LogOut, Trophy } from "lucide-react";

import BrandMark from "./_components/brand-mark";
import { useAuth } from "./_components/auth-provider";

type AuthMode = "login" | "register";

const inputClassName =
  "mt-1.5 w-full rounded-sm border-2 border-white/20 bg-primary-dark px-3 py-2.5 text-base text-white outline-none placeholder:text-white/30 focus:border-secondary";

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
        className="flex min-h-52 flex-col items-center justify-center gap-4"
        role="status"
      >
        <BrandMark className="text-secondary animate-spin text-4xl" />
        <p className="eyebrow">checking player…</p>
      </div>
    );
  }

  if (user) {
    const playerName = user.name ?? user.email ?? "player";

    return (
      <div className="flex min-h-52 flex-col justify-between gap-8">
        <div>
          <p className="eyebrow">signed in as</p>
          <h2 className="mt-2 truncate text-3xl font-black text-white uppercase">
            {playerName}
          </h2>
          <p className="mt-3 font-mono text-xs text-white/58">
            signal good. questions loaded. probably.
          </p>
        </div>

        {error && (
          <p
            className="border-l-4 border-red-300 bg-red-400/10 p-3 text-sm text-red-100"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Link href="/play" className="show-button flex-1">
            start <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => void onSignOut()}
            disabled={isSubmitting}
            className="show-button-secondary !px-3"
            aria-label="Sign out"
          >
            <LogOut className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="eyebrow">player access</p>

      <div className="bg-primary-dark mt-4 grid grid-cols-2 border-2 border-white/12 p-1">
        {(["login", "register"] as AuthMode[]).map((authMode) => (
          <button
            key={authMode}
            type="button"
            onClick={() => {
              setMode(authMode);
              setError(null);
            }}
            className={`px-3 py-2 font-mono text-xs font-black uppercase ${mode === authMode
                ? "bg-highlight-purple text-white"
                : "text-white/45 hover:text-white"
              }`}
            aria-pressed={mode === authMode}
          >
            {authMode === "login" ? "sign in" : "new player"}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3.5">
        {mode === "register" && (
          <label className="font-mono text-[0.68rem] font-bold text-white/70 uppercase">
            player name{" "}
            <span className="font-normal text-white/35">(optional)</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={12}
              autoComplete="nickname"
              className={inputClassName}
            />
          </label>
        )}
        <label className="font-mono text-[0.68rem] font-bold text-white/70 uppercase">
          email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            className={inputClassName}
          />
        </label>
        <label className="font-mono text-[0.68rem] font-bold text-white/70 uppercase">
          password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            maxLength={128}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
            className={inputClassName}
          />
        </label>

        {error && (
          <p
            className="border-l-4 border-red-300 bg-red-400/10 p-3 text-sm text-red-100"
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
            ? "one moment…"
            : mode === "login"
              ? "sign in"
              : "make account"}
          {!isSubmitting && (
            <ArrowRight className="size-4" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          onClick={() => void onDiscordSignIn()}
          disabled={isSubmitting}
          className="show-button-secondary w-full !normal-case"
        >
          <Gamepad2 className="size-4 text-[#9ea7ff]" aria-hidden="true" />
          use Discord instead
        </button>
      </form>
    </div>
  );
}

export default function Home() {
  return (
    <main className="show-stage text-body min-h-svh">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
        <span className="broadcast-note">MIONAIRE</span>
        <Link
          href="/leaderboard"
          className="show-button-secondary !min-h-10 !px-3"
        >
          <Trophy className="text-highlight-gold size-4" aria-hidden="true" />
          scores
        </Link>
      </header>

      <div className="mx-auto grid w-full max-w-5xl items-center gap-12 px-5 py-10 sm:px-8 lg:min-h-[calc(100svh-82px)] lg:grid-cols-[1fr_23rem] lg:gap-20 lg:py-6">
        <section className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <div className="brand-orbit mb-8 size-36 sm:size-44">
            <BrandMark className="animate-spin-slow text-secondary text-[6.5rem] sm:text-[8rem]" />
          </div>
          <p className="eyebrow">a quiz program of some kind</p>
          <h1 className="mt-3 text-[clamp(2.9rem,9vw,5.8rem)] leading-[0.86] font-black tracking-[-0.045em] text-white uppercase">
            Will you be our
            <span className="text-highlight-purple block">Mionaire?</span>
          </h1>
          <p className="mt-5 font-mono text-sm leading-6 text-white/62">
            15 questions · 2 jokers · 1 missing letter
          </p>
        </section>

        <section
          className="glass-panel w-full p-5 sm:p-6"
          aria-label="Player access"
        >
          <AuthPanel />
        </section>
      </div>
    </main>
  );
}
