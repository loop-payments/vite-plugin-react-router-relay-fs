#!/usr/bin/env node

import { writeFile } from "fs/promises";
import { renderRoutesFromFileTree } from "../render-routes-from-file-tree.ts";
import { scanDirectoryTree } from "../scan-directory-tree.ts";

/**
 * Read a directory and write the resulting routes file to a given path.
 */
async function main() {
  const directoryPath = process.argv[2];
  const outputPath = process.argv[3];
  const fileTree = await scanDirectoryTree(directoryPath, directoryPath);
  const code = renderRoutesFromFileTree(fileTree);
  await writeFile(outputPath, code);
}

main();
