import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { BaseMessage } from "@langchain/core/messages";

const model = new ChatGroq({ model: "llama-3.3-70b-versatile", temperature: 0.7 });
const parser = new StringOutputParser();

class WindowChatMessageHistory extends InMemoryChatMessageHistory {
    private windowSize: number;

    constructor(windowSize: number = 10) {
        super();
        this.windowSize = windowSize;
    }

    override async addMessage(message: BaseMessage): Promise<void> {
        await super.addMessage(message);
        const messages = await this.getMessages();

        // Trim to window size — oldest messages drop ho jaate hain
        if (messages.length > this.windowSize) {
            const trimmed = messages.slice(messages.length - this.windowSize);
            await this.clear();
            for (const msg of trimmed) {
                await super.addMessage(msg);
            }
        }
    }
}


const sessions: Record<string, WindowChatMessageHistory> = {};

function getWindowHistory(sessionId: string): WindowChatMessageHistory {
    if (!sessions[sessionId]) {
        // Only keep last 6 messages (3 turns)
        sessions[sessionId] = new WindowChatMessageHistory(6);
    }
    return sessions[sessionId];
}

const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful assistant."],
    new MessagesPlaceholder("history"),
    ["human", "{input}"],
]);

const chain = new RunnableWithMessageHistory({
    runnable: prompt.pipe(model).pipe(parser),
    getMessageHistory: getWindowHistory,
    inputMessagesKey: "input",
    historyMessagesKey: "history",
});

const config = { configurable: { sessionId: "window_test" } };

console.log("Window Memory (keeps last 6 messages = 3 turns)\n");

const messages = [
    "My favourite color is blue.",
    "My favourite food is pizza.",
    "My favourite sport is cricket.",
    "My favourite language is TypeScript.",
    // By now, first message should be dropped from window
    "What is my favourite color?",   // should say "I don't know" or be uncertain
    "What is my favourite language?", // should remember this one
];

for (const msg of messages) {
    console.log(`User: ${msg}`);
    const response = await chain.invoke({ input: msg }, config);
    console.log(`AI: ${response}`);
    const history = await sessions["window_test"]?.getMessages() || [];
    console.log(`   [History size: ${history.length} messages]\n`);
}