import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableWithMessageHistory, RunnableLambda, RunnableSequence } from "@langchain/core/runnables";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";

const model = new ChatGroq({ model: "llama-3.3-70b-versatile", temperature: 0.3 });
const parser = new StringOutputParser();

// Summary memory — old messages ko summarize karta hai
class SummarizingChatHistory extends InMemoryChatMessageHistory {
    private maxMessages: number;
    private summaryModel: typeof model;
    private currentSummary: string = "";

    constructor(maxMessages: number = 8, summaryModel: typeof model) {
        super();
        this.maxMessages = maxMessages;
        this.summaryModel = summaryModel;
    }

    override async addMessage(message: BaseMessage): Promise<void> {
        await super.addMessage(message);
        const messages = await this.getMessages();

        // When we exceed the limit, summarize oldest messages
        if (messages.length > this.maxMessages) {
            await this.summarizeOldMessages();
        }
    }

    private async summarizeOldMessages(): Promise<void> {
        const messages = await this.getMessages();
        // Take the oldest half to summarize
        const toSummarize = messages.slice(0, Math.floor(messages.length / 2));
        const toKeep = messages.slice(Math.floor(messages.length / 2));

        // Build summary prompt
        const conversationText = toSummarize
            .map((m) => `${m._getType()}: ${m.content}`)
            .join("\n");

        const summaryPrompt = `
      Summarize this conversation concisely, keeping all important facts:
      
      Previous summary: ${this.currentSummary || "None"}
      
      New conversation to add:
      ${conversationText}
      
      Create a new comprehensive summary:
    `;

        const summaryResponse = await this.summaryModel.invoke(summaryPrompt);
        this.currentSummary = summaryResponse.content as string;

        console.log(`\n[Summary updated - compressed ${toSummarize.length} messages]\n`);

        // Replace history: summary as SystemMessage + recent messages
        await this.clear();
        await super.addMessage(
            new SystemMessage(`Conversation summary so far: ${this.currentSummary}`)
        );
        for (const msg of toKeep) {
            await super.addMessage(msg);
        }
    }

    getSummary(): string {
        return this.currentSummary;
    }
}

const sessions: Record<string, SummarizingChatHistory> = {};

function getSummaryHistory(sessionId: string): SummarizingChatHistory {
    if (!sessions[sessionId]) {
        sessions[sessionId] = new SummarizingChatHistory(6, model);
    }
    return sessions[sessionId];
}

const prompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        "You are a helpful customer support agent. Use conversation history and summaries to maintain context.",
    ],
    new MessagesPlaceholder("history"),
    ["human", "{input}"],
]);

const chain = new RunnableWithMessageHistory({
    runnable: prompt.pipe(model).pipe(parser),
    getMessageHistory: getSummaryHistory,
    inputMessagesKey: "input",
    historyMessagesKey: "history",
});

// Simulate a long customer support conversation
const conversation = [
    "Hi, I ordered a laptop last week. Order #12345.",
    "The laptop arrived but the screen has dead pixels in the top right corner.",
    "I've tried restarting it multiple times but the pixels are still dead.",
    "I need a replacement, not a repair. The laptop was brand new!",
    "My shipping address is 123 Tech Street, Bangalore.",
    "Can you confirm when the replacement will arrive?",
    "Also, can I keep the old laptop until the new one arrives?",
    // By here, summarization should have kicked in
    "What was the issue I reported with my laptop?",
    "What's my order number?",
];

const config = { configurable: { sessionId: "support_session" } };

console.log("Summary Memory Demo\n");
for (const msg of conversation) {
    console.log(`Customer: ${msg}`);
    const response = await chain.invoke({ input: msg }, config);
    console.log(`Agent: ${response}\n`);
}

const finalSummary = sessions["support_session"]?.getSummary();
if (finalSummary) {
    console.log("Final Conversation Summary");
    console.log(finalSummary);
}