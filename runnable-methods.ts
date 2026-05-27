import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

const model = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0
})

const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a helpful assistant. Answer in 1-2 sentences."],
    ["human", "{question}"],
])

const parser = new StringOutputParser();

const chain = RunnableSequence.from([
    prompt,
    model,
    parser
])

// method 1: invoke()
const result = await chain.invoke({
    question: "What is TypeScript?"
})

console.log("invoke():", result);

// method 2: stream()
console.log("\nstream(): ");
const stream = await chain.stream({
    question: "What is TypeScript?"
})

for await (const chunk of stream) {
    process.stdout.write(chunk);
}
console.log();


// method 3: batch()
const batchResults = await chain.batch([
    { question: "What is TypeScript?" },
    { question: "What is React?" },
    { question: "What is node.js?" }
])

console.log("\nbatch(): ");
batchResults.forEach((r, i) => console.log(`[${i + 1}] ${r}`));

// method 4: batch() concurrency control
const controlledBatch = await chain.batch(
    [
        { question: "What is Bun?" },
        { question: "What is Deno?" },
        { question: "What is Python?" }
    ],
    { maxConcurrency: 2 }
)

console.log("\nbatch() with concurrency: ", controlledBatch);
