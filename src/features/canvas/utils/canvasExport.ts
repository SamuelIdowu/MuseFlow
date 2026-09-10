import { Node } from "@xyflow/react";
import { BlockData } from "@/features/canvas/components/canvas/CustomNode";

export function convertNodesToMarkdown(
  nodes: Node<BlockData>[],
  pageTitle: string = "Untitled Canvas"
): string {
  let markdown = `# ${pageTitle}\n\n`;
  const sortedNodes = [...nodes].sort((a, b) => a.position.y - b.position.y);

  sortedNodes.forEach((node) => {
    const content = ((node.data?.content as string) || "").trim();
    const type = (node.data?.type as string) || "paragraph";
    if (!content) return;

    switch (type) {
      case "heading":
        markdown += `## ${content}\n\n`;
        break;
      case "hook":
        markdown += `> **Hook:** ${content}\n\n`;
        break;
      case "problem":
        markdown += `### Problem\n\n${content}\n\n`;
        break;
      case "solution":
        markdown += `### Solution\n\n${content}\n\n`;
        break;
      case "call-to-action":
        markdown += `---\n\n**${content}**\n\n`;
        break;
      case "quote":
        markdown += `> ${content}\n\n`;
        break;
      case "list": {
        const items = content.split("\n").filter((i) => i.trim());
        items.forEach((item: string) => {
          markdown += `- ${item.trim()}\n`;
        });
        markdown += "\n";
        break;
      }
      default:
        markdown += `${content}\n\n`;
    }
  });

  return markdown;
}

export function exportCanvas(
  nodes: Node<BlockData>[],
  pageTitle: string = "Untitled Canvas",
  format: "markdown" | "text"
): void {
  const content = convertNodesToMarkdown(nodes, pageTitle);
  const baseName = pageTitle.replace(/\s+/g, "-").toLowerCase();
  const filename = format === "markdown" ? `${baseName}.md` : `${baseName}.txt`;
  const mimeType = format === "markdown" ? "text/markdown" : "text/plain";

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
