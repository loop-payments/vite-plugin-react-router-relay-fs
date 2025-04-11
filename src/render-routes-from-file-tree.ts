import { Program } from "estree";
import { FileTree } from "./file-tree.ts";
import { fileTreeToDirectoryAst } from "./route-ast/file-tree-to-route-ast.ts";
import { removeEmptyNodes } from "./route-ast/remove-empty-nodes.ts";
import { compressRoutes } from "./route-ast/compress-routes.ts";
import { generateRoutesFile } from "./file-generation/generate-routes-file.ts";
import { generate } from "astring";

export function renderRoutesFromFileTree(fileTree: FileTree): string {
  const ast = fileTreeToDirectoryAst(fileTree);

  const prunedAst = removeEmptyNodes(ast);
  let program: Program;
  if (prunedAst != null) {
    const compressedAst = compressRoutes(prunedAst);
    program = generateRoutesFile(compressedAst);
  } else {
    program = generateRoutesFile({
      kind: "directory",
      path: "",
      id: "",
      layout: null,
      index: null,
      children: [],
    });
  }

  return generate(program);
}