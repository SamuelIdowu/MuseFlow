import { Extension, Mark, Node, mergeAttributes } from "@tiptap/react";

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

// 3. TextStyle & Colors Mark
export const TextStyle = Mark.create({
  name: "textStyle",
  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: (element) => element.style.color?.replace(/['"]+/g, "") || null,
        renderHTML: (attributes) => {
          if (!attributes.color) return {};
          return { style: `color: ${attributes.color}` };
        },
      },
      backgroundColor: {
        default: null,
        parseHTML: (element) => element.style.backgroundColor?.replace(/['"]+/g, "") || null,
        renderHTML: (attributes) => {
          if (!attributes.backgroundColor) return {};
          return { style: `background-color: ${attributes.backgroundColor}` };
        },
      },
      fontFamily: {
        default: null,
        parseHTML: (element) => element.style.fontFamily?.replace(/['"]+/g, "") || null,
        renderHTML: (attributes) => {
          if (!attributes.fontFamily) return {};
          return { style: `font-family: ${attributes.fontFamily}` };
        },
      },
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize?.replace(/['"]+/g, "") || null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) return {};
          return { style: `font-size: ${attributes.fontSize}` };
        },
      },
    };
  },
  parseHTML() {
    return [{ tag: "span" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes), 0];
  },
  addCommands() {
    return {
      setColor: (color: string) => ({ chain }: any) => {
        return chain().setMark(this.name, { color }).run();
      },
      unsetColor: () => ({ chain }: any) => {
        return chain().setMark(this.name, { color: null }).run();
      },
      setHighlight: (backgroundColor: string) => ({ chain }: any) => {
        return chain().setMark(this.name, { backgroundColor }).run();
      },
      unsetHighlight: () => ({ chain }: any) => {
        return chain().setMark(this.name, { backgroundColor: null }).run();
      },
      setFontFamily: (fontFamily: string) => ({ chain }: any) => {
        return chain().setMark(this.name, { fontFamily }).run();
      },
      unsetFontFamily: () => ({ chain }: any) => {
        return chain().setMark(this.name, { fontFamily: null }).run();
      },
      setFontSize: (fontSize: string) => ({ chain }: any) => {
        return chain().setMark(this.name, { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }: any) => {
        return chain().setMark(this.name, { fontSize: null }).run();
      },
    } as any;
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
