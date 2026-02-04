import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { PAGE_REGISTRY } from "@/lib/ai/docs/registry/pages";
import { readFullPageContent } from "@/lib/ai/docs/content-reader";

export async function GET(req: NextRequest) {
  try {
    const zip = new JSZip();
    const folder = zip.folder("wah4pc-documentation");

    if (!folder) {
      throw new Error("Failed to create zip folder");
    }

    // Iterate through all registered pages
    for (const page of Object.values(PAGE_REGISTRY)) {
      const content = readFullPageContent(page.id);
      
      if (content) {
        // Create filename based on ID (e.g., "resources/patient" -> "resources/patient.md")
        const filename = `${page.id}.md`;
        folder.file(filename, content);
      }
    }

    // Generate the zip file
    const zipContent = await zip.generateAsync({ type: "blob" });
    const arrayBuffer = await zipContent.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return the zip file
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="wah4pc-docs.zip"',
      },
    });
  } catch (error) {
    console.error("Error generating documentation zip:", error);
    return NextResponse.json(
      { error: "Failed to generate documentation zip" },
      { status: 500 }
    );
  }
}