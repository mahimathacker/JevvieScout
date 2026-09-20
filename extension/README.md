# JevvieScout browser extension

JevvieScout is a Chrome/Edge Manifest V3 extension that turns the rendered X feed into a playful, live scouting experience. As posts enter the viewport, Jev classifies them and their profile tokens visibly fly into DM, Maybe, or Skip zones in a floating dock.

It does not use the X API. The content script reads the post text, public author identity, and any profile context already visible in the current page. It never reads or sends X authentication cookies.

## Run locally

1. Start the main application from the repository root:

   ```bash
   npm run dev
   ```

2. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge.
3. Enable **Developer mode**.
4. Choose **Load unpacked**.
5. Select the repository's `extension` directory.
6. Open or refresh `https://x.com`.
7. Select the JevvieScout toolbar icon, choose a goal, and click **Scan visible posts**.

The extension defaults to `http://localhost:3000/api/classify`. Change this under JevvieScout **Settings** after deploying the Next.js app.

## How it works

```text
Rendered X page
    ↓ content extraction
JevvieScout content script
    ↓ batched message
Extension service worker
    ↓ POST /api/classify
Next.js server → TypeSafe Jev
    ↓
Isolated result overlay on each X post
```

JevvieScout uses an intersection observer to process only posts that actually enter the viewport. It batches up to eight newly visible posts, animates each result from its on-page avatar into the correct scouting zone, and leaves a small verdict pill beneath the post. The dock includes an optional stats drawer with analyzed count, API timing, estimated cost, and model.

## Production endpoint

Deploy the Next.js application over HTTPS, then open the extension settings and enter the full classifier endpoint, for example:

```text
https://your-domain.example/api/classify
```

Chrome will request permission for that specific host. The TypeSafe API key remains on the Next.js server and is never stored in the extension.
