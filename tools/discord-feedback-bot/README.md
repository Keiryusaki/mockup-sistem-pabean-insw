# Discord Feedback Bot Template

This folder contains a minimal `discord.js` mirror bot template for the INSW mockup.

## What it does

- Listens to one Discord channel or forum parent channel.
- Mirrors root feedback and reply messages into the mockup feed format.
- Optionally writes a JSON feed file for the local `/feedback` inbox.
- Optionally pushes the same JSON payload to a remote endpoint.
- Exposes a small submit API so the mockup app can create forum posts directly from the FE widget.

## Install

```bash
cd tools/discord-feedback-bot
npm install
```

## Configure

Copy `.env.example` to `.env` and fill in:

- `DISCORD_TOKEN`
- `DISCORD_FEEDBACK_CHANNEL_ID` (forum parent channel recommended)
- `FEEDBACK_API_PORT` for the local submit endpoint
- optional reviewer user or role IDs
- optional `MIRROR_OUTPUT_PATH`
- optional `MIRROR_PUSH_URL`

If you point `DISCORD_FEEDBACK_CHANNEL_ID` at a forum parent channel, each forum post becomes one root feedback item and thread comments become its replies.
The mockup FE widget should POST JSON to `POST /submit-feedback` on this service.

## Run

```bash
npm start
```

## Local mirror flow

If `MIRROR_OUTPUT_PATH` is set, the bot writes a JSON file with this shape:

```json
{
  "generatedAt": "2026-07-06T12:00:00.000Z",
  "items": [
    {
      "id": "discord-...",
      "kind": "root",
      "parentId": null,
      "discordMessageId": "...",
      "discordReplyToMessageId": null
    }
  ]
}
```

The mockup app can load that file by setting:

```bash
VITE_FEEDBACK_FEED_URL=/feedback-feed.sample.json
```

For a real mirror endpoint, point `MIRROR_PUSH_URL` to a small service that serves the same JSON response.
