# UI Specification – Content Ideation & Publishing SaaS

## 1. Design Principles

- Clarity over decoration: Prioritize fast scanning and low cognitive load for creators working in short, focused bursts. [file:1][web:36]  
- Momentum-first flows: Minimize context switching between ideation, structuring, previewing, and scheduling. [file:1]  
- Accessible by default: All text and key UI elements must meet at least WCAG 2.2 AA contrast ratios. [web:22][web:32]

---

## 2. Color System

### 2.1 Palette structure

Use a simple, trustworthy palette suitable for professional creators:

- Primary: Calm, trust-focused blue  
  - Primary 50: `#F4F7FB`  
  - Primary 100: `#DFE9FA`  
  - Primary 200: `#BFD3F5`  
  - Primary 300: `#8CADF0`  
  - Primary 400: `#4E7BE5`  
  - Primary 500 (main): `#2556D8`  
  - Primary 600: `#1E45AF`  
  - Primary 700: `#18358A`  

- Neutral (for surfaces and text)  
  - Neutral 50: `#F8FAFC`  
  - Neutral 100: `#EEF2F6`  
  - Neutral 200: `#E0E5EC`  
  - Neutral 300: `#C5CCD8`  
  - Neutral 400: `#9AA2B2`  
  - Neutral 500: `#6B7280`  
  - Neutral 700: `#111827`  
  - Neutral 900: `#020617`

- Semantic  
  - Success 500: `#16A34A`  
  - Warning 500: `#F59E0B`  
  - Error 500: `#DC2626`  

Apply the 60–30–10 rule: 60% neutral backgrounds, 30% neutral surfaces, 10% primary accents. [web:22][web:26]

### 2.2 Usage

- Primary 500: Primary CTAs (Generate Ideas, Schedule Post), focused inputs, active navigation. [web:16]  
- Primary 100–200: Soft highlights, selected states, subtle canvas zone emphasis. [web:25]  
- Neutrals 50–200: Page and panel backgrounds.  
- Neutrals 500–900: Text, icons, borders.  
- Semantic colors: Validation, errors, success confirmations (paired with icons and text, never color alone). [web:25]

### 2.3 Contrast & Accessibility

- Body text vs background: Contrast ratio ≥ 4.5:1 (AA). [web:22][web:32]  
- Large text (≥ 18px regular or 16px bold) and UI icons: ≥ 3:1. [web:27][web:32]  
- Never use gray text below Neutral 400 on white for body copy. [web:25][web:35]

---

## 3. Typography

### 3.1 Font families

- Primary font: `Inter`, `system-ui`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `sans-serif`. [web:16][web:37]  
- Use a single family across app to reduce cognitive noise and increase scan speed for busy creators. [web:26]

### 3.2 Type scale (desktop base)

- Display / Page title: 28–32 px, semibold, line-height 130%  
- H1 (section title): 24 px, semibold, line-height 130%  
- H2 (subsection): 20 px, medium, line-height 130%  
- H3 (group label): 16 px, medium, line-height 130%  
- Body / default text: 14–16 px, regular, line-height 150%  
- Helper text / caption: 12–13 px, regular, line-height 140%  
- Button label: 14 px, medium, uppercase optional (use sparingly to avoid shouting)

Guidelines:

- Keep 2–3 text sizes per screen to reduce clutter. [web:28][web:31]  
- Left-align all long-form text and actions for easier scanning. [web:28]

---

## 4. Spacing, Layout, and Alignment

### 4.1 Spacing system

Adopt a 4‑point spacing grid. [web:24][web:19]

- Base unit: 4 px  
- Common tokens: 4, 8, 12, 16, 20, 24, 32, 40 px

Usage:

- Inside components (button padding, input padding): 8–12 px vertical, 12–16 px horizontal. [web:24]  
- Between related elements (label → input, input → helper text): 4–8 px.  
- Between sections/cards: 16–24 px.  
- Page padding (desktop): 24–32 px from viewport edges.

### 4.2 Layout model

- Main layout: Two-panel or three-panel for the Editor:  
  - Left: Input + idea list (narrow).  
  - Center: Smart Canvas blocks (primary focus).  
  - Right: Channel preview and scheduling panel (collapsible on smaller widths). [file:1]  
- Navigation: Left sidebar for main sections (Editor, Calendar, Settings), top bar for profile, plan, and global actions. [web:29][web:36]

Alignment rules:

- Use a 12‑column grid (desktop) with 24 px gutters.  
- Align primary actions consistently bottom-right within a card or top-right for toolbars. [web:39]  
- Avoid center alignment for multi-line text; use center only for single-stat or onboarding hero lines. [web:28]

---

## 5. Components

### 5.1 Buttons

States:

- Default primary:  
  - Background: Primary 500  
  - Text: `#FFFFFF`  
  - Border radius: 8 px  
  - Padding: 8 px (Y) × 16 px (X)  
- Hover:  
  - Background: Primary 600  
- Active/pressed:  
  - Background: Primary 700  
- Disabled:  
  - Background: Neutral 200  
  - Text: Neutral 400  
  - Cursor: not-allowed, opacity 0.6 [web:16]

Secondary button:

- Background: `transparent`  
- Border: 1 px solid Neutral 300  
- Text: Neutral 700  
- Hover: Neutral 100 background.

Text button:

- No border, no background; use Primary 500 text, underline on hover.

Use cases:

