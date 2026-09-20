# Who Should I DM?

A lightweight outreach-signal demo powered by Jev. It helps founders, creators, GTM, sales, and partnerships teams decide who is worth contacting based on a selected goal.

Each post receives a typed decision:

- **DM** - strong, timely match
- **Maybe** - relevant, but missing a clear opening
- **Skip** - low-signal for the selected goal

The result also includes an opportunity type, fit score, confidence, and a short explanation.

## Features

- Animated 15-post scouting reel
- Six outreach goals:
  - Find partnerships
  - Find customers
  - Find opportunities
  - Creator collaborations
  - Customer discovery
  - Networking
- Goal-specific classification results
- Playful DM, Maybe, and Skip sorting zones
- Animated profile launches and accumulating avatar buckets
- Compact opportunity and confidence verdicts
- Collapsible live metrics drawer
- Responsive desktop and mobile interface
- JevvieScout Chrome/Edge extension for live X posts

## How it works

```text
Goal + post + profile context
              ↓
       Jev classification
              ↓
DM / Maybe / Skip + fit + confidence + reason
              ↓
          Feed overlay
```

The feed content is sample data, but every decision is produced by the real Jev API. The server sends the 15-post reel to Jev in three parallel batches, where typed Choice and Score questions evaluate the decision, opportunity type, fit, and reason. The UI displays Jev's confidence, measured API round-trip time, and run cost. If Jev does not return a billed cost, the UI estimates it from input-token usage at the public list price.

A larger LLM can later generate personalized outreach only for strong `DM` matches.

## Tech stack

- Next.js 15
- React 19
- Tabler Icons
- Plain CSS

## Run locally

### Prerequisites

- Node.js 20 or later
- npm

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Jev

Copy `.env.example` to `.env` and add your TypeSafe API key:

```env
TYPESAFE_API_KEY="your_api_key_here"
```

Optional overrides:

```env
TYPESAFE_MODEL="jev-latest"
TYPESAFE_API_URL="https://api.typesafe.ai/v1/systemone"
```

The API key is only read by the server route and is never sent to the browser.

### 3. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Create a production build

```bash
npm run build
```

### 5. Run the production build

```bash
npm start
```

## Other commands

```bash
# Run ESLint
npm run lint
```

## Project structure

```text
app/
├── api/classify/route.js  # Server-side Jev integration
├── globals.css            # Complete visual system and responsive styles
├── layout.js              # Root layout and page metadata
└── page.js                # Feed, goal selector, filters, and results UI
extension/                 # JevvieScout Manifest V3 browser extension
```

## JevvieScout extension

JevvieScout reads posts and visible profile context directly from the rendered X page, then sends that text to this application's server-side Jev classifier. It does not use the X API or transmit the user's X session cookies.

See [extension/README.md](extension/README.md) for installation and configuration steps.

## Classification response

The internal `/api/classify` route normalizes Jev's typed answers into the following UI shape:

```json
{
  "results": [
    {
      "decision": "DM",
      "opportunity": "Event partnership",
      "score": 96,
      "confidence": 92,
      "reason": "Actively seeking AI tooling partners for a relevant developer audience."
    }
  ],
  "latency": 206,
  "cost": "0.0000140",
  "model": "jev-1.13.0"
}
```

`decision` should be one of `DM`, `Maybe`, or `Skip`. Scores and confidence values should be numbers between `0` and `100`.
