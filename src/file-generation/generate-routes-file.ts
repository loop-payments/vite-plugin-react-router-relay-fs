import { ImportDeclaration, ObjectExpression, Program } from "estree";
import { DirectoryNode } from "../route-ast/ast-types.ts";
import { generateDirectoryRoute } from "./generate-directory-route.ts";

export function generateRoutesFile(directoryNode: DirectoryNode): Program {
  let imports: Array<ImportDeclaration>;
  let route: ObjectExpression;
  if (
    directoryNode.children.length === 0 &&
    directoryNode.index == null &&
    directoryNode.layout == null
  ) {
    // If there are no routes, generate a default error route to aid with debugging.
    route = generateErrorRoute();
    imports = [];
  } else {
    ({ imports, route } = generateDirectoryRoute(directoryNode));
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
              elements: [route],
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

function generateErrorRoute(): ObjectExpression {
  return {
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
  };
}