- Primary: “Generate Ideas”, “Apply Profile”, “Schedule Post”.  
- Secondary: “Cancel”, “Back”, “Skip for now”.

### 5.2 Inputs and textareas

- Height: 40–44 px (single-line).  
- Border: 1 px solid Neutral 300 (default), 1 px solid Primary 500 (focused). [web:16]  
- Radius: 8 px.  
- Background: `#FFFFFF`.  
- Placeholder: Neutral 400, contrast ≥ 4.5:1 where feasible. [web:27]  
- Focus ring: 1–2 px Primary 200 outer shadow.

Error state:

- Border: 1 px solid Error 500.  
- Helper text: Error 500, 12 px, with icon.

### 5.3 Cards and panels

- Used for: Idea kernels, canvas blocks, channel previews, schedule slots. [file:1]  
- Background: `#FFFFFF` or Neutral 50.  
- Border: 1 px solid Neutral 200 or subtle shadow (0 1 px 2 px rgba(15, 23, 42, 0.04)). [web:16]  
- Radius: 8–12 px.  
- Padding: 16–20 px.  
- Hover (clickable items): subtle elevation and border color shift to Neutral 300.

### 5.4 Smart Canvas blocks

- Block shape:  
  - Background: `#FFFFFF`  
  - Border: 1 px solid Neutral 200  
  - Radius: 10–12 px (slightly more playful but still professional).  
  - Shadow (on drag): 0 4 px 12 px rgba(15, 23, 42, 0.10)  
  - Internal padding: 12–16 px.

- Label/tag:  
  - Small pill for “Hook”, “Problem”, “Solution”, “CTA” using Primary 100 background, Primary 600 text.  

- Actions:  
  - Right-aligned icon buttons: “Regenerate”, “Expand”, “Duplicate”; 24 px icon hit area.  

This supports the ICP’s desire for block-level control without feeling heavy. [file:1]

### 5.5 Toggles, radios, and checkboxes

- Channel selector: radio-style pills with icon + label (X, LinkedIn, YouTube). [file:1]  
  - Selected: Primary 500 border and text, Primary 50 background.  
  - Unselected: Neutral 300 border, Neutral 700 text, white background.

Checkboxes:

- Box: 16 px, radius 4 px.  
- Checked: Primary 500 fill, white check icon.  
- Focus outline: 1–2 px Primary 200.

### 5.6 Modals

Used for scheduling, confirmation, and destructive actions. [file:1]

- Max width: 480–640 px.  
- Padding: 24 px.  
- Background: `#FFFFFF`.  
- Overlay: rgba(15, 23, 42, 0.40).  
- Radius: 12 px.  
- Top section: Title + short description.  
- Middle: Form fields or summary.  
- Bottom: Primary and secondary buttons aligned right.

---

## 6. Transparency, Shadows, and Depth

- Surfaces:

  - Primary cards: minimal or no shadow, rely on contrast between Neutral 50 and white. [web:28]  
  - Elevated/interactable elements (dragged blocks, active modals): stronger shadow, e.g. 0 12 px 30 px rgba(15, 23, 42, 0.18).  

- Transparency:

  - Overlays (modal background): 40–50% black (`rgba(15, 23, 42, 0.40)`). [web:16]  
  - Hover overlays (buttons, cards): max 10–15% dark overlay; avoid heavy opacity that muddies colors. [web:16]

Keep depth subtle to avoid visual fatigue for creators working in long sessions.

---

## 7. States and Feedback

### 7.1 Loading

- For AI actions (Generate Ideas, Expand Block, Best-Time):

  - Show inline skeleton loaders or shimmering blocks instead of global spinners. [file:1]  
  - Use short microcopy (e.g., “Generating ideas…”), but keep it quiet and non-marketing.

### 7.2 Success and error

- Success:  
  - Use Success 500, subtle green check icon, and short confirmation text near the action (e.g., “Scheduled for Tue 3:00 PM”).  

- Error:  
  - Use Error 500, clear message, and actionable hint (“Couldn’t reach AI. Try again in a few seconds.”).  
  - For critical flow failures (scheduling, saving canvas), use inline plus toast.

### 7.3 Hover, focus, active

- Every interactive element must:  

  - Change at least one of: background, border, or shadow on hover. [web:33][web:36]  
  - Have a visible focus state for keyboard users (outline or shadow). [web:38]

---

## 8. Responsive Behavior

- Desktop first, with tablet/laptop as main usage context for creators. [file:1]  
- Breakpoints:

  - ≥ 1200 px: three-panel Editor (input, canvas, preview).  
  - 900–1200 px: two-panel (canvas + context panel with tabs).  
  - ≤ 900 px: stacked sections with tabs for Ideas / Canvas / Preview / Schedule.

- Navigation collapses to icon-only sidebar for widths below 1024 px; labels appear on hover or in tooltip. [web:29]

---

## 9. ICP Fit Rationale (Emotions & Energy)

- Calm neutrals + trustworthy blue reduce anxiety around “being behind” on content and make the canvas feel like a safe workspace, not a noisy social feed. [file:1][web:26]  
- Limited palette, consistent spacing, and clear hierarchy support fast, low-effort scanning during short, high-energy content sprints. [web:24][web:33]  
- Strong, clear states (loading, success, error) reassure slightly overwhelmed creators that the system is responsive and has not “lost their work.” [file:1][web:36]
