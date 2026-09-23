export interface CanvasTemplateBlock {
  tempId: string;
  type: string;
  content: string;
  x: number;
  y: number;
}

export interface CanvasTemplateEdge {
  source: string;
  target: string;
  label?: string;
}

export interface CanvasTemplate {
  id: string;
  title: string;
  description: string;
  category: "Viral Growth" | "Thought Leadership" | "Case Study" | "Framework";
  badge: string;
  icon: string;
  blocks: CanvasTemplateBlock[];
  edges: CanvasTemplateEdge[];
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "contrarian-take",
    title: "The Contrarian Take",
    description: "Challenge an industry myth, present a counter-intuitive reality, and provide actionable proof.",
    category: "Thought Leadership",
    badge: "High Engagement",
    icon: "swords",
    blocks: [
      {
        tempId: "node-1",
        type: "hook",
        content: "Most advice in our industry tells you to do [X].\n\nIt sounds reasonable. Everyone repeats it.\n\nYet the top 1% do the exact opposite.",
        x: 80,
        y: 350,
      },
      {
        tempId: "node-2",
        type: "problem",
        content: "The Conventional Wisdom:\n\n• Focus entirely on vanity metrics\n• Follow generic playbooks from 5 years ago\n• Optimize before you have genuine product-market traction\n\nWhy it fails: It creates endless activity without tangible leverage.",
        x: 520,
        y: 160,
      },
      {
        tempId: "node-3",
        type: "solution",
        content: "The Counter-Intuitive Truth:\n\nStop trying to please everyone.\nDouble down on the specific bottleneck that moves 80% of your results with 20% of effort.",
        x: 520,
        y: 540,
      },
      {
        tempId: "node-4",
        type: "paragraph",
        content: "The 3-Step Paradigm Shift:\n\n1. Audit where your hours actually go\n2. Automate or delete redundant steps\n3. Protect focused deep-work blocks ruthlessly",
        x: 960,
        y: 350,
      },
      {
        tempId: "node-5",
        type: "call-to-action",
        content: "Which outdated playbook are you unlearning this month?\n\nDrop your thoughts below.",
        x: 1380,
        y: 350,
      },
    ],
    edges: [
      { source: "node-1", target: "node-2", label: "The Lie" },
      { source: "node-1", target: "node-3", label: "The Reality" },
      { source: "node-2", target: "node-4", label: "Synthesis" },
      { source: "node-3", target: "node-4", label: "Action Shift" },
      { source: "node-4", target: "node-5", label: "Discussion" },
    ],
  },
  {
    id: "case-study-teardown",
    title: "The Case Study Teardown",
    description: "Deconstruct a real-world success story: the hurdle, the mechanism, the metrics, and the takeaway.",
    category: "Case Study",
    badge: "Authority Builder",
    icon: "search",
    blocks: [
      {
        tempId: "node-1",
        type: "hook",
        content: "In 2024, [Company/Creator] was on the verge of stagnation.\n\n12 months later, they generated over $1.2M in recurring revenue.\n\nHere is the exact teardown of what changed:",
        x: 80,
        y: 360,
      },
      {
        tempId: "node-2",
        type: "problem",
        content: "The Bottleneck:\n\nThey had great output, but zero retention.\nUsers signed up, explored once, and never returned because onboarding had too much friction.",
        x: 520,
        y: 180,
      },
      {
        tempId: "node-3",
        type: "solution",
        content: "The Strategic Pivot:\n\n1. Replaced the 10-step tutorial with a 60-second interactive Quick-Win\n2. Embedded pre-baked templates to solve the blank canvas panic\n3. Enabled 1-click export directly to user workflows",
        x: 520,
        y: 540,
      },
      {
        tempId: "node-4",
        type: "paragraph",
        content: "The Concrete Results:\n\n• Activation rate jumped from 18% to 64%\n• Day-30 retention tripled\n• Word-of-mouth referral became the #1 acquisition channel",
        x: 960,
        y: 360,
      },
      {
        tempId: "node-5",
        type: "call-to-action",
        content: "Key Lesson: Don't sell the product. Sell the fastest path to their first 'Aha!' moment.\n\nSave this teardown for your next product launch.",
        x: 1380,
        y: 360,
      },
    ],
    edges: [
      { source: "node-1", target: "node-2", label: "The Crisis" },
      { source: "node-1", target: "node-3", label: "The Fix" },
      { source: "node-2", target: "node-4", label: "Impact" },
      { source: "node-3", target: "node-4", label: "Metrics" },
      { source: "node-4", target: "node-5", label: "Takeaway" },
    ],
  },
  {
    id: "viral-thread-breakdown",
    title: "Viral 7-Part Breakdown",
    description: "Multi-part storytelling structure engineered for X threads, LinkedIn carousels, and newsletters.",
    category: "Viral Growth",
    badge: "Most Popular",
    icon: "share-2",
    blocks: [
      {
        tempId: "node-1",
        type: "hook",
        content: "Most creators spend 20 hours a week creating content that gets zero reach.\n\nHere is the 5-step framework I use to generate high-retention content in under 30 minutes:",
        x: 80,
        y: 380,
      },
      {
        tempId: "node-2",
        type: "heading",
        content: "1/ Hook with Tension:\n\nIf your first line doesn't promise immediate value or break a pattern, 90% of readers keep scrolling.\n\nUse contrast: 'Do this, not that.'",
        x: 520,
        y: 120,
      },
      {
        tempId: "node-3",
        type: "paragraph",
        content: "2/ Establish the Stakes:\n\nExplain why this problem matters right now.\n\nLoss aversion drives attention: what is inaction costing them every single week?",
        x: 520,
        y: 380,
      },
      {
        tempId: "node-4",
        type: "quote",
        content: "3/ The Tactical Step:\n\nGive them one specific formula they can copy-paste immediately.\n\nClarity beats cleverness every single time.",
        x: 520,
        y: 640,
      },
      {
        tempId: "node-5",
        type: "solution",
        content: "4/ The Secret Multiplier:\n\nRepurpose the core angle into multiple native formats:\n• Visual Canvas for ideation\n• Thread for X\n• Formatted essay for LinkedIn\n• Deep-dive for Newsletter",
        x: 960,
        y: 380,
      },
      {
        tempId: "node-6",
        type: "call-to-action",
        content: "5/ Recap & Outro:\n\n1. Hook with tension\n2. State the stakes\n3. Provide the tool\n4. Repurpose across channels\n\nRepost to share with your network.",
        x: 1380,
        y: 380,
      },
    ],
    edges: [
      { source: "node-1", target: "node-2", label: "Hook" },
      { source: "node-1", target: "node-3", label: "Context" },
      { source: "node-1", target: "node-4", label: "Tactic" },
      { source: "node-2", target: "node-5", label: "Multiplier" },
      { source: "node-3", target: "node-5", label: "Multiplier" },
      { source: "node-4", target: "node-5", label: "Multiplier" },
      { source: "node-5", target: "node-6", label: "Outro" },
    ],
  },
  {
    id: "step-by-step-framework",
    title: "Step-by-Step How-To Framework",
    description: "Action-oriented educational guide with clear phases, execution tips, and a final summary checklist.",
    category: "Framework",
    badge: "High Saves",
    icon: "wrench",
    blocks: [
      {
        tempId: "node-1",
        type: "hook",
        content: "How to master [Skill/Goal] in 30 days without burning out:\n\nA step-by-step roadmap from zero to execution.",
        x: 80,
        y: 350,
      },
      {
        tempId: "node-2",
        type: "paragraph",
        content: "Phase 1: Foundation (Days 1-7)\n\n• Define your non-negotiable target\n• Eliminate distractions and unnecessary tools\n• Set up an automated tracking dashboard",
        x: 520,
        y: 160,
      },
      {
        tempId: "node-3",
        type: "paragraph",
        content: "Phase 2: Execution & Repetition (Days 8-21)\n\n• Ship one small iteration daily\n• Collect qualitative feedback from early users\n• Document what works and discard what doesn't",
        x: 520,
        y: 540,
      },
      {
        tempId: "node-4",
        type: "solution",
        content: "Phase 3: Optimization & Scaling (Days 22-30)\n\n• Double down on the top 20% high-performing actions\n• Create templates and SOPs to delegate or automate",
        x: 960,
        y: 350,
      },
      {
        tempId: "node-5",
        type: "call-to-action",
        content: "What skill are you committed to leveling up this quarter?\n\nLeave a comment below!",
        x: 1380,
        y: 350,
      },
    ],
    edges: [
      { source: "node-1", target: "node-2", label: "Week 1" },
      { source: "node-1", target: "node-3", label: "Week 2-3" },
      { source: "node-2", target: "node-4", label: "Scaling" },
      { source: "node-3", target: "node-4", label: "Scaling" },
      { source: "node-4", target: "node-5", label: "Call to Action" },
    ],
  },
];
