# Local Feedback Feed Mirror

This tiny server exposes a JSON feed for the `/feedback` inbox.

## What it does

- `GET /feedback-feed.json` returns the current mirror payload.
- `POST /feedback-feed.json` overwrites the current payload.
- `GET /health` is a quick status check.

## Run

```bash
cd tools/feedback-feed-mirror
npm start
```

## Config

Copy `.env.example` if you want to change the port or feed file.

## App wiring

Point the mockup app to:

```bash
VITE_FEEDBACK_FEED_URL=http://localhost:8787/feedback-feed.json
```

Then the header dropdown and `/feedback` page will read from the same mirror endpoint.
