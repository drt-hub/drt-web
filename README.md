# drt-web

Source for the official **drt** website — landing page + docs, deployed to GitHub Pages.

> Tool: [drt-hub/drt](https://github.com/drt-hub/drt) · Package: [`drt-core`](https://pypi.org/project/drt-core/) · Install: `pip install drt-core`

## Design principle — the repo is the single source of truth (SSoT)

The site is a **view** of `drt-hub/drt`, never a hand-maintained copy:

- **Connector matrix** is generated from drt's own CLI (`drt destinations|sources --format json`) → `data/`.
- **Docs** are pulled from drt's `docs/` + `README.md` → `synced-docs/`.
- **Version badge** is read live from PyPI (`drt-core`).

These generated inputs are refreshed by `.github/workflows/sync-from-drt.yml` (weekly + on-demand + on a `drt-updated` dispatch from the drt repo). The sync **opens a PR** — nothing deploys until a maintainer reviews and merges it.

## How updates flow

```
drt repo changes ──► sync-from-drt.yml ──► PR to drt-web ──► maintainer merges ──► deploy.yml ──► GitHub Pages
Muawiya design PR ──────────────────────► PR to drt-web ──► maintainer merges ──► deploy.yml ──► GitHub Pages
```

Every change — design or content — arrives as a PR a maintainer approves; merging to `main` auto-deploys. Approval == merge == deploy.

## Layout

| Path | What |
|---|---|
| `.github/workflows/deploy.yml` | Build (Docusaurus if `package.json` present, else the static placeholder) → publish to GitHub Pages |
| `.github/workflows/sync-from-drt.yml` | Regenerate connector matrix + docs from drt → open a PR if changed |
| `.github/workflows/check-generated-docs.yml` | Regenerate `synced-docs/cli/` and `data/*.json` from the pinned `drt-core` and fail if the committed copies moved |
| `.github/dependabot.yml` | Weekly npm + GitHub Actions update PRs (`@docusaurus/*` and `react` grouped; the pins below are deliberately excluded) |
| `scripts/sync-from-drt.sh` | The generator (CLI JSON + a shallow clone of drt's `docs/`) |
| `scripts/gen-cli-reference.py` | Builds `synced-docs/cli/` by walking the installed drt CLI's command tree |
| `scripts/requirements-cli-docs.txt` | Pinned renderers (`click`, `typer`) shared by the generator and its drift check |
| `data/` | Generated: `destinations.json`, `sources.json`, `version.txt` (do not edit by hand) |
| `synced-docs/` | Generated: drt's `docs/` + `README.md`, plus `cli/` from `gen-cli-reference.py` (do not edit by hand) |
| `index.html` | No longer served — `deploy.yml`'s fallback if a Docusaurus build is ever unavailable; kept in sync by hand |

## Status

✅ Live. The Docusaurus app (landing `src/pages/` + docs theme) is deployed — `deploy.yml` detects `package.json` and builds it automatically. `index.html` is no longer served; it stays in the repo only as `deploy.yml`'s documented fallback if a Docusaurus build ever fails before `package.json` exists again, and is kept in sync by hand for that reason.

- Hosting: GitHub Pages → `https://drt-hub.github.io/drt-web/` (custom domain `drthub.dev` can be attached later — then set Docusaurus `baseUrl` from `/drt-web/` to `/`).

## Contributing the Docusaurus port

Open a PR adding the Docusaurus app at the repo root (`package.json`, `docusaurus.config.js`, `src/pages/`, `docs/`). Consume the generated inputs:

- connector matrix → read `data/destinations.json` / `data/sources.json`
- docs → source from `synced-docs/`
- version badge → `data/version.txt`

Use `baseUrl: '/drt-web/'`. `deploy.yml` builds to `./build` (Docusaurus default).
