import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableWithMessageHistory } from "@langchain/core/runnables";
import { ChatGroq } from "@langchain/groq";

const model = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0.7
})
const parser = new StringOutputParser();

const sessions: Record<string, InMemoryChatMessageHistory> = {};

function getHistory(sessionId: string): InMemoryChatMessageHistory {
    if (!sessions[sessionId]) {
        sessions[sessionId] = new InMemoryChatMessageHistory();
    }
    return sessions[sessionId];
}

const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful assistant. Use conversation history to give contextual responses."],
    new MessagesPlaceholder("history"),
    ["human", "{input}"]
])

const chain = new RunnableWithMessageHistory({
    runnable: prompt.pipe(model).pipe(parser),
    getMessageHistory: getHistory,
    inputMessagesKey: "input",
    historyMessagesKey: "history",
})

const sessionId = "user_harsh";
const config = { configurable: { sessionId } };

const conversation = [
    "Hi! My name is Harsh and I'm learning LangChain.",
    "I work at a startup building AI tools.",
    "What's my name and what am I learning?",
    "What do I do for work?",
];

console.log("Multi-turn Conversation\n");
for (const message of conversation) {
    console.log(`User: ${message}`);
    const response = await chain.invoke({ input: message }, config);
    console.log(`AI: ${response}\n`);
}

const history = await sessions[sessionId]?.getMessages() || [];
console.log(`\nTotal messages in history: ${history.length}`);