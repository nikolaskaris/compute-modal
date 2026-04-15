# CLAUDE.md

## Project
Modal Compute Intelligence Dashboard — a GPU procurement intelligence tool built as a work sample for Modal's Compute Strategy & Operations Lead role.

## Stack
- React + Vite
- Tailwind CSS v4 (using @tailwindcss/vite plugin)
- Recharts for charts
- lucide-react for icons
- Anthropic API for live data refresh (web_search tool, no API key needed in Claude artifacts)

## Key Files
- `BUILD_SPEC.md` — the full build spec with all data, requirements, and design details. READ THIS FIRST.
- `src/App.jsx` — main app component (build everything here as a single component for now)
- `src/index.css` — just the Tailwind import

## Build Commands
- `npm run dev` — start dev server
- `npm run build` — production build

## Design Requirements
- Dark theme: bg #0a0a0f, cards #12121a, borders #1e1e2e
- Modal brand green: #62DE61
- Monospace for numbers, dense data-rich layout
- 4 tab views: Market Prices, Supplier Scorecard, Deal Evaluator, Market Trends

## Data Architecture
- Static baseline data hardcoded as constants (all in BUILD_SPEC.md)
- Live refresh via Anthropic API + web_search targeting getdeploying.com
- Cached to window.storage (persistent across sessions)
- Attribution: "Market data via getdeploying.com"

## Priority Order
If the build gets complex, prioritize:
1. Deal Evaluator (interactive calculator, highest signal)
2. Market Prices (pricing matrix + margin overlay)
3. Supplier Scorecard (provider evaluation cards)
4. Market Trends (charts + signals)
