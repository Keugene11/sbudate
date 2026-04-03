# SBUdate

A dating app built exclusively for Stony Brook University students. Hinge-style profile discovery with photos, prompts, and a mutual-like matching system.

**Live:** [sbudate.vercel.app](https://sbudate.vercel.app)

## Features

- **Profile Discovery** — Swipe-style card interface to browse other SBU students' profiles
- **Matching** — Like or skip profiles; mutual likes create matches
- **Messaging** — Real-time chat with read receipts, turn indicators, and unread badges
- **Rich Profiles** — Up to 6 photos, 3+ answerable prompts, and detailed personal info
- **Onboarding** — 11-step flow capturing name, age, gender, height, major, grad year, hometown, residence hall, and lifestyle preferences
- **Gender Filters** — Filter discovery by Women, Men, or Everyone

## Tech Stack

- **Framework:** Next.js (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Auth:** Supabase Auth with Google OAuth (restricted to @stonybrook.edu)
- **Database:** Supabase (Postgres)
- **Native Apps:** Capacitor (iOS + Android)
- **CI/CD:** GitHub Actions (iOS builds on macOS runner)
- **Deployment:** Vercel

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view locally.
