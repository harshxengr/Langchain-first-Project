import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { AIMessage, HumanMessage } from "langchain";

const useGroq = true;

const model = useGroq
    ? new ChatGroq({
        model: "llama-3.3-70b-versatile",
        streaming: true
    })
    : new ChatGoogleGenerativeAI({
        model: "gemini-2.0-flash",
        streaming: true
    });

const template = ChatPromptTemplate.fromMessages([
    ["system", "You are a friendly English Assistant. Give me Short and Helpful answer."],
    new MessagesPlaceholder("history"),
    ["human", "{input}"]
])

const parser = new StringOutputParser();

const chain = RunnableSequence.from([
    template,
    model,
    parser
])

const history: (HumanMessage | AIMessage)[] = [];

const reader = Bun.stdin.stream().getReader();
const decoder = new TextDecoder();

console.log(`Chatbot Ready! (${useGroq ? "Groq/Llama" : "Google/Gemini"})`);
console.log("Start Typing, Exit using Ctrl+C");

while (true) {
    process.stdout.write("You: ");

    const { value, done } = await reader.read();
    if (done) break;

    const userInput = decoder.decode(value).trim();
    if (!userInput) continue;

    process.stdout.write("AI: ");
    let fullResponse = "";

    const stream = await chain.stream({
        history: history,
        input: userInput,
    });

    for await (const chunk of stream) {
        process.stdout.write(chunk);
        fullResponse += chunk;
    }

    console.log("\n");

    history.push(new HumanMessage(userInput));
    history.push(new AIMessage(fullResponse));

    if (history.length > 10) {
        history.splice(0, 2);
    }
}

