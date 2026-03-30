#!/usr/bin/env node

/**
 * Docs에 자동으로 추가되는 Changelog를 생성하는 스크립트입니다.
 * changelog의 package graph를 참고하여 관련된 패키지들을 추출하여 버전 업데이트 내용을 자동으로 생성합니다.
 * llms.txt와 같은 파일에 추후에 도움을 받기 위해 변경 이력들을 한 파일에 쌓습니다.
 *
 * 사용법:
 * 1. docs 폴더에서 `yarn generate:changelog` 명령어를 실행합니다.
 * 2. 생성된 Changelog 파일은 `docs/components/ChangelogContent.mdx`에 추가됩니다.
 *    (changelog.en.mdx와 changelog.ko.mdx에서 공용으로 import하여 사용)
 */

import { exec } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import assembleReleasePlan from "@changesets/assemble-release-plan";
import { read } from "@changesets/config";
import { readPreState } from "@changesets/pre";
import readChangesets from "@changesets/read";
import type { ReleasePlan } from "@changesets/types";
import { getPackages } from "@manypkg/get-packages";

const execAsync = promisify(exec);

// 프로젝트 루트 경로 (docs 폴더의 상위 디렉토리)
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "../..");

interface ChangelogEntry {
  date: string;
  changesets: Array<{
    content: string;
    packages: Array<{
      name: string;
      version: string;
    }>;
    commitLink?: string;
  }>;
  manualContent?: string;
}

/**
 * 한국식 날짜 형식으로 변환 (YYYY.MM.DD)
 */
function formatKoreanDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

/**
 * 특정 날짜의 기존 릴리스 개수 계산
 */
function countExistingReleasesForDate(
  existingContent: string,
  date: string,
): number {
  const dateRegex = new RegExp(`## ${date}(?: #\\d+)?`, "g");
  const matches = existingContent.match(dateRegex) || [];
  return matches.length;
}

/**
 * 기존 changelog에서 수동 작성된 내용 추출
 */
async function extractManualContent(
  changelogPath: string,
): Promise<Record<string, string>> {
  try {
    const existingContent = await readFile(changelogPath, "utf-8");
    const manualContents: Record<string, string> = {};

    // 날짜별 섹션에서 수동 작성 내용 추출 (번호가 있는 경우도 포함)
    const dateRegex = /## (\d{4}\.\d{2}\.\d{2}(?: #\d+)?)/g;
    const sections = existingContent.split(dateRegex);

    for (let i = 1; i < sections.length; i += 2) {
      const date = sections[i];
      const content = sections[i + 1];

      // 수동 작성 영역 추출
      const manualMatch = content.match(
        /<!-- MANUAL_CONTENT_START -->\s*([\s\S]*?)\s*<!-- MANUAL_CONTENT_END -->/,
      );
      if (manualMatch) {
        manualContents[date] = manualMatch[1].trim();
      }
    }

    return manualContents;
  } catch {
    return {};
  }
}

/**
 * GitHub commit 링크 생성
 */
function createCommitLink(commitHash: string): string {
  const repo = "daangn/stackflow";
  const shortHash = commitHash.slice(0, 7);
  return `[\`${shortHash}\`](https://github.com/${repo}/commit/${commitHash})`;
}

/**
 * Git 명령어 실행
 */
async function execCommand(command: string): Promise<string> {
  try {
    const { stdout } = await execAsync(command, { cwd: rootDir });
    return stdout.trim();
  } catch (error) {
    console.log(`⚠️  Git command failed: ${command}`, error);
    return "";
  }
}

/**
 * changeset ID 목록에서 각 changeset의 commit hash 가져오기
 * releasePlan.changesets에서 ID를 받아 .changeset/<id>.md 경로로 커밋을 찾음
 */
