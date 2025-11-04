import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

interface Page {
  path: string;
  title: string;
  description?: string;
  content: string;
  data: Record<string, any>;
}

export function getAllPages(): Page[] {
  const pagesDir = path.join(process.cwd(), "pages");
  const files = getAllMdxFiles(pagesDir);

  return files
    .map((filePath) => {
      const relativePath = path.relative(pagesDir, filePath);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(fileContent);

      return {
        path: relativePath,
        title: data.title || "",
        description: data.description,
        content,
        data,
      };
    })
    .filter((page) => {
      // API routes, _app, _document 등 제외
      if (page.path.startsWith("api/")) return false;
      if (page.path.startsWith("_")) return false;

      return true;
    })
    .sort((a, b) => a.path.localeCompare(b.path));
}

function getAllMdxFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllMdxFiles(filePath, fileList);
    } else if (file.endsWith(".mdx") || file.endsWith(".md")) {
      fileList.push(filePath);
    }
  });

  return fileList;
}
