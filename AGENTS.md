# AGENTS.md

## Project Overview
HealEase is a static frontend dashboard (vanilla HTML/CSS/JS) that displays medical appointment data from a public Google Sheet. No backend, no build step, no dependencies.

## Structure
- `dashboard/index.html` — main page
- `dashboard/style.css` — styling (dark/light themes)
- `dashboard/app.js` — data fetching & rendering logic

## Running
- `docker compose -f docker-compose.base44.yml up -d` — serves `dashboard/` via nginx on port 3000
- Files are bind-mounted, so edits appear immediately on refresh (call `reload_preview` to force it)
- No credentials needed — the Google Sheet is public; if the fetch fails, fallback data is shown
