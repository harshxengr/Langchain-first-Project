import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const groqModel = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0
});

const geminiModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    temperature: 0
});

const question = "Tell me 3 differences in JavaScript and TypeScript?";

console.log("Groq");
const groqRes = await groqModel.invoke(question);
console.log(groqRes.content);


console.log("Google Gemini");
const geminiRes = await geminiModel.invoke(question);
console.log(geminiRes.content);

