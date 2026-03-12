# KAE — AI ordering assistant for independent restaurants

KAE is a web app that helps independent restaurants manage vendors and place orders. It uses **Next.js 14**, **Supabase** (auth + database), **Tailwind CSS**, and **shadcn/ui**.

## Features

- **Auth:** Email/password sign up and sign in
- **Roles:** Restaurant and Admin (restaurant users go through onboarding; admins skip it)
- **5-step onboarding** for restaurants:
  1. **Basics** — Restaurant name, address, phone, cuisine type
  2. **Ordering habits** — Frequency, preferred delivery days/times, min order, notes
  3. **Vendor contacts** — Add suppliers (name, email, phone, website, notes)
  4. **Regular items** — Items you order often (item, vendor, quantity, frequency)
  5. **Review** — Summary and complete setup
- **Dashboard** — Vendor list and a “Place New Order” button (order flow coming later)

---

## Run KAE locally

### 1. Prerequisites

- **Node.js** 18+ and **npm**
- A **Supabase** account: [supabase.com](https://supabase.com)

### 2. Clone or open the project

```bash
cd C:\Users\Eli\kae
```

### 3. Install dependencies

```bash
npm install
```

### 4. Create a Supabase project

1. Go to [app.supabase.com](https://app.supabase.com) and sign in.
2. Click **New project**.
3. Pick an organization, name (e.g. `kae`), database password, and region. Create the project.
4. Wait until the project is ready.

### 5. Apply the database schema

1. In the Supabase dashboard, open **SQL Editor**.
2. Click **New query**.
3. Open the file `supabase/schema.sql` in this repo and copy its full contents.
4. Paste into the SQL Editor and click **Run**.

You should see success. This creates:

- `profiles` (linked to auth users, with `role` and `onboarding_completed_at`)
- `restaurant_profiles` (onboarding answers: basics, ordering habits)
- `vendors` and `regular_items`
- RLS policies and triggers (e.g. create profile on signup)

### 6. Get your Supabase URL and anon key

1. In Supabase, go to **Project Settings** (gear) → **API**.
2. Copy:
   - **Project URL**
   - **anon public** key (under “Project API keys”)

### 7. Configure environment variables

1. In the project root, copy the example env file:

   ```bash
   copy .env.example .env.local
   ```

   (On macOS/Linux use `cp .env.example .env.local`.)

2. Open `.env.local` and set:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-pasted-here
   ```

Replace with your actual Project URL and anon key.

### 8. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 9. Try the flow

1. **Sign up** — Use “Sign up” and create an account (email + password). Confirm email if Supabase email confirmation is enabled.
2. **Sign in** — Log in with that account.
3. **Onboarding** — You’ll be sent through the 5 steps. Fill basics, ordering habits, add at least one vendor, then add at least one regular item (choose the vendor you added), then review and complete.
4. **Dashboard** — You’ll land on the dashboard with your vendor list and a “Place New Order” button.

### 10. (Optional) Create an admin user

By default, new users get the **restaurant** role and must complete onboarding. To make someone an **admin** (skips onboarding, sees dashboard only):

1. In Supabase go to **Authentication** → **Users** and find the user.
2. Go to **Table Editor** → **profiles** and find the row with that user’s `id`.
3. Edit the `role` column from `restaurant` to `admin` and save.

That user can sign in and go straight to the dashboard (no onboarding).

---

## Deploy to Vercel (live URL with Supabase)

Follow these steps to get a live URL with Supabase connected.

### Step 1: Push your code to GitHub

1. In the `kae` folder, initialize Git if you haven’t:
   ```bash
   cd C:\Users\Eli\kae
   git init
   ```
2. Create a new repo on [github.com](https://github.com/new) (e.g. `kae-ai-ordering`).
3. Add the remote and push:
   ```bash
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

### Step 2: Set up Supabase (if not done yet)

1. Go to [app.supabase.com](https://app.supabase.com) and sign in.
2. **New project** → choose org, name (e.g. `kae`), password, region → Create.
3. In **SQL Editor** → **New query** → paste the full contents of `supabase/schema.sql` → **Run**.
4. Go to **Project Settings** (gear) → **API** and copy:
   - **Project URL**
   - **anon public** key

### Step 3: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub is easiest).
2. Click **Add New…** → **Project**.
3. **Import** the GitHub repo that contains `kae` (e.g. `YOUR_USERNAME/kae-ai-ordering`).
4. Vercel will detect Next.js. Set **Root Directory** to `kae` only if the repo root is the repo root and the app is in a subfolder; if the repo root *is* the `kae` app, leave Root Directory blank.
5. Before deploying, open **Environment Variables** and add:
   - **Name:** `NEXT_PUBLIC_SUPABASE_URL`  
     **Value:** your Supabase Project URL (e.g. `https://xxxx.supabase.co`)
   - **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
     **Value:** your Supabase anon public key
6. Click **Deploy**. Wait for the build to finish.

### Step 4: Configure Supabase for your live URL

1. In Supabase: **Authentication** → **URL Configuration**.
2. Under **Site URL**, set your Vercel URL (e.g. `https://your-app.vercel.app`).
3. Under **Redirect URLs**, add:
   - `https://your-app.vercel.app/**`
   - `https://your-app.vercel.app/auth/callback` (if you use a callback route)
4. Save. Your live app can now use Supabase auth and database.

### Step 5: Use your live URL

- Vercel gives you a URL like `https://kae-xxx.vercel.app`. Open it to use the app.
- Every push to `main` will trigger a new deployment. Env vars are already set, so Supabase stays connected.

---

## Project structure

- `src/app/` — App Router pages and layouts
  - `(auth)/login`, `(auth)/signup` — Auth pages
  - `dashboard/` — Dashboard and “Place New Order”
  - `onboarding/` — 5-step onboarding flow
- `src/components/ui/` — shadcn-style UI components
- `src/lib/supabase/` — Supabase client, server, and middleware helpers
- `src/types/database.ts` — Shared types for profiles, onboarding, vendors, items
- `supabase/schema.sql` — Database schema to run once in Supabase SQL Editor

---

## Scripts

- `npm run dev` — Start dev server (default port 3000)
- `npm run build` — Production build
- `npm run start` — Run production server
- `npm run lint` — Run ESLint

---

## Tech stack

- **Next.js 14** (App Router)
- **Supabase** — Auth (email/password) and Postgres (with RLS)
- **Tailwind CSS** — Styling
- **shadcn/ui** — Button, Input, Card, Label, etc.
- **Lucide React** — Icons
