# UI & UX Plan: AI Content Ideation Platform

---

## 1. Design Philosophy

**Tone:** Futuristic, minimal, and innovative. The interface should feel like a creative co-pilot — light, fluid, and intelligent. Use soft gradients, translucent layers, and subtle motion to evoke an AI-powered creative workspace.

**Core Principles:**

* **Simplicity:** Remove clutter. Focus on content and AI interaction.
* **Speed:** Actions should feel instant (optimistic UI updates, async feedback).
* **Focus:** One core task per screen – ideation, editing, or scheduling.
* **Personalization:** Reflect user profile (niche, tone) in color hints and AI prompts.

---

## 2. Design System (shadcn/ui + Tailwind)

| Category              | Component                                             | Notes                                                                                               |
| --------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| **Navigation**        | `NavigationMenu`, `Sheet`                             | Top bar with quick actions (New Idea, Profile, Calendar). Left-side drawer for workspace switching. |
| **Forms**             | `Input`, `Textarea`, `Select`, `Slider`, `RadioGroup` | Used in profile wizard and channel selector. Clean glassmorphism effect.                            |
| **Modals**            | `Dialog`, `Drawer`                                    | For export previews, scheduling, and AI best-time recommendations.                                  |
| **Cards**             | `Card`, `CardHeader`, `CardContent`, `CardFooter`     | Used for idea kernels, canvas blocks, and calendar items. Rounded `2xl`, soft shadows.              |
| **Buttons**           | `Button` variants: primary, ghost, icon               | Neon-accented borders; subtle hover shimmer.                                                        |
| **Tabs & Accordions** | `Tabs`, `Accordion`                                   | Used in multi-format preview and profile configuration.                                             |
| **Notifications**     | `Toast`                                               | For async AI actions (idea generation complete, schedule saved).                                    |
| **AI Canvas**         | Custom using `ResizablePanelGroup`, `Command`, `Card` | Each block a draggable, editable card with inline AI controls.                                      |

---

## 3. Core Screens

### 3.1 Onboarding & Profile Wizard

* **Flow:** Name → Niche → Persona sliders → Paste sample content → Save.
* **UX cues:** Progress bar; AI avatar gives hints (microcopy: “Let’s learn your voice”).
* **Goal:** Get user into a contextualized workspace in < 2 minutes.

### 3.2 Dashboard / Idea Generator

* **Layout:** Split screen

  * Left: Input field (paste text/link) with “Generate Ideas” button.
  * Right: Card grid of generated idea kernels with `+ Add to Canvas` CTA.
* **Interaction:** Hover to expand preview; click adds to canvas.

### 3.3 Smart Canvas Workspace

* **Canvas Design:**

  * Drag-and-drop grid of blocks (`Hook`, `Problem`, `Solution`, `CTA`).
  * Each block editable inline with `Regenerate`, `Expand`, and `Summarize` buttons.
  * `Toolbar` floating on top: AI tools, Export, Schedule.
  * “Smart Template” system pre-fills structure based on selected channel.
* **Aesthetic:** Translucent cards over blurred gradient background; subtle hover glows.

### 3.4 Channel Selector & Export Preview

* **UI:** Modal triggered from Canvas Toolbar.
* **Components:**

  * `RadioGroup`: select platform (X, LinkedIn, YouTube, Blog).
  * Live preview pane auto-formats post structure.
  * `Tabs`: for Preview, Edit Markdown, or Copy.
  * `Button`: “Export”, “Copy”, “Schedule”.

### 3.5 Scheduler & Calendar View

* **Layout:**

  * Calendar with drag-and-drop cards for scheduled posts.
  * Floating “+” opens Schedule Dialog with time selector and “Best Time” AI button.
* **Best Time Modal:** Displays 2–3 suggested time slots with reasoning.
* **Goal:** Reduce friction – scheduling should feel like drag-drop, not data entry.

---

## 4. UX Journey Overview

### Stage 1: **Discovery**

User lands on a futuristic dashboard with glowing CTAs (“Start Creating”). Gets guided to the profile wizard.

### Stage 2: **Profile Setup**

A conversational wizard (micro-animations) collects tone, niche, and examples. Once complete, the workspace adapts visually (theme tint).

### Stage 3: **Idea Generation**

User inputs text/link → watches animated progress bar (“Scanning content for insights...”) → idea kernels appear with hover expand and emoji cues.

### Stage 4: **Canvas Editing**

User drags ideas into the Smart Canvas → blocks animate into place → AI tools appear contextually. The focus shifts from generation to co-creation.

### Stage 5: **Exporting**

User clicks “Export” → Channel Selector modal → chooses X/LinkedIn → sees instant preview → fine-tunes tone → copies or schedules.

### Stage 6: **Scheduling**

User opens Calendar → drags exported content → clicks “AI Best Time” → modal shows optimal times → confirms.

### Stage 7: **Reflection & Next Step**

System gives gentle nudge: “Want to repurpose this for another channel?” → opens cross-format export flow.

---

## 5. Visual Style & Motion

* **Palette:** Deep navy + electric cyan accents + neutral sand backgrounds.
* **Typography:** `Inter` or `Satoshi` – futuristic sans-serif with excellent readability.
* **Animation:** Use `framer-motion` for fades, slides, and micro-interactions.
* **Icons:** `lucide-react` (thin, geometric lines).
* **Shadows:** Soft ambient glows with subtle blur (AI theme aesthetic).

---

## 6. Accessibility & Responsiveness

* Keyboard shortcuts for AI actions (Ctrl+Shift+R = Regenerate, Ctrl+S = Save Canvas).
* Light/Dark modes.
* Mobile: stacked cards; gesture-driven block reordering.

---

**Outcome:** The UI/UX delivers a seamless creative flow — from idea spark to export — blending AI assistance with intuitive design, built on Shadcn UI’s modular system.
