import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { TokenTextSplitter } from "@langchain/textsplitters";
import { MarkdownTextSplitter } from "@langchain/textsplitters";

// 1. RecursiveCharacterTextSplitter — Use this always
const recursiveSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 200,
    chunkOverlap: 40
})

const longText = `
Chapter 1: Introduction to TypeScript

TypeScript is a strongly typed programming language that builds on JavaScript.
It adds optional static typing and class-based object-oriented programming.
TypeScript was developed by Microsoft in 2012.

Chapter 2: Core Features

The main features of TypeScript include:
Type annotations allow you to specify the type of variables.
Interfaces define the structure of objects.
Generics enable writing reusable, type-safe code.
Enums provide a way to define named constants.

Chapter 3: Advanced Types

Advanced TypeScript features include union types, intersection types,
conditional types, mapped types, and template literal types.
These features make TypeScript extremely powerful for large codebases.
`;

const chunks = await recursiveSplitter.createDocuments([longText]);

console.log("RecursiveCharacterTextSplitter");
console.log(`Original: ${longText.length} chars`);
console.log(`Chunks: ${chunks.length}`);
chunks.forEach((chunk, i) => {
    console.log(`\nChunk ${i + 1} (${chunk.pageContent.length} chars):`);
    console.log(chunk.pageContent.trim());
});

// 2. Markdown Splitter - for docs/readmes
const markdownSplitter = new MarkdownTextSplitter({
    chunkSize: 300,
    chunkOverlap: 50,
});

const markdownContent = `
# Getting Started

Install the package using npm or bun.

## Installation

\`\`\`bash
bun add langchain
\`\`\`

## Basic Usage

Create a new chain using the pipe operator.

### Example

Here is a simple example of creating a chain.

## Configuration

You can configure the model with various options like temperature and maxTokens.

# Advanced Topics

Learn about agents, tools, and memory for complex applications.
`;

const mdChunks = await markdownSplitter.createDocuments([markdownContent]);
console.log("\nMarkdown Splitter");
console.log(`Chunks: ${mdChunks.length}`);
mdChunks.forEach((chunk, i) => {
    console.log(`\nChunk ${i + 1}:`);
    console.log(chunk.pageContent.trim().substring(0, 100) + "...");
});

// 3. REAL WORLD - split a large document with metadata
const splitterWithMeta = new RecursiveCharacterTextSplitter({
    chunkSize: 500,
    chunkOverlap: 100,
});

const legalDocument = `
TERMS AND CONDITIONS — ShopFast E-Commerce Platform
Last Updated: January 2024

SECTION 1: ACCEPTANCE OF TERMS
By accessing and using ShopFast, you accept and agree to be bound by these terms.
If you do not agree to these terms, please do not use our platform.

SECTION 2: PRIVACY POLICY
We collect your name, email, and shipping address to process orders.
We never sell your personal data to third parties.
Data is encrypted using industry-standard AES-256 encryption.

SECTION 3: RETURNS AND REFUNDS
Items can be returned within 30 days of purchase.
Electronics have a 15-day return window due to rapid depreciation.
Refunds are processed within 5-7 business days to original payment method.

SECTION 4: SHIPPING POLICY
Standard shipping takes 3-5 business days.
Express shipping takes 1-2 business days.
Free shipping on orders above Rs. 999.
`;

const legalChunks = await splitterWithMeta.createDocuments(
    [legalDocument],
    [{ source: "terms_and_conditions.txt", category: "legal", year: 2024 }]
);

console.log("\nLegal Document Split");
console.log(`Total chunks: ${legalChunks.length}`);
legalChunks.forEach((chunk, i) => {
    console.log(`\nChunk ${i + 1}:`);
    console.log(`  Content: ${chunk.pageContent.substring(0, 80)}...`);
    console.log(`  Metadata:`, chunk.metadata);
});