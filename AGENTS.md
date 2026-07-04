# Tyra Hair Studio Project Notes

## Project

This workspace contains the Tyra Hair Studio static website.

- Current custom-domain site: https://tyrahairstudio.com
- Current custom-domain admin CMS path: https://tyrahairstudio.com/tyraadmin/
- Current Git-deployed Pages fallback site: https://tyrahairstudio-git.pages.dev
- Current Git-deployed Pages fallback admin CMS path: https://tyrahairstudio-git.pages.dev/tyraadmin/
- Current Cloudflare Pages project name: `tyrahairstudio-git`
- Legacy Direct Upload site: https://tyrahairstudio.pages.dev
- Legacy Direct Upload Cloudflare Pages project name: `tyrahairstudio`
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
  base_url: https://tyrahairstudio-git.pages.dev/api
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
https://tyrahairstudio-git.pages.dev

Authorization callback URL:
https://tyrahairstudio-git.pages.dev/api/callback
```

Then add these variables/secrets to the Cloudflare Pages project `tyrahairstudio-git`:

- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

Without these, `/api/auth` returns `Missing GITHUB_CLIENT_ID on Cloudflare Pages.`

The GitHub user logging into Decap must have push access to the private repo `tyrahairstudio/cms`.

## Deployment

Wrangler is available as `wrangler.cmd` on this Windows machine. The plain `wrangler` PowerShell command may fail because script execution is disabled.

Production now deploys automatically from GitHub via Cloudflare Pages Git integration on project `tyrahairstudio-git`.

Before making local edits, always pull the latest GitHub state first because Decap CMS publishes commits directly to `tyrahairstudio/cms`:

```powershell
git pull
```

Then edit, test, commit, and push. Cloudflare Pages will automatically deploy pushes to `main`.

Legacy manual deploy command for the old Direct Upload project only:

```powershell
wrangler.cmd pages deploy public --project-name tyrahairstudio --branch main --commit-dirty=true
```

Manual deploy also uploads the `functions` bundle when the `functions` folder exists at the project root.

Useful checks:

```powershell
curl.exe -L https://tyrahairstudio-git.pages.dev/tyraadmin/config.yml
curl.exe -i https://tyrahairstudio-git.pages.dev/api/auth?provider=github
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

- `git` is available in this shell; `gh` was not available when checked.
- The original `tyrahairstudio` Pages project was deployed using Cloudflare Pages Direct Upload via Wrangler.
- The newer `tyrahairstudio-git` Pages project is connected to GitHub repo `tyrahairstudio/cms` and auto-deploys from branch `main`.
- Decap CMS edits commit to GitHub. Always `git pull` before local edits so CMS changes are not overwritten.
- `public/_headers` sets `Cache-Control: no-store` for `/tyraadmin/config.yml` so CMS config changes are not cached.

## Safe Editing Guidance

- Keep the site static and lightweight unless the user explicitly asks for a framework.
- Do not remove the Decap `base_url`/`auth_endpoint` settings; they prevent fallback to Netlify auth.
- Do not commit OAuth secrets into files. Store `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` in Cloudflare Pages variables/secrets.
- Preserve the `functions/api/*` OAuth routes unless replacing them with another Decap-compatible auth provider.
