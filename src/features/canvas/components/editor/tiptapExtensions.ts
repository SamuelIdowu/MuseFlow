import { Extension, Mark, Node, mergeAttributes } from "@tiptap/react";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

// 1. Underline Mark
export const Underline = Mark.create({
  name: "underline",
  parseHTML() {
    return [
      { tag: "u" },
      {
        style: "text-decoration",
        consuming: false,
        getAttrs: (style) => ((style as string).includes("underline") ? {} : false),
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["u", mergeAttributes(HTMLAttributes), 0];
  },
  addCommands() {
    return {
      setUnderline: () => ({ commands }: any) => commands.setMark(this.name),
      toggleUnderline: () => ({ commands }: any) => commands.toggleMark(this.name),
      unsetUnderline: () => ({ commands }: any) => commands.unsetMark(this.name),
    } as any;
  },
  addKeyboardShortcuts() {
    return {
      "Mod-u": () => (this.editor.commands as any).toggleUnderline(),
      "Mod-U": () => (this.editor.commands as any).toggleUnderline(),
    };
  },
});

// 2. TextAlign Extension
export const TextAlign = Extension.create({
  name: "textAlign",
  addOptions() {
    return {
      types: ["heading", "paragraph"],
      alignments: ["left", "center", "right", "justify"],
      defaultAlignment: "left",
    };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textAlign: {
            default: this.options.defaultAlignment,
            parseHTML: (element) => element.style.textAlign || this.options.defaultAlignment,
            renderHTML: (attributes) => {
              if (attributes.textAlign === this.options.defaultAlignment) {
                return {};
              }
              return { style: `text-align: ${attributes.textAlign}` };
            },
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setTextAlign: (alignment: string) => ({ commands }: any) => {
        if (!this.options.alignments.includes(alignment)) {
          return false;
        }
        return this.options.types.every((type: string) =>
          commands.updateAttributes(type, { textAlign: alignment })
        );
      },
      unsetTextAlign: () => ({ commands }: any) => {
        return this.options.types.every((type: string) =>
          commands.resetAttributes(type, "textAlign")
        );
      },
    } as any;
  },
});

// 3. Dedicated Color Mark
export const Color = Mark.create({
  name: "color",
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element) => element.style.color || element.getAttribute("data-color") || null,
        renderHTML: (attributes) => {
          if (!attributes.color) return {};
          return {
            style: `color: ${attributes.color} !important`,
            "data-color": attributes.color,
          };
        },
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "span[style*=color]",
        getAttrs: (element) => {
          const el = element as HTMLElement;
          return el.style.color ? { color: el.style.color } : false;
        },
      },
      {
        tag: "span[data-color]",
        getAttrs: (element) => ({ color: (element as HTMLElement).getAttribute("data-color") }),
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
  addCommands() {
    return {
      setColor: (color: string) => ({ commands }: any) => {
        return commands.setMark(this.name, { color });
      },
      unsetColor: () => ({ commands }: any) => {
        return commands.unsetMark(this.name);
      },
    } as any;
  },
});

// 4. Dedicated Highlight Mark
export const Highlight = Mark.create({
  name: "highlight",
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element) => element.style.backgroundColor || element.getAttribute("data-highlight") || null,
        renderHTML: (attributes) => {
          if (!attributes.color) return {};
          return {
            style: `background-color: ${attributes.color} !important`,
            "data-highlight": attributes.color,
          };
        },
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "mark",
      },
      {
        tag: "span[style*=background-color]",
        getAttrs: (element) => {
          const el = element as HTMLElement;
          return el.style.backgroundColor ? { color: el.style.backgroundColor } : false;
        },
      },
      {
        tag: "span[data-highlight]",
        getAttrs: (element) => ({ color: (element as HTMLElement).getAttribute("data-highlight") }),
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["mark", mergeAttributes(HTMLAttributes, { class: "rounded-sm px-0.5 py-0.5" }), 0];
  },
  addCommands() {
    return {
      setHighlight: (color: string) => ({ commands }: any) => {
        return commands.setMark(this.name, { color });
      },
      unsetHighlight: () => ({ commands }: any) => {
        return commands.unsetMark(this.name);
      },
    } as any;
  },
});

