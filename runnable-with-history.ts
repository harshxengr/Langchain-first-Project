import { RunnableSequence, RunnableWithMessageHistory } from "@langchain/core/runnables";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate, MessagesPlaceholder, PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { BaseMessage } from "@langchain/core/messages";

const model = new ChatGroq({ model: "llama-3.3-70b-versatile", temperature: 0.7 });
const parser = new StringOutputParser();

// Store sessions in memory (in production: use Redis/DB)
const sessionStore: Record<string, InMemoryChatMessageHistory> = {};

// Get or create a session
function getSessionHistory(sessionId: string): InMemoryChatMessageHistory {
    if (!sessionStore[sessionId]) {
        sessionStore[sessionId] = new InMemoryChatMessageHistory();
    }
    return sessionStore[sessionId];
}

// Base chain — MessagesPlaceholder is KEY
const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful assistant. Remember the conversation context."],
    new MessagesPlaceholder("history"), // ← history inject hogi yahan
    ["human", "{input}"],
]);

const baseChain = RunnableSequence.from([
    prompt,
    model,
    parser
])

// Wrap chain with history management
const chainWithHistory = new RunnableWithMessageHistory({
    runnable: baseChain,
    getMessageHistory: getSessionHistory,
    inputMessagesKey: "input",
    historyMessagesKey: "history",
});

// SESSION 1 — User "Harsh" ki conversation
console.log("Harsh's Session");

const harsh1 = await chainWithHistory.invoke(
    { input: "Hi! My name is Harsh and I love TypeScript." },
    { configurable: { sessionId: "harsh" } }
);
console.log("Harsh turn 1:", harsh1);

const harsh2 = await chainWithHistory.invoke(
    { input: "What programming language did I say I love?" },
    { configurable: { sessionId: "harsh" } }
);
console.log("Harsh turn 2:", harsh2);

// SESSION 2 — User "karan" ki alag conversation
console.log("\nKaran's Session");

const karan1 = await chainWithHistory.invoke(
    { input: "My name is Karan and I prefer Python." },
    { configurable: { sessionId: "karan" } }
);
console.log("Karan turn 1:", karan1);

// Harsh ka session Karan ke session se completely alag hai
const harsh3 = await chainWithHistory.invoke(
    { input: "What's my name?" },
    { configurable: { sessionId: "harsh" } }
);
console.log("\nHarsh turn 3 (her session is isolated):", harsh3);

// Check what's stored in memory
console.log("\nSession Contents");
const harshHistory = await getSessionHistory("harsh").getMessages();
console.log(`Harsh has ${harshHistory.length} messages in history`);
harshHistory.forEach((msg: BaseMessage, i: number) => {
    console.log(`  [${i + 1}] ${msg._getType()}: ${String(msg.content).substring(0, 50)}...`);
});