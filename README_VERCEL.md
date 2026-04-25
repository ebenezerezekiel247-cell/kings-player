# Deploying Kings Player to Vercel + Railway

Kings Player is a full-stack app. The **frontend** (React/Vite) goes to **Vercel** and the **backend** (Express API) goes to **Railway**. Both are free-tier friendly.

---

## Architecture

```
User → Vercel (React frontend) → /api/* rewrites → Railway (Express API) → Turso DB
```

---

## Step 1 — Deploy the Backend to Railway

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Select your `kings-player` repository
4. Railway will detect the repo — click **Configure** and set:
   - **Root Directory**: `artifacts/api-server`
   - **Build Command**: `cd ../.. && pnpm install && pnpm --filter @workspace/api-server run build`
   - **Start Command**: `pnpm --filter @workspace/api-server run start`
5. Under **Variables**, add all of these:

| Variable | Value |
|---|---|
| `TURSO_URL` | `libsql://kings-player-yourname.aws-us-east-1.turso.io` |
| `TURSO_TOKEN` | your Turso auth token |
| `CLERK_SECRET_KEY` | `sk_live_...` from Clerk dashboard |
| `CLERK_PUBLISHABLE_KEY` | `pk_live_...` from Clerk dashboard |
| `SESSION_SECRET` | any long random string |
| `NODE_ENV` | `production` |

6. Click **Deploy** — Railway will give you a public URL like `https://kings-player-api.up.railway.app`
7. **Copy this URL** — you need it for the next step

---

## Step 2 — Update vercel.json with your Railway URL

Open `vercel.json` at the project root and replace `YOUR_RAILWAY_BACKEND_URL`:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://kings-player-api.up.railway.app/api/$1"
    }
  ]
}
```

Commit and push this change to GitHub before deploying to Vercel.

---

## Step 3 — Deploy the Frontend to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click **Add New → Project**
3. Import your `kings-player` GitHub repository
4. Vercel will detect `vercel.json` — confirm these settings:
   - **Framework Preset**: Other
   - **Build Command**: `pnpm install && pnpm --filter @workspace/kings-player run build`
   - **Output Directory**: `artifacts/kings-player/dist/public`
   - **Install Command**: `pnpm install`
5. Under **Environment Variables**, add:

| Variable | Value |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_...` from Clerk dashboard |
| `VITE_API_URL` | *(leave empty — the vercel.json rewrite handles API routing)* |

6. Click **Deploy**

---

## Step 4 — Update Clerk Allowed Origins

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) → your app
2. Under **Domains**, add your Vercel URL (e.g. `https://kings-player.vercel.app`)
3. Under **Redirect URLs**, add:
   - `https://kings-player.vercel.app/sign-in`
   - `https://kings-player.vercel.app/sign-up`
   - `https://kings-player.vercel.app/browse`

---

## Environment Variables Summary

### Railway (Backend)
| Variable | Where to get it |
|---|---|
| `TURSO_URL` | Turso dashboard → your DB |
| `TURSO_TOKEN` | Turso dashboard → Generate Token |
| `CLERK_SECRET_KEY` | Clerk dashboard → API Keys |
| `CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API Keys |
| `SESSION_SECRET` | Any random 32+ char string |
| `NODE_ENV` | Set to `production` |

### Vercel (Frontend)
| Variable | Where to get it |
|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk dashboard → API Keys (same `pk_live_...` key) |

---

## Troubleshooting

**API calls return 404 on Vercel**
→ Make sure `vercel.json` has the correct Railway URL in the rewrites block and you've pushed it to GitHub before deploying.

**Clerk sign-in redirects to wrong URL**
→ Add your Vercel domain in the Clerk dashboard under Domains and Redirect URLs.

**Railway build fails**
→ Make sure the Root Directory is set to `artifacts/api-server` and pnpm is available. Railway auto-detects pnpm from `pnpm-lock.yaml`.

**TURSO_URL or TURSO_TOKEN errors**
→ Double-check you copied the full token from Turso — it's a long JWT string.
