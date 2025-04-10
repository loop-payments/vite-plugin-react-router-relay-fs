import { DirectoryNode } from "./ast-types.ts";

/**
 * Transform the directory AST by recursively removing all empty directory nodes.
 */
export function removeEmptyNodes(
  directory: DirectoryNode,
): DirectoryNode | undefined {
  const children = [];
  let modified = false;
  for (const child of directory.children) {
    if (child.kind === "directory") {
      const node = removeEmptyNodes(child);
      if (node != null) {
        children.push(node);
        if (node !== child) {
          modified = true;
        }
      } else {
        modified = true;
      }
    } else {
      children.push(child);
    }
  }

  // If there are no remaining children, and there is no layout or index we
  // can remove the directory node.
  if (
    children.length === 0 &&
    directory.layout == null &&
    directory.index == null
  ) {
    return undefined;
  }

  // Some children or layout/index nodes exist, if the children have changed
  // we need to return a new node.
  if (modified) {
    return {
      ...directory,
      children,
    };
  }

  // No changes were made, return the original node.
  return directory;
}
