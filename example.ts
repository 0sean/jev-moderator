import { createDiscordAdapter } from "@chat-adapter/discord";
import { startBot } from ".";

await startBot({
    adapters: {
        discord: createDiscordAdapter()
    }
})