# Tyra Hair Studio Project Notes

## Project

This workspace contains the Tyra Hair Studio static website.

- Production site: https://tyrahairstudio.pages.dev
- Admin CMS path: https://tyrahairstudio.pages.dev/tyraadmin/
- Cloudflare Pages project name: `tyrahairstudio`
- GitHub content/source repo configured for Decap CMS: `tyrahairstudio/cms`
- Main static output folder: `public`
- Cloudflare Pages Functions folder: `functions`

## Stack

- Static HTML/CSS/JavaScript site, no framework build step.
- Decap CMS is loaded from CDN in `public/tyraadmin/index.html`.
- Content is stored as JSON:
  - `public/content/site.json`
  - `public/content/posts.json`
- Main frontend files:
  - `public/index.html`
  - `public/styles.css`
  - `public/app.js`
- Brand/hero asset:
  - `public/assets/tyra-cover.png`

## Decap CMS

Decap config is in `public/tyraadmin/config.yml`.

Current backend config:

```yml
backend:
  name: github
  repo: tyrahairstudio/cms
  branch: main
  base_url: https://tyrahairstudio.pages.dev/api
  auth_endpoint: auth
```

Important: Decap CMS should not use Netlify auth for this project. If login redirects to `api.netlify...`, check that production is serving the latest `public/tyraadmin/config.yml` and hard refresh `/tyraadmin/`.

The project includes a Cloudflare Pages OAuth helper:

- `functions/api/auth.js`
- `functions/api/callback.js`

These routes implement GitHub OAuth for Decap:

- `/api/auth`
- `/api/callback`

## Required GitHub OAuth Setup

Create a GitHub OAuth App here:

https://github.com/settings/developers

Use:

```text
Application name:
Tyra Hair Studio CMS

Homepage URL:
https://tyrahairstudio.pages.dev

Authorization callback URL:
https://tyrahairstudio.pages.dev/api/callback
```

Then add these variables/secrets to the Cloudflare Pages project `tyrahairstudio`:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

Without these, `/api/auth` returns `Missing GITHUB_CLIENT_ID on Cloudflare Pages.`

The GitHub user logging into Decap must have push access to the private repo `tyrahairstudio/cms`.

## Deployment

Wrangler is available as `wrangler.cmd` on this Windows machine. The plain `wrangler` PowerShell command may fail because script execution is disabled.

Deploy production:

```powershell
wrangler.cmd pages deploy public --project-name tyrahairstudio --branch main --commit-dirty=true
```

This also uploads the `functions` bundle when the `functions` folder exists at the project root.

Useful checks:

```powershell
curl.exe -L https://tyrahairstudio.pages.dev/tyraadmin/config.yml
curl.exe -i https://tyrahairstudio.pages.dev/api/auth?provider=github
```

## Local Preview

Use:

```powershell
npm run serve
```

This runs:

```powershell
py -m http.server 8788 --directory public
```

Open `http://localhost:8788`.

Note: this simple static preview does not run Cloudflare Pages Functions. Use `wrangler.cmd pages dev public --port 8788` if function behavior needs local testing.

## Current Environment Notes

- `git` and `gh` were not available in this shell when checked, so source was not pushed to GitHub from this machine.
- The site was initially deployed using Cloudflare Pages Direct Upload via Wrangler.
- If Decap CMS edits are expected to update the live site automatically, connect Cloudflare Pages to the GitHub repo or redeploy after CMS commits.
- `public/_headers` sets `Cache-Control: no-store` for `/tyraadmin/config.yml` so CMS config changes are not cached.

## Safe Editing Guidance

- Keep the site static and lightweight unless the user explicitly asks for a framework.
- Do not remove the Decap `base_url`/`auth_endpoint` settings; they prevent fallback to Netlify auth.
- Do not commit OAuth secrets into files. Store `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in Cloudflare Pages variables/secrets.
- Preserve the `functions/api/*` OAuth routes unless replacing them with another Decap-compatible auth provider.
