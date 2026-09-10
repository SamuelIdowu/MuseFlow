/**
 * Robust client-side HTML to Markdown converter using DOMParser.
 * Avoids destructive regex replacements and correctly preserves nested structure.
 */

export function htmlToMarkdown(html: string): string {
  if (!html || typeof window === "undefined") return "";

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  function processNode(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return "";
    }

    const el = node as HTMLElement;
    const tagName = el.tagName.toLowerCase();
    const childrenText = Array.from(el.childNodes).map(processNode).join("");

    switch (tagName) {
      case "h1":
        return `\n\n# ${childrenText.trim()}\n\n`;
      case "h2":
        return `\n\n## ${childrenText.trim()}\n\n`;
      case "h3":
        return `\n\n### ${childrenText.trim()}\n\n`;
      case "h4":
        return `\n\n#### ${childrenText.trim()}\n\n`;
      case "h5":
        return `\n\n##### ${childrenText.trim()}\n\n`;
      case "h6":
        return `\n\n###### ${childrenText.trim()}\n\n`;
      case "p":
        return `\n\n${childrenText.trim()}\n\n`;
      case "br":
        return "\n";
      case "hr":
        return "\n\n---\n\n";
      case "strong":
      case "b":
        return `**${childrenText}**`;
      case "em":
      case "i":
        return `*${childrenText}*`;
      case "u":
        return `_${childrenText}_`;
      case "s":
      case "del":
      case "strike":
        return `~~${childrenText}~~`;
      case "code":
        if (el.parentElement?.tagName.toLowerCase() === "pre") {
          return childrenText;
        }
        return `\`${childrenText}\``;
      case "pre":
        return `\n\n\`\`\`\n${childrenText.trim()}\n\`\`\`\n\n`;
      case "blockquote":
        return `\n\n> ${childrenText.trim().replace(/\n/g, "\n> ")}\n\n`;
      case "ul": {
        const items = Array.from(el.children)
          .map((li) => `- ${Array.from(li.childNodes).map(processNode).join("").trim()}`)
          .join("\n");
        return `\n\n${items}\n\n`;
      }
      case "ol": {
        const items = Array.from(el.children)
          .map((li, idx) => `${idx + 1}. ${Array.from(li.childNodes).map(processNode).join("").trim()}`)
          .join("\n");
        return `\n\n${items}\n\n`;
      }
      case "a": {
        const href = el.getAttribute("href") || "";
        return href ? `[${childrenText}](${href})` : childrenText;
      }
      case "img": {
        const src = el.getAttribute("src") || "";
        const alt = el.getAttribute("alt") || "image";
        return src ? `![${alt}](${src})` : "";
      }
      default:
        return childrenText;
    }
  }

  const rawMarkdown = processNode(doc.body);
  // Clean up excess newlines (more than 2 consecutive newlines)
  return rawMarkdown.replace(/\n{3,}/g, "\n\n").trim();
}
