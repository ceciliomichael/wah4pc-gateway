import fs from "fs";
import path from "path";
import { DocsHeader } from "@/components/ui/docs-header";
import { MarkdownRenderer } from "@/components/ai/markdown-renderer";

function readRequestFormatsMarkdown(): string {
  const cwd = process.cwd();
  const pathCandidates = [
    path.resolve(cwd, "public", "format", "request-formats.md"),
    path.resolve(cwd, "format", "request-formats.md"),
    path.resolve(cwd, "..", "format", "request-formats.md"),
    path.resolve(cwd, "frontend-docs", "public", "format", "request-formats.md"),
    path.resolve(cwd, "frontend-docs", "format", "request-formats.md"),
  ];

  for (const markdownPath of pathCandidates) {
    try {
      if (fs.existsSync(markdownPath)) {
        return fs.readFileSync(markdownPath, "utf-8");
      }
    } catch (_error) {
      // Continue to the next candidate path.
    }
  }

  return "Failed to load format/request-formats.md";
}

export default function RequestFormatsPage() {
  const content = readRequestFormatsMarkdown();

  return (
    <article className="relative">
      <DocsHeader
        badge="Request Formats"
        badgeColor="green"
        title="Request and Return Formats"
        description="Source: format/request-formats.md"
      />

      <section id="overview">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <MarkdownRenderer content={content} className="text-slate-700" />
        </div>
      </section>
    </article>
  );
}
