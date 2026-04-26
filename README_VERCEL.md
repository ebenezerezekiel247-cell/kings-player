# Deploying Kings Player to Vercel

Kings Player deploys entirely to **Vercel** — frontend and backend together. No separate server needed.

The Express API runs as a Vercel Serverless Function (`api/index.ts`). The React frontend is built as a static site. Both live on the same Vercel domain.

---

## How it works

```
User → Vercel
  /api/* → Serverless Function (Express)  → Turso DB
  /*     → Static frontend (React/Vite)
```

---

## Deploy in 3 steps

### Step 1 — Import the repo on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project**
3. Import the `kings-player` repository
4. Vercel reads `vercel.json` automatically — **do not change any build settings**
5. Do **not** click Deploy yet — add env vars first (Step 2)

---

### Step 2 — Add Environment Variables

In the Vercel project settings under **Environment Variables**, add all of these:

| Variable | Value | Where to get it |
|---|---|---|
| `TURSO_URL` | `libsql://kings-player-yourname.aws-us-east-1.turso.io` | [turso.tech](https://turso.tech) → your DB |
| `TURSO_TOKEN` | your auth token (long JWT) | Turso dashboard → Generate Token |
| `CLERK_SECRET_KEY` | `sk_live_...` | [clerk.com](https://dashboard.clerk.com) → API Keys |
| `CLERK_PUBLISHABLE_KEY` | `pk_live_...` | Clerk dashboard → API Keys |
| `VITE_CLERK_PUBLISHABLE_KEY` | same `pk_live_...` key | Same as above |
| `SESSION_SECRET` | any random 32+ character string | Generate at [randomkeygen.com](https://randomkeygen.com) |
| `NODE_ENV` | `production` | Set manually |

---

### Step 3 — Deploy

Click **Deploy**. Vercel will:
1. Install all pnpm workspace dependencies
2. Build the React frontend (`artifacts/kings-player`)
3. Bundle the Express API into a serverless function (`api/index.ts`)
4. Deploy everything to `https://your-project.vercel.app`

---

### Step 4 — Update Clerk Allowed Origins

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) → your app
2. Under **Domains**, add your Vercel URL (e.g. `https://kings-player.vercel.app`)
3. Under **Redirect URLs**, add:
   - `https://kings-player.vercel.app/sign-in`
   - `https://kings-player.vercel.app/sign-up`
   - `https://kings-player.vercel.app/browse`

---

## Troubleshooting

**API routes return 404**
→ Make sure `api/index.ts` exists in the repo root (it's auto-detected by Vercel).

**`TURSO_URL` or `TURSO_TOKEN` errors in logs**
→ Double-check the token — it's a long JWT string from Turso's "Generate Token" dialog.

**Clerk sign-in redirects to wrong URL**
→ Add your Vercel domain under Clerk → Domains and Redirect URLs.

**Build fails: `Cannot find module`**
→ Make sure `pnpm-lock.yaml` is committed to the repo (do not add it to `.gitignore`).

**Function timeout**
→ Turso uses HTTP connections so cold starts are fast. If you see timeouts, check your `TURSO_URL` is correct.
