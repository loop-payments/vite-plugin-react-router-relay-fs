import { ImportDeclaration, ObjectExpression, Program } from "estree";
import { generateRouteObject } from "./generate-route-object.ts";
import { FileTree } from "../file-tree.ts";

export function generateRoutesFile(fileTree: FileTree): Program {
  const imports: Array<ImportDeclaration> = [];
  const routeObjects: Array<ObjectExpression> = [];

  for (const value of Object.values(fileTree)) {
    const { imports: childImports, route: childRoute } = generateRouteObject(value);
    imports.push(...childImports);
    routeObjects.push(childRoute);
  }

  return {
    type: "Program",
    sourceType: "module",
    body: [
      ...imports,
      {
        type: "VariableDeclaration",
        declarations: [
          {
            type: "VariableDeclarator",
            id: { type: "Identifier", name: "routes" },
            init: {
              type: "ArrayExpression",
              elements: routeObjects,
            },
          },
        ],
        kind: "const",
      },
      {
        type: "ExportDefaultDeclaration",
        declaration: {
          type: "Identifier",
          name: "routes",
        },
      },
    ],
  };
}
