# 5419-speedcadding
Speedcadding ranking and submission website for team 5419 and other teams!

Built with SvelteKit + Bun, using the colors and logo from [team5419.org](https://team5419.org) (Berkelium).

## Run it

```bash
bun run setup                          # installs packages in assets/
cp assets/.env.example assets/.env     # then set ADMIN_PASSWORD
bun run dev                            # http://localhost:5173
```

The app lives in `assets/`; the root `package.json` just forwards `dev`, `build`, `preview` and `check` to it.

## Pages

- `/` – this week's challenges
- `/archive` – past weeks; still open for new runs
- `/challenges/<id>` – the drawing(s), optional CAD link, and the full leaderboard split into runs during the week and after it
- `/rankings` – for every challenge, grouped by Easy / Medium / Hard: the top 3 from runs during its week, plus the all-time best
- `/submit` – video rules (when to start/stop recording, trimming in YouTube Studio), then the form at `/submit/form`. YouTube links only.
- `/admin` – log in with `ADMIN_PASSWORD`
  - **Runs**: approve or reject submissions. Only approved runs count. Each run has a timing tool:
    step through the YouTube video frame by frame, mark the start (sketch opens) and end (last
    line, mate or number), and approve with that as the official time. The runner's own time is kept
    as "claimed".
  - **Challenges**: upload new challenges (name, difficulty, week, technical drawing, optional assembly
    drawing, optional CAD link), edit or delete them.

## Weekly challenges

Each challenge has a "week of" date. A week lasts 7 days (or until the next week starts, if sooner),
then moves to the archive. A challenge with a future date stays hidden until then, so you can schedule
weeks ahead. Dates use Berkeley time (America/Los_Angeles).

Drawings can be PNG, JPG, WebP or PDF, up to 4 MB.

## Data

- **Challenges and runs:** Upstash Redis when `KV_REST_API_URL`/`KV_REST_API_TOKEN` (or
  `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`) are set; otherwise `assets/data/db.json`
  (gitignored), which is what local dev uses.
- **Drawings:** files in `assets/static/images/`, served at `/images/...`. When `GITHUB_TOKEN` is set,
  admin uploads are committed to the repo through the GitHub API and appear once Vercel redeploys
  (about a minute). Without it, uploads are written straight to the folder; commit them yourself.

## Deploying on Vercel

1. **Root directory:** in Project Settings → Build and Deployment, Root Directory should be `assets`
   (it already is if the site deploys).
2. **Redis:** Storage (or Marketplace) → add **Upstash for Redis** (free plan) and connect it to the
   project. That adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
3. **GitHub token:** on GitHub, Settings → Developer settings → Fine-grained tokens → Generate. Pick
   only this repository, and under Repository permissions set **Contents: Read and write**.
4. **Environment variables** (Project Settings → Environment Variables, Production):
   - `ADMIN_PASSWORD`: a strong password, never committed anywhere
   - `GITHUB_TOKEN`: the token from step 3
   - `GITHUB_REPO` / `GITHUB_BRANCH`: only if not `laojoh/5419-speedcadding` / `main`
5. **Redeploy** so the new variables take effect.

Because uploads commit to `main` on GitHub, run `git pull` before you push your own changes.
