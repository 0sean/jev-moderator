import { createMemoryState } from "@chat-adapter/state-memory";
import { Chat, Message, type ChatConfig, type SlashCommandEvent, type StateAdapter, type Thread } from "chat";
import { experimental_evaluate as evaluate, type Experimental_EvaluationModel as EvaluationModel } from "ai";

export type Config =
    Omit<ChatConfig, "userName" | "state"> &
    Partial<Pick<ChatConfig, "userName" | "state">> &
    {
        threshold?: number;
        admins?: string[];
        evaluationModel?: EvaluationModel;
    };

export function createBot(config: Config) {
    const bot = new Chat({
        userName: "jev-moderator",
        state: createMemoryState(),
        ...config
    });
    const state = bot.getState();

    bot.onNewMessage(/(.|\s)*\S(.|\s)*/, (thread, message) => handleMessage(thread, message, state, config.threshold, config.admins, config.evaluationModel));
    bot.onSlashCommand("/allow", (event) => handleAllow(event, state));
    bot.onSlashCommand("/disallow", (event) => handleDisallow(event, state));

    return bot;
}

async function handleMessage(thread: Thread, message: Message, state: StateAdapter, threshold: number = 2, admins: string[] = [], evaluationModel?: EvaluationModel) {
    const user = `${thread.adapter.name}:${message.author.userId}`;
    if(admins.includes(user)) return;

    const allowed = await state.getList("jev-allowed");
    if(allowed.includes(user)) return;

    const result = await evaluate({
        model: evaluationModel || "typesafe-ai/jev",
        state: {
            message: message.text
        },
        questions: {
            moderationDecision: {
                type: "score",
                instructions: "Which category does this message fit into?",
                criteria: [
                    "Clean; contains no profanity, malicious content or abusive intent",
                    "Mild profanity; contains some profanity without intending to be abusive or cause offence",
                    "Abusive language; contains heavy profanity, intending to abusive, offend or hurt another person, group or thing",
                    "Dangerous content; contains dangerous, heavily hurtful or misleading/scam content"
                ]
            }
        }
    });
    const { score } = result.answers.moderationDecision;

    if(score >= threshold) await thread.adapter.deleteMessage(thread.id, message.id);
}

async function handleAllow(event: SlashCommandEvent, state: StateAdapter) {
    await state.appendToList("jev-allowed", `${event.adapter.name}:${event.text}`);
    await event.channel.post("✅ User allowed");
}

async function handleDisallow(event: SlashCommandEvent, state: StateAdapter) {
    const allowed = await state.getList("jev-allowed");
    await state.set("jev-allowed", allowed.filter(l => l !== `${event.adapter.name}:${event.text}`));
    await event.channel.post("✅ User disallowed");
}