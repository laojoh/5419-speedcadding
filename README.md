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

Each challenge has a "week of" date. The newest week that has started is "This week", and older weeks
move to the archive automatically. A challenge with a future date stays hidden until then, so you can
schedule weeks ahead.

Drawings can be PNG, JPG, WebP or PDF, up to 20 MB.

## Data

Challenges and runs are saved to `assets/data/db.json`, and drawings to `assets/data/uploads/`
(both gitignored). Back up the `data` folder. Because it's on disk, deploy to a host with a
persistent disk (a VPS, Railway, Fly.io, etc.), not a serverless platform like Vercel or Netlify.
If you use `@sveltejs/adapter-node`, set `BODY_SIZE_LIMIT=25M` so drawing uploads aren't rejected.