async function getChangesetCommits(
  changesetIds: string[],
): Promise<Record<string, string>> {
  if (changesetIds.length === 0) {
    console.log("📝 No changeset IDs provided");
    return {};
  }

  console.log(`📊 Processing ${changesetIds.length} changesets`);

  const commitMap: Record<string, string> = {};

  for (const changesetId of changesetIds) {
    const filePath = `.changeset/${changesetId}.md`;

    try {
      // git log로 해당 파일을 추가한 커밋들 가져오기 (--format으로 해시와 메시지 분리)
      const logOutput = await execCommand(
        `git log --first-parent main --format="%H %s" -- "${filePath}"`,
      );

      if (!logOutput) {
        continue;
      }

      // 각 줄을 파싱하여 "Version Packages"가 아닌 첫 번째 커밋 찾기
      const lines = logOutput.split("\n").filter((line) => line.trim());
      for (const line of lines) {
        const spaceIndex = line.indexOf(" ");
        if (spaceIndex === -1) continue;

        const commitHash = line.substring(0, spaceIndex);
        const message = line.substring(spaceIndex + 1);

        if (!message.includes("Version Packages")) {
          commitMap[changesetId] = commitHash;
          console.log(`  📄 ${changesetId} → ${commitHash.slice(0, 7)}`);
          break;
        }
      }
    } catch {
      // 개별 changeset 실패는 무시하고 계속 진행
    }
  }

  if (Object.keys(commitMap).length === 0) {
    console.log("⚠️  No commits found for changeset files");
    return {};
  }

  console.log(`✅ Found ${Object.keys(commitMap).length} changeset commits`);
  return commitMap;
}

/**
 * ReleasePlan을 ChangelogEntry로 변환
 */
async function organizeChangelogEntries(
  releasePlan: ReleasePlan,
  manualContents: Record<string, string>,
  existingContent: string,
  packages: Awaited<ReturnType<typeof getPackages>>,
): Promise<ChangelogEntry[]> {
  // 실제로 버전이 변경되는 releases만 필터링 (type !== "none" && public package)
  const actualReleases = releasePlan.releases.filter(
    (release) =>
      release.type !== "none" &&
      packages.packages.some(
        (pkg) =>
          pkg.packageJson.name === release.name && !pkg.packageJson.private,
      ),
  );

  console.log(
    `🔍 Debug: Found ${actualReleases.length} actual releases (type !== "none"):`,
  );
  actualReleases.forEach((release) => {
    console.log(
      `  - ${release.name}: ${release.oldVersion} → ${release.newVersion} (${release.type}), changesets: [${release.changesets.join(", ")}]`,
    );
  });

  console.log(`🔍 Debug: Found ${releasePlan.changesets.length} changesets:`);
  releasePlan.changesets.forEach((changeset, index) => {
    console.log(`  ${index + 1}. ${changeset.id}: "${changeset.summary}"`);
  });

  if (actualReleases.length === 0) {
    return [];
  }

  // 단순화된 접근: 모든 실제 릴리스를 하나의 엔트리로 그룹핑
  const createdAt = new Date();
  const baseDateKey = formatKoreanDate(createdAt);

  // 같은 날짜의 기존 릴리스 개수 확인
  const existingReleaseCount = countExistingReleasesForDate(
    existingContent,
    baseDateKey,
  );

  // 릴리스 개수가 1개 이상이면 번호를 추가
  const dateKey =
    existingReleaseCount > 0
      ? `${baseDateKey} #${existingReleaseCount + 1}`
      : baseDateKey;

  const entries: ChangelogEntry[] = [];

  if (releasePlan.changesets.length > 0) {
    // changeset 파일들의 commit hash 가져오기 (ID별로 매핑)
    const changesetIds = releasePlan.changesets.map((c) => c.id);
    const commitMap = await getChangesetCommits(changesetIds);

    // 모든 changeset을 개별적으로 처리하며 각각의 커밋 링크 포함
    const changesetEntries = releasePlan.changesets.map((changeset) => {
      const commitHash = commitMap[changeset.id];
      const commitLink = commitHash ? createCommitLink(commitHash) : undefined;

      return {
        content: changeset.summary,
        packages: actualReleases
          .filter((release) => release.changesets.includes(changeset.id))
          .map((release) => ({
            name: release.name,
            version: release.newVersion,
          })),
        commitLink,
      };
    });

    entries.push({
      date: dateKey,
      changesets: changesetEntries,
      manualContent: manualContents[dateKey],
    });

    console.log(
      `🔍 Debug: Created entry with ${actualReleases.length} packages and ${releasePlan.changesets.length} changesets`,
    );
  }

  return entries;
}

