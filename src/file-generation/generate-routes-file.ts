import { ImportDeclaration, ObjectExpression, Program } from "estree";
import { generateRouteObject } from "./generate-route-object.ts";
import { FileTree } from "../file-tree.ts";

export function generateRoutesFile(fileTree: FileTree): Program {
  const imports: Array<ImportDeclaration> = [];
  const routeObjects: Array<ObjectExpression> = [];

  for (const value of Object.values(fileTree)) {
    const routeInfo = generateRouteObject(value);
    if (routeInfo != null) {
      imports.push(...routeInfo.imports);
      routeObjects.push(routeInfo.route);
    }
  }

  // If there are no routes, generate a default error route to aid with debugging.
  if (routeObjects.length === 0) {
    routeObjects.push({
      type: "ObjectExpression",
      properties: [
        {
          type: "Property",
          key: {
            type: "Literal",
            value: "path",
          },
          value: {
            type: "Literal",
            value: "*",
          },
          kind: "init",
          method: false,
          shorthand: false,
          computed: false,
        },
        {
          type: "Property",
          key: {
            type: "Literal",
            value: "element",
          },
          value: {
            type: "Literal",
            value: `ERROR: No routes are defined.`,
          },
          kind: "init",
          method: false,
          shorthand: false,
          computed: false,
        },
      ],
    });
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
