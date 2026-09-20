# Who Should I DM?

A lightweight outreach-signal demo powered by Jev. It helps founders, creators, GTM, sales, and partnerships teams decide who is worth contacting based on a selected goal.

Each post receives a typed decision:

- **DM** — strong, timely match
- **Maybe** — relevant, but missing a clear opening
- **Skip** — low-signal for the selected goal

The result also includes an opportunity type, fit score, confidence, and a short explanation.

## Features

- X-style sample feed
- Six outreach goals:
  - Find partnerships
  - Find customers
  - Find opportunities
  - Creator collaborations
  - Customer discovery
  - Networking
- Goal-specific classification results
- DM, Maybe, and Skip filters
- Expandable reasoning for each decision
- Fit and confidence scores
- Latency and estimated-cost benchmark panel
- Responsive desktop and mobile interface

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

The demo uses a local API route with deterministic sample classifications and simulated latency. In production, this route can call Jev for fast filtering. A larger LLM can then generate personalized outreach only for strong `DM` matches.

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

### 2. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Create a production build

```bash
npm run build
```

### 4. Run the production build

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
├── api/classify/route.js  # Demo classification endpoint
├── globals.css            # Complete visual system and responsive styles
├── layout.js              # Root layout and page metadata
└── page.js                # Feed, goal selector, filters, and results UI
```

## Connect a real classifier

Replace the sample logic in `app/api/classify/route.js` with a call to your classification service. The interface expects this response shape:

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
  "cost": "0.00014"
}
```

`decision` should be one of `DM`, `Maybe`, or `Skip`. Scores and confidence values should be numbers between `0` and `100`.
