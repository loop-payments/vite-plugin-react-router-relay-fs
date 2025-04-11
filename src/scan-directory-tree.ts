import { readdir } from "fs/promises";
import { join, relative } from "path";

import { FileTree } from "./file-tree.ts";
import { isRoutableFile } from "./is-routable-file.ts";

export async function scanDirectoryTree(dir: string, basePath: string): Promise<FileTree> {
  const tree: FileTree = {};
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const id = relative(basePath, fullPath);
    if (entry.isDirectory()) {
      tree[entry.name] = {
        kind: "directory",
        path: fullPath,
        name: entry.name,
        id,
        children: await scanDirectoryTree(fullPath, basePath),
      };
      // Ignore irrelevant files
    } else if (isRoutableFile(entry.name)) {
      tree[entry.name] = {
        kind: "file",
        path: fullPath,
        name: entry.name,
        id,
      };
    }
  }

  return tree;
}