import { Document } from "@langchain/core/documents";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

// Text Loader
const content = `ShopFast Return Policy
Returns are accepted within 30 days of purchase.
Items must be unused and in original packaging.
Refunds are processed within 5-7 business days.
Electronics have a 15-day return window.`;

await Bun.write("./sample.txt", content);

const file = Bun.file("./sample.txt");
const text = await file.text();

const textDocs = [
  new Document({
    pageContent: text,
    metadata: { source: "./sample.txt" },
  }),
];

console.log("Bun-Compatible Text Loader");
console.log("Number of docs:", textDocs.length);
console.log("Content preview:", textDocs[0]?.pageContent.substring(0, 100));
console.log("Metadata:", textDocs[0]?.metadata);

// Json Loader
const productsData = [
  { id: 1, name: "Laptop Pro X", price: 999, category: "Electronics", warranty: "2 years" },
  { id: 2, name: "Wireless Mouse", price: 29, category: "Accessories", warranty: "1 year" },
  { id: 3, name: "Mechanical Keyboard", price: 149, category: "Accessories", warranty: "1 year" },
];

await Bun.write("./products.json", JSON.stringify(productsData, null, 2));

const jsonFile = Bun.file("./products.json");
const parsedData = await jsonFile.json();

const jsonDocs = parsedData.map((item: any) => {
  return new Document({
    pageContent: `name: ${item.name}, price: ${item.price}, category: ${item.category}, warranty: ${item.warranty}`,
    metadata: {
      source: "./products.json",
      id: item.id
    },
  });
});

console.log("\nJSON Loader (Bun-Optimized)");
console.log("Docs loaded:", jsonDocs.length);

jsonDocs.forEach((doc: any, i: any) => {
  console.log(`  Doc ${i + 1}:`, doc?.pageContent.substring(0, 80));
});

// CSV Loader
await Bun.write(
  "./orders.csv",
  `order_id,customer,product,status,date
ORD-001,Priya,Laptop Pro X,Delivered,2024-01-15
ORD-002,Rahul,Wireless Mouse,Shipped,2024-01-20
ORD-003,Arjun,Keyboard,Processing,2024-01-22`
);

const csvFile = Bun.file("./orders.csv");
const csvText = await csvFile.text();

const lines = csvText.trim().split("\n");
const firstLine = lines[0] ?? "";
const headers = firstLine.split(",");

const csvDocs = lines.slice(1).map((line, index) => {
  const values = line.split(",");

  const pageContent = headers
    .map((header, i) => `${header.trim()}: ${values[i]?.trim()}`)
    .join("\n");

  return new Document({
    pageContent,
    metadata: {
      source: "./orders.csv",
      line: index + 1,
    },
  });
});

console.log("\nCSV Loader (Bun-Optimized)");
console.log("Rows loaded:", csvDocs.length);
console.log("Sample:\n" + csvDocs[0]?.pageContent);

// DIRECTORY LOADER — load all files at once

await Bun.write("./docs/policy.txt", "Our privacy policy: we never sell your data.");
await Bun.write("./docs/shipping.txt", "Free shipping on orders above Rs. 500.");
await Bun.write("./docs/warranty.txt", "All electronics come with 1 year manufacturer warranty.");

const dirPath = "./docs";
const files = await readdir(dirPath);
const allDocs: Document[] = [];

for (const fileName of files) {
  if (fileName.endsWith(".txt")) {
    const filePath = join(dirPath, fileName);
    const file = Bun.file(filePath);
    const content = await file.text();

    allDocs.push(
      new Document({
        pageContent: content,
        metadata: { source: filePath },
      })
    );
  }
}

console.log("\nDirectory Loader (Bun-Optimized)");
console.log("Total docs from directory:", allDocs.length);
allDocs.forEach((doc: any) => {
  console.log(`  File: ${doc?.metadata?.source}`);
  console.log(`  Content: ${doc?.pageContent?.substring(0, 60)}...`);
});

async function loadWithBun(filePath: string): Promise<Document[]> {
  const file = Bun.file(filePath);
  const content = await file.text();

  return [
    new Document({
      pageContent: content,
      metadata: {
        source: filePath,
        fileName: filePath.split("/").pop(),
        loadedAt: new Date().toISOString(),
        fileSize: file.size,
        mimeType: file.type,
      },
    }),
  ];
}

await Bun.write("./sample.txt", "ShopFast Return Policy...");

const bunDocs = await loadWithBun("./sample.txt");
console.log("\nBun Custom Loader");
console.log("Metadata:", bunDocs[0]?.metadata);