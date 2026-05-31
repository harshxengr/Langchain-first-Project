import { RunnableLambda, RunnableSequence } from "@langchain/core/runnables";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const model = new ChatGroq({ model: "llama-3.3-70b-versatile", temperature: 0 });
const parser = new StringOutputParser();

// Custom preprocessing function
const cleanInput = RunnableLambda.from((input: { rawText: string }) => {
    return {
        cleanedText: input.rawText
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, "")
    }
})

// Custom postprocessing function
const formatOutput = RunnableLambda.from((text: string) => {
    return {
        response: text,
        wordCount: text.split(" ").length,
        timestamp: new Date().toISOString(),
        model: "llama-3.3-70b",
    };
});

// Chain: clean → prompt → model → parse → format
const chain = RunnableSequence.from([
    cleanInput,
    RunnableLambda.from((input: { cleanedText: string }) => ({
        text: input.cleanedText,
    })),
    ChatPromptTemplate.fromMessages([
        ["human", "Summarize this in one sentence: {text}"],
    ]),
    model,
    parser,
    formatOutput,
]);

const result = await chain.invoke({
    rawText: "  TypeScript IS a STRONGLY-typed superset OF JavaScript!!!  ",
});

console.log("Response:", result.response);
console.log("Word count:", result.wordCount);
console.log("Timestamp:", result.timestamp);