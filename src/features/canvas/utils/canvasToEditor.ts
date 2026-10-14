import { Node, Edge } from "@xyflow/react";
import { BlockData } from "@/features/canvas/components/canvas/CustomNode";
import { saveDocumentAction } from "@/features/editor/actions/documentActions";

export interface CompiledDocument {
  title: string;
  subtitle: string;
  content: string; // HTML for Tiptap
  plainText: string;
}

export function compileCanvasToDocument(
  nodes: Node<BlockData>[],
  edges: Edge[],
  canvasTitle: string = "Untitled Canvas"
): CompiledDocument {
  if (!nodes || nodes.length === 0) {
    return {
      title: canvasTitle,
      subtitle: "Created from MuseFlow Canvas",
      content: "<p></p>",
      plainText: "",
    };
  }

  // 1. Order nodes Left-to-Right, Top-to-Bottom
  // We can sort nodes by x primarily (with a 200px column threshold) and then by y
  const sortedNodes = [...nodes].sort((a, b) => {
    const xDiff = a.position.x - b.position.x;
    if (Math.abs(xDiff) > 180) {
      return xDiff;
    }
    return a.position.y - b.position.y;
  });

  // 2. Identify title from hook, heading, or canvasTitle
  let derivedTitle = canvasTitle;
  const firstHeader = sortedNodes.find(
    (n) => n.data?.type === "heading" || n.data?.type === "hook"
  );
  if (firstHeader?.data?.content) {
    const rawFirstLine = firstHeader.data.content.split("\n")[0].replace(/[#*_`]/g, "").trim();
    if (rawFirstLine.length > 5 && rawFirstLine.length < 90) {
      derivedTitle = rawFirstLine;
    }
  }

  // 3. Compile HTML blocks
  const htmlParts: string[] = [];
  const textParts: string[] = [];

  for (const node of sortedNodes) {
    const block = node.data;
    if (!block || !block.content) continue;

    const rawContent = block.content.trim();
    const cleanContent = rawContent.replace(/^#+\s*/, "");

    textParts.push(rawContent);

    switch (block.type) {
      case "hook":
        htmlParts.push(
          `<blockquote><p><strong>${cleanContent.replace(/\n/g, "<br/>")}</strong></p></blockquote>`
        );
        break;

      case "heading":
        htmlParts.push(`<h2>${cleanContent}</h2>`);
        break;

      case "problem":
        htmlParts.push(
          `<h3>The Challenge</h3><p>${cleanContent.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`
        );
        break;

      case "solution":
        htmlParts.push(
          `<h3>The Solution</h3><p>${cleanContent.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`
        );
        break;

      case "quote":
        htmlParts.push(
          `<blockquote><p>${cleanContent.replace(/\n/g, "<br/>")}</p></blockquote>`
        );
        break;

      case "list": {
        const items = cleanContent
          .split("\n")
          .map((line) => line.replace(/^[-*•\d+.]\s+/, "").trim())
          .filter(Boolean);
        if (items.length > 0) {
          htmlParts.push(`<ul>${items.map((it) => `<li>${it}</li>`).join("")}</ul>`);
        } else {
          htmlParts.push(`<p>${cleanContent.replace(/\n/g, "<br/>")}</p>`);
        }
        break;
      }

      case "call-to-action":
        htmlParts.push(
          `<hr /><p><strong>Takeaway & Action:</strong><br/>${cleanContent.replace(/\n/g, "<br/>")}</p>`
        );
        break;

      case "prompt":
        htmlParts.push(
          `<h3>Goal & Context</h3><p>${cleanContent.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`
        );
        break;

      case "variant":
        htmlParts.push(
          `<h3>${(node.data as any)?.title || "Variation"}</h3><p>${cleanContent.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`
        );
        break;

      case "paragraph":
      default:
        htmlParts.push(
          `<p>${cleanContent.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>")}</p>`
        );
        break;
    }
  }

  const finalHtml = htmlParts.join("\n");
  const finalPlainText = textParts.join("\n\n");

  return {
    title: derivedTitle,
    subtitle: `Canvas Storyboard • ${sortedNodes.length} Blocks`,
    content: finalHtml,
    plainText: finalPlainText,
  };
}

export async function exportCanvasToEditorAction(
  nodes: Node<BlockData>[],
  edges: Edge[],
  canvasTitle: string
): Promise<{ docId: string }> {
  const compiled = compileCanvasToDocument(nodes, edges, canvasTitle);
  
  const savedDoc = await saveDocumentAction({
    title: compiled.title,
    subtitle: compiled.subtitle,
    excerpt: compiled.plainText.slice(0, 160) + (compiled.plainText.length > 160 ? "..." : ""),
    content_html: compiled.content,
  });

  if (!savedDoc?.id) {
    throw new Error("Failed to save compiled canvas as a document");
  }

  return { docId: savedDoc.id };
}