/**
 * JSX처럼 보이는 텍스트를 백틱 코드로 감싸서 MDX 파싱 오류 방지
 * 예: <Modal /> → `<Modal />`
 */
function escapeJsxLikeTags(text: string): string {
  // 이미 백틱으로 감싸진 경우는 제외하고, <ComponentName /> 또는 <ComponentName> 패턴을 찾아서 변환
  return text.replace(
    /(?<!`)(<[A-Z][a-zA-Z]*(?:\s+[^>]*)?\s*\/?>)(?!`)/g,
    "`$1`",
  );
}

/**
 * changelog 마크다운 생성 (frontmatter 없이 컨텐츠만)
 */
function generateChangelogMarkdown(
  entries: ChangelogEntry[],
  existingContent = "",
): string {
  // 기존 changelog 내용 추출 (새로운 날짜가 아닌 것들)
  const existingEntries = extractExistingEntries(existingContent, entries);

  let markdown = "";

  // 모든 엔트리 병합 및 정렬 (최신순)
  const allEntries = [...entries, ...existingEntries];
  const sortedEntries = allEntries.sort((a, b) => b.date.localeCompare(a.date));

  for (const entry of sortedEntries) {
    markdown += `## ${entry.date}\n\n`;

    // 수동 작성 내용이 있으면 렌더링
    if (entry.manualContent) {
      markdown += `<!-- MANUAL_CONTENT_START -->\n${entry.manualContent}\n<!-- MANUAL_CONTENT_END -->\n\n`;
    }

    // changeset별 변경사항 (각 changeset의 개별 commit 링크와 함께)
    for (const changeset of entry.changesets) {
      const lines = changeset.content.split("\n");
      const [firstLine, ...restLines] = lines;

      // 커밋 해시를 첫 줄 끝에 추가 (이미 포함되어 있지 않은 경우에만)
      let changesetContent = firstLine;
      const hasCommitLink = /\[`[a-f0-9]{7}`\]\(https:\/\/.+?\)/.test(
        firstLine,
      );
      if (changeset.commitLink && !hasCommitLink) {
        changesetContent += ` ${changeset.commitLink}`;
      }

      // 나머지 줄 추가
      if (restLines.length > 0) {
        changesetContent += `\n${restLines.join("\n")}`;
      }

      markdown += `${escapeJsxLikeTags(changesetContent)}\n`;

      // "영향받는 패키지"를 bullet point로 추가
      if (changeset.packages.length > 0) {
        markdown += "\nReleased packages:\n";
        for (const pkg of changeset.packages.sort((a, b) =>
          a.name.localeCompare(b.name),
        )) {
          markdown += `- 📦 [${pkg.name}@${pkg.version}](https://npmjs.com/package/${pkg.name}/v/${pkg.version})\n`;
        }
      }

      markdown += "\n---\n\n";
    }
  }

  return markdown;
}

/**
 * 기존 changelog에서 새로운 changeset에 포함되지 않은 항목들 추출
 */
