import { ChatGroq } from "@langchain/groq";
import { SystemMessage, HumanMessage, AIMessage } from "langchain";

const model = new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0.7
});

console.log("Exp 1: To change the personality using SystemMessage");

const pirateRes = await model.invoke([
    new SystemMessage("you are a pirate. Make sure to say 'Arrr!' in every answer!"),
    new HumanMessage("How is the weather today?"),
]);

console.log(pirateRes.content);

console.log("Exp 2: Multi-turn conversation");

const multiTurn = await model.invoke([
    new SystemMessage("you are a helpful coding assistant."),
    new HumanMessage("My name is Harsh and I am learning Langchain"),
    new AIMessage("Namaste Harsh! Learning Langchain is a great decision"),
    new HumanMessage("Do you remember my name? and what i am learning?"),
]);

console.log(multiTurn.content);

console.log("Exp 3: To see Temperature Effect");

const model_deterministic = new ChatGroq({
    model: "llama-3.1-8b-instant",
    temperature: 0
});

const model_creative = new ChatGroq({
    model: "llama-3.1-8b-instant",
    temperature: 0.9
});

const creativeQ = "Give me 1 startup idea in 1 line";

const d1 = await model_deterministic.invoke(creativeQ);
const d2 = await model_deterministic.invoke(creativeQ);
console.log("Temperature 0 - Run 1:", d1.content);
console.log("Temperature 0 - Run 2:", d2.content);

const c1 = await model_creative.invoke(creativeQ);
const c2 = await model_creative.invoke(creativeQ);
console.log("\nTemperature 0.9 - Run 1:", c1.content);
console.log("Temperature 0.9 - Run 2:", c2.content);