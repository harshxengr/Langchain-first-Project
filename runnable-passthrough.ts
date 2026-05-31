import {
    RunnablePassthrough,
    RunnableParallel,
    RunnableSequence,
} from "@langchain/core/runnables";
import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const model = new ChatGroq({ model: "llama-3.3-70b-versatile", temperature: 0 });
const parser = new StringOutputParser();

const chain = RunnableParallel.from({
    original_question: new RunnablePassthrough(),
    answer: RunnableSequence.from([
        ChatPromptTemplate.fromMessages([
            ["human", "Answer briefly: {input}"]
        ]),
        model,
        parser
    ])
})

const result = await chain.invoke({
    input: "What is closure in JavaScript?"
})

console.log("Original question kept:", result.original_question);
console.log("AI answer:", result.answer);

// RAG chain structure (preview)
const ragLikeChain = RunnableSequence.from([
    RunnableParallel.from({
        context: (input: { question: string }) => `Context: JavaScript closures are functions that remember their outer scope.`,
        question: new RunnablePassthrough<{ question: string }>(),
    }),

    ChatPromptTemplate.fromMessages([
        ["system", "Answer using only this context: {context}"],
        ["human", "{question}"],
    ]),
    model,
    parser,
]);

const ragResult = await ragLikeChain.invoke({
    question: "What is a closure?",
});
console.log("\nRAG-like result:", ragResult);