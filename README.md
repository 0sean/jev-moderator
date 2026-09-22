# jev-moderator

Use Jev (and optionally an image understanding model) to moderate chats across many messaging platforms, such as Discord, Slack and Telegram. Built with Bun, Chat SDK and AI SDK.
This project is packaged as a library so that you can provide your own Chat SDK adapters and AI SDK providers.

## Quick start

Requires Bun to be installed.

1. Create a new Bun project and install `jev-moderator`

   ```bash
   bun init
   bun install jev-moderator
   ```

2. In `index.ts`, import the `startBot` function from `jev-moderator` and run it with your adapters.

   ```ts
   import { createDiscordAdapter } from "@chat-adapter/discord";
   import { startBot } from "jev-moderator";

   await startBot({
      adapters: {
         discord: createDiscordAdapter()
      }
   })
   ```

   By default, it uses the [in-memory state adapter](https://chat-sdk.dev/adapters/official/memory), but you can swap it for any other [state adapter](https://chat-sdk.dev/docs/state-adapters) for persistence. In addition to Chat SDK's state, jev-moderator uses it to store allowed users.

   ```ts
   import { createDiscordAdapter } from "@chat-adapter/discord";
   import { createPostgresState } from "@chat-adapter/state-pg";
   import { startBot } from "jev-moderator";

   await startBot({
      adapters: {
         discord: createDiscordAdapter()
      },
      state: createPostgresState()
   })
   ```

3. Set the necessary environment variables for your Chat SDK adapters (this can be done via a `.env` file)

   ```dotenv
   # Use the environment variables required for your adapters - for example, Discord:
   DISCORD_BOT_TOKEN=your_bot_token
   DISCORD_PUBLIC_KEY=your_application_public_key
   DISCORD_APPLICATION_ID=your_application_id
   # Required regardless of adapters
   PUBLIC_URL=https://your-public-host.example
   AI_GATEWAY_API_KEY=your_ai_gateway_key
   ```

   [View all adapters](https://chat-sdk.dev/adapters)

4. Run the bot:

   ```bash
   bun index.ts
   ```

   This will start a web server on port 3000 to serve webhooks (port can be changed with environment variable `PORT`).

5. Expose the web server to the internet and complete any additional setup for your adapters (such as setting up webhooks and adding it to your chats).

   You may want to use something like [Cloudflare Tunnels](https://developers.cloudflare.com/tunnel/)/[Quick Tunnels](https://try.cloudflare.com/) or [ngrok](https://ngrok.com/) to do this.

## How moderation works

Each new message is scored from 0 to 3:

| Score | Category |
| --- | --- |
| 0 | Clean |
| 1 | Mild profanity |
| 2 | Abusive language |
| 3 | Dangerous content |

Messages with a score at or above the threshold are deleted (the default threshold is `2`). Messages from IDs in `admins` or the allow list skip moderation. If `imageModel` is configured, image attachments on messages that pass the text check are scanned; inappropriate images are deleted. If an image scan fails, the message is also deleted.

The bot registers `/allow` and `/disallow` slash commands to add or remove a user from the moderation bypass list (this has only been tested on Discord).

## Configuration

`startBot` accepts the same configuration as [Chat SDK](https://chat-sdk.dev/docs/usage#configuration-options), but with a few additions, all of which are optional.

| Option | Type | Description |
| --- | --- | --- |
| `threshold` | `number` | The score at which messages are deleted. |
| `admins` | `string[]` | A list of user IDs to bypass moderation for and allow running slash commands, in the format `provider:user_id`. |
| `evaluationModel` | [`EvaluationModel`](https://ai-sdk.dev/docs/ai-sdk-core/evaluation#provider-models) | Swap Jev for any other evaluation model (which currently is just LLMs with structured outputs) |
| `imageModel` | [`LanguageModel`](https://ai-sdk.dev/providers/ai-sdk-providers) | Provide an LLM with image understanding to use to scan image attachments with. |