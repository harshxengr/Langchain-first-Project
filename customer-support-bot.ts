import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableWithMessageHistory, RunnableLambda, RunnableSequence } from "@langchain/core/runnables";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";

const chatModel = new ChatGroq({ model: "llama-3.3-70b-versatile", temperature: 0.7 });
const classifierModel = new ChatGroq({ model: "llama-3.1-8b-instant", temperature: 0 });
const parser = new StringOutputParser();

const intentSchema = z.object({
    intent: z.enum([
        "order_status",
        "refund_request",
        "technical_issue",
        "general_inquiry",
        "escalation_needed",
        "complaint",
    ]),
    urgency: z.enum(["low", "medium", "high", "critical"]),
    sentiment: z.enum(["positive", "negative", "neutral", "frustrated"]),
    requiresHuman: z.boolean(),
});

type Intent = z.infer<typeof intentSchema>;

const intentParser = StructuredOutputParser.fromZodSchema(intentSchema);

const classifyChain = ChatPromptTemplate.fromMessages([
    [
        "system",
        "You are an expert support triage assistant. Analyze the customer message and extract the exact intent, urgency, sentiment, and human escalation requirement.",
    ],
    ["human", "Message: {message}"],
]).pipe(classifierModel.withStructuredOutput(intentSchema));

class SupportChatHistory extends InMemoryChatMessageHistory {
    private summary: string = "";
    private messageCount: number = 0;
    private readonly SUMMARIZE_AFTER = 8;

    override async addMessage(message: BaseMessage): Promise<void> {
        await super.addMessage(message);
        this.messageCount++;

        if (this.messageCount % this.SUMMARIZE_AFTER === 0) {
            await this.compress();
        }
    }

    private async compress(): Promise<void> {
        const messages = await this.getMessages();
        const recentMessages = messages.slice(-4); // keep last 4
        const oldMessages = messages.slice(0, -4);

        if (oldMessages.length === 0) return;

        const oldText = oldMessages
            .map((m) => `${m._getType()}: ${m.content}`)
            .join("\n");

        const summaryResponse = await chatModel.invoke(
            `Summarize this support conversation into 3-4 key points. 
       Previous summary: ${this.summary || "None"}
       New messages: ${oldText}`
        );

        this.summary = summaryResponse.content as string;

        await this.clear();

        if (this.summary) {
            await super.addMessage(
                new SystemMessage(`[Conversation Summary]: ${this.summary}`)
            );
        }

        for (const msg of recentMessages) {
            await super.addMessage(msg);
        }
    }

    getSummary(): string { return this.summary; }
}

async function createSupportTicket(params: {
    customerId: string;
    issue: string;
    urgency: string;
    conversationSummary: string;
}): Promise<{ ticketId: string; estimatedResponse: string }> {
    // In production: await fetch("https://your-ticketing-api.com/tickets", {...})
    console.log("\n[CREATING SUPPORT TICKET]");
    console.log(`   Customer: ${params.customerId}`);
    console.log(`   Urgency: ${params.urgency}`);
    console.log(`   Issue: ${params.issue}\n`);

    return {
        ticketId: `TICK-${Date.now()}`,
        estimatedResponse: params.urgency === "critical" ? "1 hour" : "24 hours",
    };
}

const sessions: Record<string, SupportChatHistory> = {};
const customerData: Record<string, { name: string; orders: string[] }> = {
    CUST_001: { name: "Priya", orders: ["ORD-789 (Delivered)", "ORD-790 (Processing)"] },
    CUST_002: { name: "Rahul", orders: ["ORD-456 (Shipped)"] },
};

function getSessionHistory(sessionId: string): SupportChatHistory {
    if (!sessions[sessionId]) {
        sessions[sessionId] = new SupportChatHistory();
    }
    return sessions[sessionId];
}

const supportPrompt = ChatPromptTemplate.fromMessages([
    [
        "system",
        `You are a helpful customer support agent for ShopFast, an e-commerce platform.

Customer Info:
- Customer ID: {customerId}
- Name: {customerName}
- Orders: {orders}

Guidelines:
- Be empathetic and professional
- For refunds: tell them processing takes 5-7 business days
- For technical issues: ask them to try clearing cache first
- If customer is very frustrated: offer escalation to a human agent
- Always reference their specific orders when relevant`,
    ],
    new MessagesPlaceholder("history"),
    ["human", "{input}"],
]);

const supportChain = new RunnableWithMessageHistory({
    runnable: supportPrompt.pipe(chatModel).pipe(parser),
    getMessageHistory: getSessionHistory,
    inputMessagesKey: "input",
    historyMessagesKey: "history",
});

async function handleCustomerMessage(
    customerId: string,
    message: string
): Promise<void> {
    const customer = customerData[customerId] || { name: "Valued Customer", orders: [] };

    console.log(`${customer.name}: ${message}`);

    // Step 1: Classify intent in parallel with generating response
    const [intent, response] = await Promise.all([
        classifyChain.invoke({
            message
        }),
        supportChain.invoke(
            {
                input: message,
                customerId,
                customerName: customer.name,
                orders: customer.orders.join(", "),
            },
            { configurable: { sessionId: customerId } }
        ),
    ]);

    console.log(`Agent: ${response}`);
    console.log(
        `   [Intent: ${intent.intent} | Urgency: ${intent.urgency} | Sentiment: ${intent.sentiment}]`
    );

    if (intent.requiresHuman || intent.urgency === "critical") {
        const session = sessions[customerId];
        const summary = session?.getSummary() || message;

        const ticket = await createSupportTicket({
            customerId,
            issue: message,
            urgency: intent.urgency,
            conversationSummary: summary,
        });

        console.log(`Ticket created: ${ticket.ticketId}`);
        console.log(`Expected response: ${ticket.estimatedResponse}`);
    }

    console.log();
}

console.log("ShopFast Customer Support Bot\n");

// Customer CUST_001 - Priya's conversation
await handleCustomerMessage("CUST_001", "Hi, I have an issue with my recent order.");
await handleCustomerMessage("CUST_001", "Order ORD-790 was supposed to arrive yesterday but nothing came.");
await handleCustomerMessage("CUST_001", "This is the third time this has happened! I want a refund NOW!");
await handleCustomerMessage("CUST_001", "I want to speak to a human agent immediately!");

console.log("─".repeat(60));

// Customer CUST_002 - Rahul's conversation (separate session)
await handleCustomerMessage("CUST_002", "Hey, when will my order ORD-456 arrive?");
await handleCustomerMessage("CUST_002", "Great, and can I change the delivery address?");