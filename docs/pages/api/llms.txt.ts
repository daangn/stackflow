import type { NextApiRequest, NextApiResponse } from "next";
import { baseUrl } from "../../utils/constants";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Content-Type", "text/plain");
  res.status(200).send(`
# Stackflow Documentation for LLMs

## Documentation Sets

- [llms-full.txt](${new URL("/api/llms-full.txt", baseUrl)}): Complete documentation of Stackflow
- [llms-changelog.txt](${new URL("/api/llms-changelog.txt", baseUrl)}): Latest updates and version history
`);
}
