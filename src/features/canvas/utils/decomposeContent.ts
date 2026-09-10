export interface DecomposedBlock {
  type: string;
  content: string;
  title?: string;
  extractedTitle?: string;
}

export function cleanSectionTitle(rawHeader: string): string {
  return rawHeader
    .replace(/^#{1,4}\s+/, "")
    .replace(/^[*_~`]+|[*_~`]+$/g, "")
    .trim();
}

export function determineBlockType(headerText: string, bodyPreview: string = ""): string {
  const combined = (headerText + " " + bodyPreview).toLowerCase();

  // 1. Call to Action / Outro / Next Steps
  if (
    combined.includes("call to action") ||
    combined.includes("call-to-action") ||
    combined.includes("cta") ||
    combined.includes("outro") ||
    combined.includes("drop a comment") ||
    combined.includes("comment below") ||
    combined.includes("follow for") ||
    combined.includes("subscribe") ||
    combined.includes("dm you") ||
    combined.includes("link in bio") ||
    combined.includes("try it now") ||
    combined.includes("sign up")
  ) {
    return "call-to-action";
  }

  // 2. Hook / Intro / Attention Grabber
  if (
    combined.includes("hook") ||
    combined.includes("intro") ||
    combined.includes("opener") ||
    combined.includes("stop scrolling") ||
    combined.includes("attention") ||
    combined.includes("did you know")
  ) {
    return "hook";
  }

  // 3. Problem / Pain Point
  if (
    combined.includes("problem") ||
    combined.includes("pain") ||
    combined.includes("challenge") ||
    combined.includes("struggle") ||
    combined.includes("frustrated") ||
    combined.includes("waste") ||
    combined.includes("mistake")
  ) {
    return "problem";
  }

  // 4. Solution / Tool / Tip / Step / Framework
  if (
    combined.includes("tool") ||
    combined.includes("solution") ||
    combined.includes("tip") ||
    combined.includes("step") ||
    combined.includes("framework") ||
    combined.includes("strategy") ||
    combined.includes("technique") ||
    combined.includes("how to") ||
    combined.includes("secret")
  ) {
    return "solution";
  }

  // 5. Quote / Testimonial
  if (
    combined.includes("quote") ||
    combined.includes("testimonial") ||
    combined.includes("dialogue") ||
    combined.includes("interview")
  ) {
    return "quote";
  }

  // 6. List
  if (
    bodyPreview.trim().startsWith("*") ||
    bodyPreview.trim().startsWith("-") ||
    bodyPreview.includes("\n* ") ||
    bodyPreview.includes("\n- ")
  ) {
    return "list";
  }

  // 7. Heading / Chapter / Act
  if (headerText && !bodyPreview) {
    return "heading";
  }

  return "paragraph";
}

export function decomposeContentIntoBlocks(
  rawContent: string,
  defaultTopic?: string
): DecomposedBlock[] {
  const trimmed = (rawContent || "").trim();
  if (!trimmed) return [];

  const lines = trimmed.split("\n");
  let extractedTitle = "";
  const metadata: { key: string; val: string }[] = [];
  let contentStartIdx = 0;

  // Scan for top metadata lines: **Title:**, **Format:**, **Pacing:**, etc.
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      contentStartIdx = i + 1;
      continue;
    }
    const metaMatch = line.match(
      /^(?:\*{1,2}|_{1,2})?(Title|Format|Pacing|Target Audience|Tone|Duration|Channel|Platform)(?:\*{1,2}|_{1,2})?:\s*(.+)$/i
    );
    if (metaMatch) {
      const key = metaMatch[1].toLowerCase();
      const val = metaMatch[2].replace(/^[*_~`]+|[*_~`]+$/g, "").trim();
      if (key === "title" && !extractedTitle) {
        extractedTitle = val;
      }
      metadata.push({ key, val });
      contentStartIdx = i + 1;
    } else {
      break;
    }
  }

  const bodyLines = lines.slice(contentStartIdx);
  const bodyText = bodyLines.join("\n").trim();

  if (!bodyText) {
    return [
      {
        type: "paragraph",
        content: trimmed,
        title: extractedTitle || defaultTopic,
        extractedTitle: extractedTitle || defaultTopic,
      },
    ];
  }

  const headerLineRegex =
    /^(?:#{1,4}\s+|(?:\*{1,2}|_{1,2})?(?:\[\s*\d+:\d+\s*[-–—]\s*\d+:\d+\s*\]|\(\s*\d+:\d+\s*[-–—]\s*\d+:\d+\s*\)|(?:Scene|Act|Segment|Part|Step|Tip|Tool|Point)\s*#?\d+|Hook|Problem|Solution|Action|CTA|Call[- ]to[- ]Action|Outro|Intro|Takeaway|Key Takeaway|Summary)(?::|(?:\*{1,2}|_{1,2}))?)/i;

  const rawParagraphs = bodyText.split(/\n\s*\n+/);
  const candidateBlocks: DecomposedBlock[] = [];

  let currentSection = {
    type: "paragraph",
    header: "",
    lines: [] as string[],
  };

  const flushCurrent = () => {
    if (currentSection.lines.length > 0 || currentSection.header) {
      let content = "";
      if (currentSection.header) {
        content =
          currentSection.lines.length > 0
            ? `**${currentSection.header}**\n\n${currentSection.lines.join("\n\n")}`
            : `**${currentSection.header}**`;
      } else {
        content = currentSection.lines.join("\n\n");
      }

      candidateBlocks.push({
        type: currentSection.type,
        content: content.trim(),
        extractedTitle: extractedTitle || defaultTopic,
      });
    }
    currentSection = { type: "paragraph", header: "", lines: [] };
  };

  for (let pIdx = 0; pIdx < rawParagraphs.length; pIdx++) {
    const p = rawParagraphs[pIdx].trim();
    if (!p) continue;

    const pLines = p.split("\n");
    const firstLine = pLines[0].trim();

    const isHeader = headerLineRegex.test(firstLine);

    if (isHeader) {
      flushCurrent();

      const cleanHeader = cleanSectionTitle(firstLine);
      const restOfP = pLines.slice(1).join("\n").trim();
      const bType = determineBlockType(cleanHeader, restOfP);

      currentSection.type = bType;
      currentSection.header = cleanHeader;
      if (restOfP) {
        currentSection.lines.push(restOfP);
      }
    } else {
      const isBulletList =
        pLines.filter((l) => /^\s*[-*•\d+.]\s+/.test(l)).length >= 2 ||
        (pLines.length === 1 && /^\s*[-*•]\s+/.test(pLines[0]));

      if (isBulletList) {
        flushCurrent();
        candidateBlocks.push({
          type: "list",
          content: p,
          extractedTitle: extractedTitle || defaultTopic,
        });
      } else if (currentSection.header) {
        const ctaType = determineBlockType("", p);
        if (ctaType === "call-to-action" && currentSection.type !== "call-to-action") {
          flushCurrent();
          candidateBlocks.push({
            type: "call-to-action",
            content: p,
            extractedTitle: extractedTitle || defaultTopic,
          });
        } else {
          currentSection.lines.push(p);
        }
      } else {
        const bType = determineBlockType("", p);
        if (candidateBlocks.length === 0 && pIdx === 0 && p.length < 250) {
          currentSection.type = "hook";
        } else {
          currentSection.type = bType;
        }
        currentSection.lines.push(p);
        flushCurrent();
      }
    }
  }

  flushCurrent();

  // Fallback: If only 1 block was generated but content has multiple paragraphs, split them
  if (candidateBlocks.length <= 1) {
    const paragraphs = bodyText
      .split(/\n\s*\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (paragraphs.length >= 2) {
      return paragraphs.map((p, idx) => {
        let blockType = determineBlockType("", p);
        if (idx === 0 && blockType === "paragraph" && p.length < 250) {
          blockType = "hook";
        } else if (
          idx === paragraphs.length - 1 &&
          blockType === "paragraph" &&
          p.length < 250
        ) {
          blockType = "call-to-action";
        }
        return {
          type: blockType,
          content: p,
          extractedTitle: extractedTitle || defaultTopic,
        };
      });
    }
  }

  return candidateBlocks.length > 0
    ? candidateBlocks
    : [
        {
          type: "paragraph",
          content: trimmed,
          title: extractedTitle || defaultTopic,
          extractedTitle: extractedTitle || defaultTopic,
        },
      ];
}
