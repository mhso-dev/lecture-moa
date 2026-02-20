/**
 * Custom remark-callout Plugin
 * REQ-FE-304: Transform GFM alert syntax to custom callout nodes
 *
 * Transforms:
 * - > [!NOTE] ... → custom callout node with type="note"
 * - > [!TIP] ... → custom callout node with type="tip"
 * - > [!WARNING] ... → custom callout node with type="warning"
 * - > [!IMPORTANT] ... → custom callout node with type="important"
 * - > [!CAUTION] ... → custom callout node with type="caution"
 */

// Type definitions for unified/mdast
interface Node {
  type: string;
  [key: string]: unknown;
}

interface Root extends Node {
  type: "root";
  children: Node[];
}

interface Blockquote extends Node {
  type: "blockquote";
  children: Node[];
}

interface Paragraph extends Node {
  type: "paragraph";
  children: PhrasingContent[];
}

interface Text extends Node {
  type: "text";
  value: string;
}

type PhrasingContent = Text | Node;

type CalloutType = "note" | "tip" | "warning" | "important" | "caution";

interface CalloutNode extends Node {
  type: "callout";
  calloutType: CalloutType;
  title?: string;
  children: PhrasingContent[];
}

const CALLOUT_REGEX = /^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*(.*)$/i;

const CALLOUT_TYPE_MAP: Record<string, CalloutType> = {
  NOTE: "note",
  TIP: "tip",
  WARNING: "warning",
  IMPORTANT: "important",
  CAUTION: "caution",
};

/**
 * remark plugin to transform GFM alert syntax to custom callout nodes
 */
export const remarkCallout = function (): (tree: Root) => Root {
  return (tree: Root) => {
    // Process children in reverse to handle nested callouts
    for (let i = tree.children.length - 1; i >= 0; i--) {
      const node = tree.children[i];
      if (!node) continue;

      if (node.type !== "blockquote") {
        continue;
      }

      const blockquote = node as Blockquote;

      // Check if first child is a paragraph with callout syntax
      const firstParagraph = blockquote.children.find(
        (child) => child.type === "paragraph"
      );

      if (!firstParagraph?.type || firstParagraph.type !== "paragraph") {
        continue;
      }

      const paragraph = firstParagraph as Paragraph;
      const firstChild = paragraph.children[0];

      if (!firstChild?.type || firstChild.type !== "text") {
        continue;
      }

      const textNode = firstChild as Text;
      const match = CALLOUT_REGEX.exec(textNode.value);

      if (!match) {
        continue;
      }

      const rawType = match[1]?.toUpperCase();
      const customTitle = (match[2] ?? "").trim() || undefined;
      const calloutType = rawType ? CALLOUT_TYPE_MAP[rawType] : undefined;

      if (!calloutType) {
        continue;
      }

      // Remove the callout marker from the first text node
      const matchedText = match[0];
      const remainingText = matchedText ? textNode.value.slice(matchedText.length) : "";

      // Build phrasing content
      const phrasingContent: PhrasingContent[] = [];

      // Add remaining text from the first paragraph
      if (remainingText) {
        phrasingContent.push({
          type: "text",
          value: remainingText,
        });
      }

      // Add rest of first paragraph's children
      if (paragraph.children.length > 1) {
        phrasingContent.push(...paragraph.children.slice(1));
      }

      // Add content from remaining paragraphs
      for (let j = 1; j < blockquote.children.length; j++) {
        const child = blockquote.children[j];
        if (child?.type === "paragraph") {
          const childParagraph = child as Paragraph;
          phrasingContent.push(
            { type: "text", value: " " },
            ...childParagraph.children
          );
        }
      }

      // Create callout node
      const calloutNode: CalloutNode = {
        type: "callout",
        calloutType,
        title: customTitle,
        children: phrasingContent,
      };

      // Replace blockquote with callout
      tree.children[i] = calloutNode as unknown as Node;
    }

    return tree;
  };
};
