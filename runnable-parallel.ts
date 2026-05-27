import { RunnableParallel, RunnableSequence } from "@langchain/core/runnables";
import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";

const groq = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0.7
});

const gemini = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash",
  temperature: 0.7
});

const parser = new StringOutputParser();

const templateForGroq1 = ChatPromptTemplate.fromMessages([
  ["human", "Give a 2-sentence summary of: {topic}"],
]);

const summaryChain = RunnableSequence.from([
  templateForGroq1,
  groq,
  parser
])

const templateForGemini = ChatPromptTemplate.fromMessages([
  ["human", "Create 2 quiz questions about: {topic}"],
])

const quizChain = RunnableSequence.from([
  templateForGemini,
  gemini,
  parser
])

const templateForGroq2 = ChatPromptTemplate.fromMessages([
  ["human", "Show a 5-line code example of: {topic} in TypeScript"],
])

const codeExampleChain = RunnableSequence.from([
  templateForGroq2,
  groq,
  parser
])

const parallelChain = RunnableParallel.from({
  summary: summaryChain,
  quiz: quizChain,
  codeExample: codeExampleChain
})

console.log("Running 3 chains in parallel...");
const startTime = Date.now();

const results = await parallelChain.invoke({ topic: "JavaScript Engine" });

console.log(`Completed in ${Date.now() - startTime}ms\n`);

console.log("SUMMARY");
console.log(results.summary);

console.log("\nQUIZ");
console.log(results.quiz);

console.log("\nCODE EXAMPLE");
console.log(results.codeExample);