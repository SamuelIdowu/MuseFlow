export interface EditorTemplate {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: "Longform" | "Newsletter" | "Case Study" | "Social Essay";
  icon: string;
  badge: string;
  content: string; // HTML for Tiptap
}

export const EDITOR_TEMPLATES: EditorTemplate[] = [
  {
    id: "thought-leadership-essay",
    title: "The Thought Leadership Essay",
    subtitle: "A Strategic Breakdown for Modern Leaders",
    description: "Provocative thesis, structural deep-dive, industry context, and strategic takeaways.",
    category: "Longform",
    icon: "pen-tool",
    badge: "High Authority",
    content: `<blockquote><p><strong>Core Thesis:</strong> The conventional wisdom around [Industry Topic] is broken. Here is what the forward-thinking practitioners are doing instead.</p></blockquote>
<h2>1. The Hidden Bottleneck</h2>
<p>Most organizations spend countless hours optimizing the wrong metric. They focus on superficial velocity rather than actual strategic leverage.</p>
<h2>2. The New Paradigm</h2>
<p>When you strip away outdated dogma, three fundamental shifts emerge:</p>
<ul>
  <li><strong>First-Principles Focus:</strong> Eliminating vanity workflows and focusing on high-retention activities.</li>
  <li><strong>Systemic Automation:</strong> Replacing manual friction with repeatable, automated pipelines.</li>
  <li><strong>Direct Feedback Loops:</strong> Closing the gap between shipping and user sentiment.</li>
</ul>
<h2>3. Measurable Strategic Impact</h2>
<p>Teams that have embraced this framework report higher creative throughput, lower operational fatigue, and significantly clearer brand positioning.</p>
<hr />
<p><strong>Actionable Takeaway:</strong> What is one legacy process you can deprecate this week to make room for high-leverage execution?</p>`,
  },
  {
    id: "curated-newsletter",
    title: "Weekly Curated Newsletter Issue",
    subtitle: "Insights, Tool Discoveries & Tactical Frameworks",
    description: "Structured layout with a primary feature story, quick insights, curated tools, and community spotlight.",
    category: "Newsletter",
    icon: "mail",
    badge: "Substack / Beehiiv",
    content: `<blockquote><p><strong>Issue #42:</strong> Welcome back! This week we explore high-leverage content systems and why creative momentum beats perfection.</p></blockquote>
<h2>1. The Big Idea</h2>
<p>If you wait until you feel ready to publish, someone with half your talent will ship three times ahead of you. Speed of iteration is the ultimate moat in the AI era.</p>
<h2>2. Three Tactical Takeaways</h2>
<ul>
  <li><strong>Deconstruct before writing:</strong> Map your narrative blocks on a visual canvas before drafting full paragraphs.</li>
  <li><strong>Optimize for mobile skim:</strong> Keep paragraphs under 3 lines and bold key hooks.</li>
  <li><strong>Repurpose natively:</strong> One long-form essay equals 1 newsletter, 1 Twitter thread, and 2 LinkedIn carousels.</li>
</ul>
<h2>3. Creator Tool of the Week</h2>
<p><strong>MuseFlow Studio:</strong> Transform rough thoughts into structured visual canvases and publication-ready drafts with zero friction.</p>
<hr />
<p><strong>Quote to Ponder:</strong> <em>"Action generates clarity far faster than thinking ever will."</em></p>`,
  },
  {
    id: "case-study-article",
    title: "Deep-Dive Case Study Article",
    subtitle: "Growth Mechanics, Distribution & Practical Lessons",
    description: "Comprehensive breakdown detailing the challenge, tactical implementation, and hard metrics.",
    category: "Case Study",
    icon: "trending-up",
    badge: "Proof & Conversion",
    content: `<blockquote><p><strong>Overview:</strong> How [Target Company] unlocked $1.2M in annual recurring revenue by redesigning their core activation loop.</p></blockquote>
<h2>The Genesis & The Problem</h2>
<p>Despite solid top-of-funnel acquisition, users abandoned the application within 48 hours. The onboarding process was cluttered with 12 distinct steps that added cognitive friction without tangible user reward.</p>
<h2>The Solution Architecture</h2>
<p>The engineering and product teams executed a radical simplification sprint:</p>
<ul>
  <li>Reduced first-time onboarding to a 60-second interactive calibration.</li>
  <li>Pre-loaded proven starter templates so users never confronted a blank page.</li>
  <li>Built 1-click export shortcuts into users' existing workflows.</li>
</ul>
<h2>The Hard Metrics</h2>
<p>Within 90 days of rollout:</p>
<ul>
  <li>User activation rate skyrocketed from 18% to 64%.</li>
  <li>Support tickets regarding onboarding dropped by 72%.</li>
  <li>Organic referral loops increased by 3.1x.</li>
</ul>
<hr />
<p><strong>Summary:</strong> Always sell the fastest path to the user's first 'Aha!' moment rather than features.</p>`,
  },
];
