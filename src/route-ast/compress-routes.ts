import { DirectoryNode } from "./ast-types.ts";

/**
 * Transform a directory AST by removing directory nodes that do not contain
 * any index or layout entrypoints. This preserves the leaves of the directory
 * while removing intermediate route nodes that can make matching ambiguous.
 */
export function compressRoutes(directory: DirectoryNode): DirectoryNode {
  const children = [];
  let modified = false;
  for (const child of directory.children) {
    switch (child.kind) {
      case "directory":
        const compressedDirectory = compressRoutes(child);
        if (compressedDirectory !== child) {
          modified = true;
        }
        // No index or layout in the child directory, we can compress it by
        // moving all of its children up a level.
        if (
          compressedDirectory.index == null &&
          compressedDirectory.layout == null
        ) {
          for (const grandchild of compressedDirectory.children) {
            const path = [child.path, grandchild.path]
              .filter(Boolean)
              .join("/");

            children.push({
              ...grandchild,
              path,
            });
          }
          modified = true;
        } else {
          children.push(compressedDirectory);
        }
        break;
      case "leaf":
        children.push(child);
        break;
      default:
        const _exhaustiveCheck: never = child;
        throw new Error(`Unknown node kind: ${child}`);
    }
  }

  if (modified) {
    return {
      ...directory,
      children,
    };
  }

  return directory;
}
