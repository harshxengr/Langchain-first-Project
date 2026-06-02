import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { HumanMessage, AIMessage, BaseMessage } from "@langchain/core/messages";

const model = new ChatGroq({ model: "llama-3.3-70b-versatile", temperature: 0.7 });
const parser = new StringOutputParser();

class FileChatMessageHistory extends InMemoryChatMessageHistory {
    private filePath: string;

    constructor(sessionId: string) {
        super();
        this.filePath = `./chat_sessions/${sessionId}.json`;
    }

    async load(): Promise<void> {
        const file = Bun.file(this.filePath);
        const exists = await file.exists();

        if (exists) {
            const data = await file.json();
            for (const msg of data.messages) {
                if (msg.type === "human") {
                    await super.addMessage(new HumanMessage(msg.content));
                } else if (msg.type === "ai") {
                    await super.addMessage(new AIMessage(msg.content));
                }
            }
            console.log(`Loaded ${data.messages.length} messages from disk`);
        } else {
            console.log("Starting fresh session");
        }
    }

    override async addMessage(message: BaseMessage): Promise<void> {
        await super.addMessage(message);
        await this.persist();
    }

    private async persist(): Promise<void> {
        const messages = await this.getMessages();
        const data = {
            lastUpdated: new Date().toISOString(),
            messageCount: messages.length,
            messages: messages.map((m) => ({
                type: m._getType(),
                content: m.content,
                timestamp: new Date().toISOString(),
            })),
        };

        await Bun.write(this.filePath, JSON.stringify(data, null, 2));
    }

    override async clear(): Promise<void> {
        await super.clear();

        const file = Bun.file(this.filePath);
        if (await file.exists()) {
            await Bun.write(this.filePath, JSON.stringify({ messages: [] }));
        }
    }
}

await Bun.write("./chat_sessions/.gitkeep", "");

const fileHistories: Record<string, FileChatMessageHistory> = {};

async function getFileHistory(sessionId: string): Promise<FileChatMessageHistory> {
    if (!fileHistories[sessionId]) {
        const history = new FileChatMessageHistory(sessionId);
        await history.load();
        fileHistories[sessionId] = history;
    }
    return fileHistories[sessionId];
}

const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful assistant. Remember everything from previous sessions."],
    new MessagesPlaceholder("history"),
    ["human", "{input}"],
]);

const chain = new RunnableWithMessageHistory({
    runnable: prompt.pipe(model).pipe(parser),
    getMessageHistory: getFileHistory,
    inputMessagesKey: "input",
    historyMessagesKey: "history",
});

const sessionId = "persistent_user_001";
const config = { configurable: { sessionId } };

console.log("Persistent File-Based Memory");
console.log("Run this script multiple times — it will remember!\n");

const testMessages = [
    "My name is Harsh and I'm building a SaaS product.",
    "What's my name and what am I building?",
];

for (const msg of testMessages) {
    console.log(`User: ${msg}`);
    const response = await chain.invoke({ input: msg }, config);
    console.log(`AI: ${response}\n`);
}

console.log(`\nSession saved to: ./chat_sessions/${sessionId}.json`);
console.log("Run script again — AI will remember Harsh!");