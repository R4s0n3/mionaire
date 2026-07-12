# Mionaire web client

The Mionaire web app is a Next.js client. It contains no database,
Prisma, scheduler, AI-generation, or server-side game API code. It talks to a
separately deployed `mionaire-api` Express service over JSON REST and Auth.js
endpoints. The two projects can live in independent repositories.

## Prerequisites

- Bun 1.3+
- Node.js 22.x for the Next.js production server
- A running `mionaire-api` instance

This repository uses Bun as its sole package manager. `bun.lock` is the
canonical lockfile; do not create an npm `package-lock.json` alongside it.

## Local development

Install the web dependencies:

```sh
bun install
```

Create a local environment file from the example:

```sh
cp .env.example .env.local
```

Set `NEXT_PUBLIC_API_BASE_URL` to the public origin that serves both `/api/v1/*`
and `/auth/*` (not a tRPC path). For the local Express default, use
`http://localhost:3001`.

Start the web client:

```sh
bun run dev
```

Then open <http://localhost:3000>. In the API deployment, set `CORS_ORIGIN` to
the exact web origin, for example `http://localhost:3000` locally. The API must
allow credentials; wildcard CORS is not valid for this browser auth flow.

## Authentication

The landing page supports Discord OAuth plus email/password registration and
sign-in. Registration first creates a credentials user through
`POST /api/v1/auth/register`; sign-in, sign-out, and session management then use
the Auth.js routes mounted under `/auth/*`.

Auth.js stores the encrypted JWT session in an HttpOnly cookie (with secure
cookies over HTTPS). The web client never stores or reads an auth token and
sends `credentials: "include"` with API requests. It obtains an Auth.js CSRF
token before every sign-in and sign-out POST; logging out calls Auth.js so the
HttpOnly cookie is actually cleared.

For production, serve the web app and backend on the same public origin when
possible. A reverse proxy can route `/auth/*` and `/api/v1/*` to Express while
Next.js serves the rest. Same-site subdomains (for example `app.example.com`
and `api.example.com`) can also work with HTTPS and an exact credentialed CORS
allow-list. Unrelated cross-site domains are not a supported deployment shape
because browser cookie policy can prevent sessions from working.

## Environment variables

| Variable                        | Required | Purpose                                                                                                       |
| ------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`      | Yes      | Public origin serving the API and `/auth/*`, such as `https://mionaire.example.com` or a same-site API origin |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | No       | AdSense publisher ID, without the `ca-pub-` prefix                                                            |

`NEXT_PUBLIC_*` values are compiled into the browser bundle. Build the client
separately for each environment if its API URL differs. Do not put API secrets,
database URLs, OpenRouter keys, Auth.js secrets, or Discord client secrets in
this project.

## Production build and Coolify hosting

The client can be hosted independently of the API on any platform that runs
Next.js. Build it with the intended public API URL set:

```sh
NEXT_PUBLIC_API_BASE_URL="https://mionaire.example.com" bun run build
```

Run the standard Next.js production server with:

```sh
bun run start
```

For a Coolify deployment, use these application settings:

- Build Pack: `Nixpacks`
- Base Directory: `/`
- Is it a static site?: disabled
- Port Exposes: `3000`
- Install, build, and start command overrides: leave empty so Nixpacks detects
  Bun and uses the scripts in `package.json`

Add `NEXT_PUBLIC_API_BASE_URL` in Coolify and keep **Build Variable** enabled;
the build intentionally fails when it is missing or is not a valid public HTTP(S)
origin. If AdSense is enabled, make `NEXT_PUBLIC_ADSENSE_CLIENT_ID` available at
build time as well. Runtime availability is optional for both values because
Next.js compiles them into the browser bundle.

Coolify supplies `PORT` to the container, and `next start` listens on it. The API
is hosted and scaled separately; it owns database migrations, question
generation, and scheduled work. Register the backend's public callback URL in
the Discord application, for example
`https://mionaire.example.com/auth/callback/discord` for same-origin routing.

## Checks

```sh
bun run check
bun run format:check
NEXT_PUBLIC_API_BASE_URL="http://localhost:3001" bun run build
```
