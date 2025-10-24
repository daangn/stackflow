import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import type { NextApiRequest, NextApiResponse } from "next";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkStringify from "remark-stringify";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    // changelog.mdx 파일 읽기
    const changelogPath = path.join(
      process.cwd(),
      "pages/docs/changelog.en.mdx",
    );
    const fileContent = fs.readFileSync(changelogPath, "utf-8");

    // frontmatter 파싱
    const { data, content } = matter(fileContent);

    // MDX를 plain text로 변환 (process-content와 유사한 처리)
    const processed = await processContent(content);

    const response = `# Stackflow - Changelog

${processed}`;

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(response);
  } catch (error) {
    console.error("Changelog generation error:", error);
    res.status(500).send("Error generating changelog");
  }
}

// MDX 콘텐츠를 plain text로 변환
async function processContent(content: string): Promise<string> {
  const file = await remark()
    .use(remarkGfm)
    .use(remarkStringify)
    .process(content);

  return String(file);
}
