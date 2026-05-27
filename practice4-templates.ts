import { ChatGroq } from "@langchain/groq";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// Template 1
const groq = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0.7
});

const parser = new StringOutputParser();

const codeExplainerTemplate = ChatPromptTemplate.fromMessages([
    [
        "system",
        `You explain code for a {level} student.
     Language: {language}
     Style: Simple, clear, and accompanied by practical examples.`,
    ],
    ["human", "What does this code do?\n\n{code}"],
]);

const explainerChain = RunnableSequence.from([
    codeExplainerTemplate,
    groq,
    parser
]);

const result1 = await explainerChain.invoke({
    level: "beginner",
    language: "TypeScript",
    code: `
    const nums = [1, 2, 3, 4, 5];
    const doubled = nums.map(n => n * 2).filter(n => n > 4);
    console.log(doubled);
  `,
});

console.log("Code Explainer");
console.log(result1);

// Template 2
const gemini = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0.8
})

const quizTemplate = ChatPromptTemplate.fromMessages([
    ["system", "You are a quiz master. Create exactly {count} multiple-choice questions."],
    ["human", "Topic: {topic}\nDifficulty: {difficulty}"],
])

const quizChain = RunnableSequence.from([
    quizTemplate,
    gemini,
    parser
])

const result2 = await quizChain.invoke({
    topic: "JavaScript Promises",
    difficulty: "intermediate",
    count: "3"
});

console.log("Quiz Generator");
console.log(result2);

// Template 3
const sentimentTemplate = ChatPromptTemplate.fromMessages([
    ["system", "You are a sentiment analyzer. Provide exactly one word: positive/negative/neutral"],
    ["human", "This phone is very slow."],
    ["ai", "negative"],
    ["human", "The delivery time was perfect!"],
    ["ai", "positive"],
    ["human", "The package arrived, it is okay."],
    ["ai", "neutral"],
    ["human", "{review}"],
]);

const sentimentChain = RunnableSequence.from([
    sentimentTemplate,
    groq,
    parser
])

const reviews = [
    "Absolutely terrible product, a complete waste of money.",
    "Fantastic quality, I definitely recommend it!",
    "Received it, nothing special.",
]

console.log("Sentiment Analyzer");

for (const review of reviews) {
    const sentiment = await sentimentChain.invoke({ review });
    console.log(`"${review}" -> ${sentiment.trim()}`);
}
