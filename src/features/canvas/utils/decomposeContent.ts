export interface DecomposedBlock {
  type: string;
  content: string;
  title?: string;
  extractedTitle?: string;
  parentIndex?: number;
  edgeLabel?: string;
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
    combined.includes("opener") ||
    combined.includes("stop scrolling") ||
    combined.includes("attention grabber") ||
    combined.includes("did you know")
  ) {
    return "hook";
  }

  // 3. Problem / Pain Point
  if (
    combined.includes("problem") ||
    combined.includes("pain point") ||
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
    combined.includes("solution") ||
    combined.includes("tool") ||
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
    combined.includes("interview") ||
    bodyPreview.trim().startsWith(">")
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

  // 7. Heading / Chapter / Act / Prompt
  if (combined.includes("prompt") || combined.includes("context") || combined.includes("instructions")) {
    return "prompt";
  }

  if (headerText && !bodyPreview) {
    return "heading";
  }

  return "paragraph";
}

// Regex to detect options or variations: Option 1, Variation A, Angle 2, Approach 3, 1., etc.
const OPTION_HEADER_REGEX =
  /^(?:#{1,4}\s+|(?:\*{1,2}|_{1,2}))?(?:Option|Variation|Version|Alternative|Angle|Approach|Idea|Draft|Take)\s*#?(\d+|[A-Z])(?:\s*[:\-–—]\s*|\s+)(.*?)(?:\*{1,2}|_{1,2})?$/i;

const NUMBERED_OPTION_REGEX =
  /^(?:#{1,4}\s+|(?:\*{1,2}|_{1,2}))?(\d+)[\.:\)]\s+(.*?)(?:\*{1,2}|_{1,2})?$/;

const STANDARD_HEADER_REGEX =
  /^(?:#{1,4}\s+|(?:\*{1,2}|_{1,2})?(?:\[\s*\d+:\d+\s*[-–—]\s*\d+:\d+\s*\]|\(\s*\d+:\d+\s*[-–—]\s*\d+:\d+\s*\)|(?:Scene|Act|Segment|Part|Step|Tip|Tool|Point|Phase|Section)\s*#?\d+|Hook|Problem|Solution|Action|CTA|Call[- ]to[- ]Action|Outro|Intro|Takeaway|Key Takeaway|Summary|Prompt|Goal|Overview)(?::|(?:\*{1,2}|_{1,2}))?)/i;

export function decomposeContentIntoBlocks(
  rawContent: string,
  defaultTopic?: string
): DecomposedBlock[] {
  const trimmed = (rawContent || "").trim();
  if (!trimmed) return [];

  const lines = trimmed.split("\n");
  let extractedTitle = "";
  let contentStartIdx = 0;

  // Scan for top metadata lines: **Title:**, **Format:**, etc.
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

  const rawParagraphs = bodyText.split(/\n\s*\n+/);

  // -------------------------------------------------------------
  // CHECK 1: Detect "Option / Variation Brainstorm" structure
  // (e.g. Intro Prompt followed by Option 1, Option 2, Option 3, Option 4)
  // -------------------------------------------------------------
  const optionIndices: number[] = [];
  const parsedOptions: { idx: number; title: string; body: string; optionNum: string }[] = [];

  for (let pIdx = 0; pIdx < rawParagraphs.length; pIdx++) {
    const p = rawParagraphs[pIdx].trim();
    if (!p) continue;
    const pLines = p.split("\n");
    const firstLine = pLines[0].trim();

    const optMatch = firstLine.match(OPTION_HEADER_REGEX);
    if (optMatch) {
      optionIndices.push(pIdx);
      const optionNum = optMatch[1];
      const titleSub = cleanSectionTitle(optMatch[2] || firstLine);
      const title = `Option ${optionNum}: ${titleSub}`;
      const body = pLines.slice(1).join("\n").trim();
      parsedOptions.push({ idx: pIdx, title, body, optionNum });
    }
  }

  // If we found at least 2 distinct options:
  if (parsedOptions.length >= 2) {
    const blocks: DecomposedBlock[] = [];
    const firstOptionIdx = optionIndices[0];

    // Determine the overarching topic / category of the options
    const fullTextLower = bodyText.toLowerCase();
    let unifiedOptionType = "variant";
    if (fullTextLower.includes("hook")) {
      unifiedOptionType = "hook";
    } else if (fullTextLower.includes("call to action") || fullTextLower.includes("cta")) {
      unifiedOptionType = "call-to-action";
    } else if (fullTextLower.includes("headline") || fullTextLower.includes("title")) {
      unifiedOptionType = "heading";
    } else if (fullTextLower.includes("solution")) {
      unifiedOptionType = "solution";
    } else if (fullTextLower.includes("problem")) {
      unifiedOptionType = "problem";
    }

    // Check if there is an introductory / prompt block before the first option
    let rootIndex: number | undefined = undefined;
    if (firstOptionIdx > 0) {
      const introParas = rawParagraphs.slice(0, firstOptionIdx).map((p) => p.trim()).filter(Boolean);
      const introText = introParas.join("\n\n");
      if (introText) {
        const firstLine = introParas[0].split("\n")[0].slice(0, 60);
        blocks.push({
          type: "prompt",
          title: defaultTopic || firstLine || "Brainstorm Goal & Context",
          content: introText,
          extractedTitle: extractedTitle || defaultTopic,
        });
        rootIndex = 0;
      }
    }

    // Now add all option blocks
    parsedOptions.forEach((opt, oIdx) => {
      blocks.push({
        type: unifiedOptionType,
        title: opt.title,
        content: opt.body || opt.title,
        parentIndex: rootIndex,
        edgeLabel: `Option ${opt.optionNum || oIdx + 1}`,
        extractedTitle: extractedTitle || defaultTopic,
      });
    });

    if (blocks.length > 0) {
      return blocks;
    }
  }

  // -------------------------------------------------------------
  // CHECK 2: Standard Paragraph & Header Parser
  // -------------------------------------------------------------
  const candidateBlocks: DecomposedBlock[] = [];

  let currentSection = {
    type: "paragraph",
    header: "",
    lines: [] as string[],
  };

  const flushCurrent = () => {
    if (currentSection.lines.length > 0 || currentSection.header) {
      const content = currentSection.lines.join("\n\n").trim();
      candidateBlocks.push({
        type: currentSection.type,
        title: currentSection.header || undefined,
        content: content || currentSection.header,
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

    const isHeader =
      STANDARD_HEADER_REGEX.test(firstLine) ||
      OPTION_HEADER_REGEX.test(firstLine) ||
      NUMBERED_OPTION_REGEX.test(firstLine);

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
        // If this is the first paragraph and looks like an intro prompt, mark as prompt
        if (candidateBlocks.length === 0 && pIdx === 0) {
          if (p.toLowerCase().includes("here are") || p.toLowerCase().includes("ways to") || p.length < 200) {
            currentSection.type = "prompt";
          } else {
            currentSection.type = bType;
          }
        } else {
          currentSection.type = bType;
        }
        currentSection.lines.push(p);
        flushCurrent();
      }
    }
  }

  flushCurrent();

  // If multiple sequential story/post blocks were identified, wire them sequentially
  if (candidateBlocks.length >= 3 && candidateBlocks.every((b) => b.parentIndex === undefined)) {
    const types = candidateBlocks.map((b) => b.type);
    const hasHook = types.includes("hook");
    const hasSolution = types.includes("solution");
    if (hasHook && hasSolution) {
      for (let i = 1; i < candidateBlocks.length; i++) {
        candidateBlocks[i].parentIndex = i - 1;
        candidateBlocks[i].edgeLabel = candidateBlocks[i].type;
      }
    }
  }

  // Fallback: If only 1 block was generated but content has multiple paragraphs, split them
  if (candidateBlocks.length <= 1) {
    const paragraphs = bodyText
      .split(/\n\s*\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (paragraphs.length >= 2) {
      return paragraphs.map((p, idx) => {
        let blockType = determineBlockType("", p);
        if (idx === 0 && p.toLowerCase().includes("here are")) {
          blockType = "prompt";
        } else if (idx === 0 && blockType === "paragraph" && p.length < 250) {
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