function extractExistingEntries(
  existingContent: string,
  newEntries: ChangelogEntry[],
): ChangelogEntry[] {
  const existingEntries: ChangelogEntry[] = [];
  const newDates = new Set(newEntries.map((entry) => entry.date));

  // 날짜별 섹션 파싱 (번호가 있는 경우도 포함)
  const dateRegex = /## (\d{4}\.\d{2}\.\d{2}(?: #\d+)?)/g;
  const sections = existingContent.split(dateRegex);

  for (let i = 1; i < sections.length; i += 2) {
    const date = sections[i];
    const content = sections[i + 1];

    // 새로운 changeset에 포함되지 않은 날짜만 보존
    if (!newDates.has(date)) {
      // --- 로 구분된 changeset들 추출
      const changesetBlocks = content
        .split(/\n---\n\n/)
        .filter((block) => block.trim());

      const changesets = changesetBlocks.map((block) => {
        // 영향받는 패키지 섹션 추출
        const packageSectionMatch = block.match(
          /Released packages:\n((?:- 📦 .*\n?)*)/,
        );
        const packages: Array<{ name: string; version: string }> = [];

        if (packageSectionMatch) {
          const packageLines = packageSectionMatch[1]
            .split("\n")
            .filter((line) => line.trim());
          packageLines.forEach((line) => {
            const linkMatch = line.match(/- 📦 \[(.+?)@(.+?)\]\(.+?\)/);
            if (linkMatch) {
              packages.push({ name: linkMatch[1], version: linkMatch[2] });
            }
          });
        }

        // 패키지 섹션을 제거한 나머지 컨텐츠
        const changesetContent = packageSectionMatch
          ? block.substring(0, block.indexOf("Released packages:")).trim()
          : block.trim();

        // 커밋 링크 추출 (있는 경우)
        const commitLinkMatch = changesetContent.match(
          /\[`([a-f0-9]{7})`\]\((https:\/\/.+?)\)/,
        );
        const commitLink = commitLinkMatch ? commitLinkMatch[0] : undefined;

        return {
          content: changesetContent,
          packages,
          commitLink,
        };
      });

      existingEntries.push({
        date,
        changesets,
      });
    }
  }

  return existingEntries;
}

/**
 * 메인 실행 함수
 */
async function main() {
  try {
    console.log("🔧 Reading changeset config...");
    const config = await read(rootDir);

    console.log("🔍 Reading changesets...");
    const changesets = await readChangesets(rootDir);

    if (changesets.length === 0) {
      console.error("📝 No changeset files found.");

      return;
    }

    console.log(`📊 Found ${changesets.length} changeset files`);

    console.log("📦 Getting packages...");
    const packages = await getPackages(rootDir);

    console.log("📋 Assembling release plan...");
    const preState = await readPreState(rootDir);
    const releasePlan = assembleReleasePlan(
      changesets,
      packages,
      config,
      preState,
    );

    console.log(
      `🎯 Release plan: ${releasePlan.releases.length} packages to update`,
    );

    releasePlan.releases.forEach((release) => {
      console.log(
        `  - ${release.name}: ${release.oldVersion} → ${release.newVersion} (${release.type})`,
      );
    });

    const changelogContentPath = join(
      rootDir,
      "docs/components/ChangelogContent.mdx",
    );

    console.log("📖 Reading existing changelog...");
    let existingContent = "";
    try {
      existingContent = await readFile(changelogContentPath, "utf-8");
    } catch {
      // 파일이 없으면 빈 문자열로 시작
    }

    console.log("📖 Extracting manual content...");
    const manualContents = await extractManualContent(changelogContentPath);

    console.log("🗂️ Organizing changelog entries...");
    const entries = await organizeChangelogEntries(
      releasePlan,
      manualContents,
      existingContent,
      packages,
    );

    console.log("📝 Generating changelog markdown...");
    const markdown = generateChangelogMarkdown(entries, existingContent);

    console.log("💾 Writing changelog file...");
    await writeFile(changelogContentPath, markdown);

    console.log("✅ Changelog generated successfully!");
    console.log(`📄 File: ${changelogContentPath}`);
  } catch (error) {
    console.error("❌ Error generating changelog:", error);
    process.exit(1);
  }
}

main();
