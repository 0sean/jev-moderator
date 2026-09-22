import type { DiscordAdapter } from "@chat-adapter/discord";
import { createBot, type Config } from "./bot"
import { registerCommands, startGateway } from "./discord";

export async function startBot(config: Config) {
    const bot = createBot(config);

    Bun.serve({
        routes: {
            "/api/webhooks/:platform": req => {
                const webhook = bot.webhooks[req.params.platform as keyof typeof bot.webhooks];
                if(!webhook) return new Response("Invalid platform", { status: 500 });
    
                return webhook(req, {
                    waitUntil: task => void task.catch(console.error)
                })
            }
        }
    })
    
    await bot.initialize();
    const discord = bot.getAdapter("discord");
    if(discord) {
        await registerCommands();
        await startGateway(discord as DiscordAdapter);
        setInterval(() => {
            void startGateway(discord as DiscordAdapter);
        }, 9 * 60 * 1000);
    }

    return bot;
}