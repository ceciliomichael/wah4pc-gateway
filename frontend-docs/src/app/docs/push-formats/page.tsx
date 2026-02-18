import fs from "fs";
import path from "path";
import { DocsHeader } from "@/components/ui/docs-header";
import { MarkdownRenderer } from "@/components/ai/markdown-renderer";

function readPushFormatsMarkdown(): string {
  const cwd = process.cwd();
  const pathCandidates = [
    path.resolve(cwd, "public", "format", "push-formats.md"),
    path.resolve(cwd, "format", "push-formats.md"),
    path.resolve(cwd, "..", "format", "push-formats.md"),
    path.resolve(cwd, "frontend-docs", "public", "format", "push-formats.md"),
    path.resolve(cwd, "frontend-docs", "format", "push-formats.md"),
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

  return "Failed to load format/push-formats.md";
}

export default function PushFormatsPage() {
  const content = readPushFormatsMarkdown();

  return (
    <article className="relative">
      <DocsHeader
        badge="Push Formats"
        badgeColor="green"
        title="Push Format Requirements"
        description="Source: public/format/push-formats.md"
      />

      <section id="overview">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <MarkdownRenderer content={content} className="text-slate-700" />
        </div>
      </section>
    </article>
  );
}
