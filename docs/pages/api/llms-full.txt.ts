import type { NextApiRequest, NextApiResponse } from "next";
import { getAllPages } from "../../utils/get-all-pages";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const pages = await getAllPages();
  const content = pages
    .map((page) => `# ${page.title}\n\n${page.content}`)
    .join("\n\n");

  res.setHeader("Content-Type", "text/plain");
  res.status(200).send(content);
}
