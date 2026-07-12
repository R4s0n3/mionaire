"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { Trophy } from "lucide-react";

import { useAuth } from "./_components/auth-provider";

type AuthMode = "login" | "register";

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
    return <p className="text-center text-xl">Checking your player session…</p>;
  }

  if (user) {
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-center text-xl">
          Logged in as {user.name ?? user.email ?? "player"}
        </p>
        {error && (
          <p className="w-full text-center text-sm text-red-200">{error}</p>
        )}
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/play"
            className="text-highlight-purple animate-pulse rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
          >
            START GAME
          </Link>
          <button
            type="button"
            onClick={() => void onSignOut()}
            disabled={isSubmitting}
            className="rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20 disabled:cursor-wait disabled:opacity-60"
          >
            {isSubmitting ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl bg-black/10 p-5"
    >
      {mode === "register" && (
        <label className="flex w-full flex-col gap-1 text-sm">
          Player name{" "}
          <span className="text-xs opacity-75">(optional, 12 max)</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={12}
            autoComplete="nickname"
            className="focus:border-highlight-purple rounded-md border border-white/30 bg-white/10 px-3 py-2 text-base outline-none"
          />
        </label>
      )}
      <label className="flex w-full flex-col gap-1 text-sm">
        Email
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          className="focus:border-highlight-purple rounded-md border border-white/30 bg-white/10 px-3 py-2 text-base outline-none"
        />
      </label>
      <label className="flex w-full flex-col gap-1 text-sm">
        Password
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          maxLength={128}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
          className="focus:border-highlight-purple rounded-md border border-white/30 bg-white/10 px-3 py-2 text-base outline-none"
        />
      </label>
      {error && (
        <p className="w-full text-center text-sm text-red-200">{error}</p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 rounded-full bg-white/10 px-10 py-3 font-semibold transition hover:bg-white/20 disabled:cursor-wait disabled:opacity-60"
      >
        {isSubmitting
          ? "Please wait…"
          : mode === "login"
            ? "Sign in"
            : "Create account"}
      </button>
      <div className="flex w-full items-center gap-3 py-1" aria-hidden="true">
        <span className="h-px flex-1 bg-white/25" />
        <span className="text-xs uppercase opacity-70">or</span>
        <span className="h-px flex-1 bg-white/25" />
      </div>
      <button
        type="button"
        onClick={() => void onDiscordSignIn()}
        disabled={isSubmitting}
        className="w-full rounded-full bg-[#5865f2] px-6 py-3 font-semibold transition hover:bg-[#4752c4] disabled:cursor-wait disabled:opacity-60"
      >
        Continue with Discord
      </button>
      <button
        type="button"
        onClick={() => {
          setMode((current) => (current === "login" ? "register" : "login"));
          setError(null);
        }}
        className="hover:text-highlight-purple text-sm underline underline-offset-4"
      >
        {mode === "login"
          ? "Need an account? Create one"
          : "Already have an account? Sign in"}
      </button>
    </form>
  );
}

export default function Home() {
  return (
    <main className="bg-primary text-body from-primary to-primary-dark relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b">
      <Link href="/leaderboard" className="absolute top-4 right-4">
        <Trophy className="text-body size-8" />
      </Link>
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="radial-gradient-highlight relative size-42">
          <Image
            className="animate-spin-slow drop-shadow-xs"
            fill
            src="/logo.svg"
            alt="logo"
          />
        </div>
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-secondary-dark text-2xl font-black">
            WILL YOU BE OUR
          </h1>
          <h1 className="text-primary-light text-6xl font-black">MIONAIRE?</h1>
        </div>
        <AuthPanel />
      </div>
    </main>
  );
}