// 5. Dedicated FontSize Mark
export const FontSize = Mark.create({
  name: "fontSize",
  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (element) => element.style.fontSize || element.getAttribute("data-font-size") || null,
        renderHTML: (attributes) => {
          if (!attributes.size) return {};
          return {
            style: `font-size: ${attributes.size} !important`,
            "data-font-size": attributes.size,
          };
        },
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "span[style*=font-size]",
        getAttrs: (element) => {
          const el = element as HTMLElement;
          return el.style.fontSize ? { size: el.style.fontSize } : false;
        },
      },
      {
        tag: "span[data-font-size]",
        getAttrs: (element) => ({ size: (element as HTMLElement).getAttribute("data-font-size") }),
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
  addCommands() {
    return {
      setFontSize: (size: string) => ({ commands }: any) => {
        return commands.setMark(this.name, { size });
      },
      unsetFontSize: () => ({ commands }: any) => {
        return commands.unsetMark(this.name);
      },
    } as any;
  },
});

// 6. Dedicated FontFamily Mark
export const FontFamily = Mark.create({
  name: "fontFamily",
  addAttributes() {
    return {
      family: {
        default: null,
        parseHTML: (element) => element.style.fontFamily || element.getAttribute("data-font-family") || null,
        renderHTML: (attributes) => {
          if (!attributes.family) return {};
          return {
            style: `font-family: ${attributes.family} !important`,
            "data-font-family": attributes.family,
          };
        },
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: "span[style*=font-family]",
        getAttrs: (element) => {
          const el = element as HTMLElement;
          return el.style.fontFamily ? { family: el.style.fontFamily } : false;
        },
      },
      {
        tag: "span[data-font-family]",
        getAttrs: (element) => ({ family: (element as HTMLElement).getAttribute("data-font-family") }),
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
  addCommands() {
    return {
      setFontFamily: (family: string) => ({ commands }: any) => {
        return commands.setMark(this.name, { family });
      },
      unsetFontFamily: () => ({ commands }: any) => {
        return commands.unsetMark(this.name);
      },
    } as any;
  },
});

// 7. TextStyle Wrapper Mark for compatibility
export const TextStyle = Mark.create({
  name: "textStyle",
  parseHTML() {
    return [{ tag: "span" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
});

// 4. Custom Link Mark
export const CustomLink = Mark.create({
  name: "link",
  priority: 1000,
  keepOnSplit: false,
  addAttributes() {
    return {
      href: { default: null },
      target: { default: "_blank" },
      rel: { default: "noopener noreferrer" },
      class: { default: "text-primary underline font-medium hover:opacity-80 transition-opacity" },
    };
  },
  parseHTML() {
    return [{ tag: "a[href]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["a", mergeAttributes(HTMLAttributes), 0];
  },
  addCommands() {
    return {
      setLink: (attributes: { href: string; target?: string }) => ({ chain }: any) => {
        return chain().setMark(this.name, attributes).run();
      },
      toggleLink: (attributes: { href: string; target?: string }) => ({ chain }: any) => {
        return chain().toggleMark(this.name, attributes).run();
      },
      unsetLink: () => ({ chain }: any) => {
        return chain().unsetMark(this.name).run();
      },
    } as any;
  },
});

// 5. Custom Image Node
export const CustomImage = Node.create({
  name: "image",
  inline: false,
  group: "block",
  draggable: true,
  addAttributes() {
    return {
      src: { default: null },
      alt: { default: "" },
      title: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: "img[src]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(HTMLAttributes, { class: "rounded-xl max-w-full my-4 border border-border shadow-sm mx-auto" })];
  },
  addCommands() {
    return {
      setImage: (options: { src: string; alt?: string; title?: string }) => ({ commands }: any) => {
        return commands.insertContent({
          type: this.name,
          attrs: options,
        });
      },
    } as any;
  },
});

// 6. Inline AI Auto-Completion (Ghost Text with Tab-to-accept)
export interface InlineCompletionStorage {
  suggestion: string | null;
  pos: number | null;
  source?: "research_agent" | "gemini_fallback";
}

export const inlineCompletionPluginKey = new PluginKey<InlineCompletionStorage>("inlineCompletionPlugin");

declare module "@tiptap/react" {
  interface Commands<ReturnType> {
    inlineCompletion: {
      setGhostSuggestion: (options: {
        text: string;
        pos: number;
        source?: "research_agent" | "gemini_fallback";
      }) => ReturnType;
      clearGhostSuggestion: () => ReturnType;
      acceptGhostSuggestion: () => ReturnType;
    };
  }
}

export const InlineCompletion = Extension.create({
  name: "inlineCompletion",

  addStorage(): InlineCompletionStorage {
    return {
      suggestion: null,
      pos: null,
      source: undefined,
    };
  },

  addCommands() {
    return {
      setGhostSuggestion:
        ({ text, pos, source }: { text: string; pos: number; source?: "research_agent" | "gemini_fallback" }) =>
        ({ tr, dispatch }: any) => {
          if (dispatch) {
            tr.setMeta(inlineCompletionPluginKey, { suggestion: text, pos, source });
          }
          return true;
        },

      clearGhostSuggestion:
        () =>
        ({ tr, dispatch }: any) => {
          if (dispatch) {
            tr.setMeta(inlineCompletionPluginKey, { suggestion: null, pos: null });
          }
          return true;
        },

      acceptGhostSuggestion:
        () =>
        ({ state, dispatch }: any) => {
          const pluginState = inlineCompletionPluginKey.getState(state);
          if (pluginState?.suggestion && pluginState.pos !== null) {
            const { suggestion, pos } = pluginState;
            if (dispatch) {
              const tr = state.tr
                .insertText(suggestion, pos)
                .setMeta(inlineCompletionPluginKey, { suggestion: null, pos: null });
              dispatch(tr);
            }
            return true;
          }
          return false;
        },
    } as any;
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        return (this.editor.commands as any).acceptGhostSuggestion();
      },
      Escape: () => {
        return (this.editor.commands as any).clearGhostSuggestion();
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: inlineCompletionPluginKey,
        state: {
          init(): InlineCompletionStorage {
            return { suggestion: null, pos: null };
          },
          apply(tr, current): InlineCompletionStorage {
            const meta = tr.getMeta(inlineCompletionPluginKey);
            if (meta) {
              return meta;
            }

            // If document changed or selection moved away, clear the ghost text
            if (tr.docChanged && current.suggestion) {
              return { suggestion: null, pos: null };
            }

            if (tr.selectionSet && current.pos !== null && tr.selection.from !== current.pos) {
              return { suggestion: null, pos: null };
            }

            return current;
          },
        },
        props: {
          decorations(state) {
            const pluginState = inlineCompletionPluginKey.getState(state);
            if (!pluginState || !pluginState.suggestion || pluginState.pos === null) {
              return DecorationSet.empty;
            }

            const { suggestion, pos, source } = pluginState;

            const widget = Decoration.widget(
              pos,
              () => {
                const span = document.createElement("span");
                span.className =
                  "inline-flex items-baseline text-zinc-400 dark:text-zinc-500 italic select-none pointer-events-none opacity-80 transition-opacity duration-150";
                span.setAttribute("data-ghost-text", "true");

                const textSpan = document.createElement("span");
                textSpan.textContent = suggestion;
                span.appendChild(textSpan);

                const badge = document.createElement("span");
                badge.className =
                  "inline-flex items-center gap-0.5 ml-1.5 px-1.5 py-0.5 text-[10px] not-italic font-mono font-medium rounded-md bg-zinc-200/80 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 shadow-2xs select-none";

                const agentIcon = source === "research_agent" ? "⚡ " : "✨ ";
                badge.textContent = `${agentIcon}Tab ⇥`;
                span.appendChild(badge);

                return span;
              },
              {
                side: 1,
                stopEvent: () => false,
              }
            );

            return DecorationSet.create(state.doc, [widget]);
          },
        },
      }),
    ];
  },
});

