import type { DiscordAdapter } from "@chat-adapter/discord";
import type { Chat } from "chat";

const publicUrl = process.env.PUBLIC_URL;

if (!publicUrl) {
  throw new Error("PUBLIC_URL is required");
}

export async function startGateway(discord: DiscordAdapter) {
    try {
        await discord.startGatewayListener(
        {
            waitUntil: (task) => void task.catch(console.error),
        },
        600_000,
        undefined,
        `${publicUrl}/api/webhooks/discord`
        );
    } catch (error) {
        console.error("Gateway listener failed:", error);
    }
}

export async function registerCommands() {
    const appId = process.env.DISCORD_APPLICATION_ID!;
    const token = process.env.DISCORD_BOT_TOKEN!;
    if(!appId || !token) return console.warn("Commands could not be registered.");

    await fetch(
        `https://discord.com/api/v10/applications/${appId}/commands`,
        {
        method: "PUT",
        headers: {
            Authorization: `Bot ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify([
            {
                name: "allow",
                description: "Bypass moderation for a user",
                type: 1,
                options: [
                    {
                        name: "user",
                        description: "The user to allow",
                        type: 6,
                        required: true
                    }
                ]
            },
            {
                name: "disallow",
                description: "Remove moderation bypass for a user",
                type: 1,
                options: [
                    {
                        name: "user",
                        description: "The user to disallow",
                        type: 6,
                        required: true
                    }
                ]
            },
        ]),
        }
    );
}