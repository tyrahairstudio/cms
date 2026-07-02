# Tyra Hair Studio

Static Cloudflare Pages website for Tyra Hair Studio with Decap CMS at `/tyraadmin`.

Project handoff notes for future Codex threads are in `AGENTS.md`.

## Local preview

```powershell
npm run serve
```

Open `http://localhost:8788`.

## Decap CMS

Admin path: `/tyraadmin`

The CMS is configured in `public/tyraadmin/config.yml`. For production editing, replace the `repo` value with the GitHub repository that owns this site and configure a Decap-compatible GitHub OAuth backend.

## Deploy

```powershell
npm run deploy
```

This publishes `public` to the Cloudflare Pages project `tyrahairstudio`, available at `https://tyrahairstudio.pages.dev`.
