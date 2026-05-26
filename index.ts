import { ChatGoogle } from "@langchain/google";

const model = new ChatGoogle("gemini-2.5-flash");

const response = await model.invoke("Tell me in one line, what is langchain?");
console.log(response.content);