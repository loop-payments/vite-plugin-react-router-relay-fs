import {
  FileTree,
  FileNode as FileTreeFileNode,
  DirectoryNode as FileTreeDirectoryNode,
} from "../file-tree.ts";
import { parseFileName } from "../file-generation/parse-file-name.ts";
import { DirectoryNode, LeafLikeNode, RouteNode } from "./ast-types.ts";

/**
 * Given a file tree convert it into a directory AST.
 */
export function fileTreeToDirectoryAst(fileTree: FileTree): DirectoryNode {
  const children: Array<RouteNode> = [];
  let layout = null;
  let index = null;

  for (const value of Object.values(fileTree)) {
    const node = fileTreeNodeToRouteAstNode(value);
    if (node == null) {
      continue;
    }

    switch (node.kind) {
      case "layout":
        layout = node;
        break;
      case "index":
        index = node;
        break;
      case "directory":
        children.push(node);
        break;
      case "leaf":
        children.push(node);
        break;
      default:
        const _exhaustiveCheck: never = node;
        throw new Error(`Unknown node kind: ${_exhaustiveCheck}`);
    }
  }

  return {
    kind: "directory",
    id: "",
    path: undefined,
    layout,
    index,
    children,
  };
}

function fileTreeNodeToRouteAstNode(
  node: FileTreeFileNode | FileTreeDirectoryNode,
): LeafLikeNode | DirectoryNode | undefined {
  const { name, routePath } = parseFileName(node.name);
  if (node.kind === "file") {
    switch (name) {
      case "_layout":
        return {
          kind: "layout",
          id: node.id,
          entrypointFilePath: node.path,
        };
      case "_index":
        return {
          kind: "index",
          id: node.id,
          entrypointFilePath: node.path,
        };
      default:
        if (routePath != null) {
          return {
            kind: "leaf",
            id: node.id,
            path: routePath,
            entryPointFilePath: node.path,
          };
        } else {
          // The file must be prefixed with an underscore and is an entrypoint,
          // but isn't one of our special files.
          return undefined;
        }
    }
  } else {
    const directoryNode = fileTreeToDirectoryAst(node.children);
    directoryNode.id = node.id;
    directoryNode.path = routePath;

    return directoryNode;
  }
}
