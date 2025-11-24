import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkStringify from "remark-stringify";
import { baseUrl } from "../utils/constants";
import { getAllPages } from "../utils/get-all-pages";

async function generateLlmsFull() {
  const pages = getAllPages();
  const content = pages
    .map((page) => `# ${page.title}\n\n${page.content}`)
    .join("\n\n");

  const outputPath = path.join(process.cwd(), "public/llms-full.txt");
  fs.writeFileSync(outputPath, content);
  console.log(`Generated ${outputPath}`);
}

async function generateLlmsChangelog() {
  const changelogPath = path.join(process.cwd(), "pages/docs/changelog.en.mdx");
  const fileContent = fs.readFileSync(changelogPath, "utf-8");
  const { content } = matter(fileContent);

  const processed = await remark()
    .use(remarkGfm)
    .use(remarkStringify)
    .process(content);

  const response = `# Stackflow - Changelog\n\n${String(processed)}`;

  const outputPath = path.join(process.cwd(), "public/llms-changelog.txt");
  fs.writeFileSync(outputPath, response);
  console.log(`Generated ${outputPath}`);
}

async function generateLlmsIndex() {
  const content = `
# Stackflow Documentation for LLMs

## Documentation Sets

- [llms-full.txt](${new URL("/llms-full.txt", baseUrl)}): Complete documentation of Stackflow
- [llms-changelog.txt](${new URL("/llms-changelog.txt", baseUrl)}): Latest updates and version history
`.trim();

  const outputPath = path.join(process.cwd(), "public/llms.txt");
  fs.writeFileSync(outputPath, content);
  console.log(`Generated ${outputPath}`);
}

async function main() {
  try {
    // Ensure public directory exists
    const publicDir = path.join(process.cwd(), "public");
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir);
    }

    await generateLlmsFull();
    await generateLlmsChangelog();
    await generateLlmsIndex();
  } catch (error) {
    console.error("Error generating LLMS txt files:", error);
    process.exit(1);
  }
}

main();
