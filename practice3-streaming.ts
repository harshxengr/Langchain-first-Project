import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

async function streamRes(modelName: string, model: any, prompt: string) {
    console.log(`${modelName} Streaming ===`);
    console.log("AI: ");

    const stream = await model.stream(prompt);

    let totalChunks = 0;
    for await (const chunk of stream) {
        process.stdout.write(chunk.content as string);
        totalChunks++;
    }

    console.log(`Total chunks received: ${totalChunks}`);
}

const groq = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    streaming: true,
});

const gemini = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    streaming: true,
});

const prompt = "What is Recursion, Explain it with a simple real-life example."

await streamRes("GROQ (Llama)", groq, prompt);
await streamRes("GEMINI", gemini, prompt);