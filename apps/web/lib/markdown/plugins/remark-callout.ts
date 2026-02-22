import type { Plugin } from "unified";
import type { Root, Blockquote, Text } from "mdast";
import { visit } from "unist-util-visit";

/**
 * Remark plugin for GitHub-style callout blocks.
 *
 * Transforms blockquotes with callout syntax into custom callout nodes:
 *   > [!NOTE]
 *   > Content here
 *
 * Supported types: NOTE, TIP, WARNING, IMPORTANT, CAUTION
 */

const CALLOUT_REGEX = /^\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*/i;

export const remarkCallout: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, "blockquote", (node: Blockquote, index, parent) => {
      if (parent == null || index === undefined) return;

      const firstChild = node.children[0];
      if (firstChild?.type !== "paragraph") return;

      const firstInline = firstChild.children[0];
      if (firstInline?.type !== "text") return;

      const match = CALLOUT_REGEX.exec(firstInline.value);
      if (!match?.[1]) return;

      const calloutType = match[1].toLowerCase();

      // Remove the callout marker from the text
      const remainingText = firstInline.value.slice(match[0].length);

      // Build new children: remove the marker from first paragraph
      const newFirstChildren = [...firstChild.children];
      if (remainingText.trim()) {
        (newFirstChildren[0] as Text).value = remainingText;
      } else {
        newFirstChildren.shift();
      }

      // Build content children
      const contentChildren =
        newFirstChildren.length > 0
          ? [{ ...firstChild, children: newFirstChildren }, ...node.children.slice(1)]
          : node.children.slice(1);

      // Replace blockquote with custom callout node
      const calloutNode = {
        type: "callout" as const,
        data: {
          hName: "callout",
          hProperties: {
            calloutType,
          },
        },
        children: contentChildren,
      };

      (parent.children as unknown[])[index] = calloutNode;
    });
  };
};
