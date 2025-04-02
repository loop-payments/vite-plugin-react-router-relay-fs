import {
  ImportDeclaration,
  ObjectExpression,
  Property,
  SpreadElement,
} from "estree";
import { DirectoryNode, FileNode } from "../file-tree.ts";
import { generateEntryPointRoute } from "./generate-entrypoint-route.ts";
import { parseFileName } from "./parse-file-name.ts";

/**
 * Build the expressions for the node. If there are no leaf nodes this will
 * return undefined.
*/
export function generateRouteObject(node: FileNode | DirectoryNode): {
  imports: Array<ImportDeclaration>;
  route: ObjectExpression;
} | undefined {
  if (node.kind === "file") {
    const { name, isEntryPoint } = parseFileName(node.name);
    if (isEntryPoint) {
      return generateEntryPointRoute(name, node.path, node.id);
    } else {
      throw new Error(`File ${node.name} is not an entry point`);
    }
  } else if (node.kind === "directory") {
    const imports: Array<ImportDeclaration> = [];
    const children: Array<ObjectExpression> = [];

    let properties: Array<Property | SpreadElement> = [
    ];

    for (const child of Object.values(node.children)) {
      const { name } = parseFileName(child.name);
      const routeInfo = generateRouteObject(child);
      if (routeInfo != null) {
        const { imports: childImports, route: childRoute } = routeInfo;
        imports.push(...childImports);
        if (name === "_layout") {
          // Special case for layout routes, move their properties to the parent
          properties.push(...childRoute.properties);
        } else {
          children.push(childRoute);
        }
      }
    }

    // If there are no children, we don't generate a route object. This lets us
    // prune empty directories from the route tree.
    if (children.length === 0) {
      return undefined;
    }

    const { routePath } = parseFileName(node.name);
    if (routePath != null) {
      properties.push({
        type: "Property",
        key: {
          type: "Literal",
          value: "path",
        },
        value: {
          type: "Literal",
          value: routePath,
        },
        kind: "init",
        method: false,
        shorthand: false,
        computed: false,
      });
    }

    properties.push(
      {
        type: "Property",
        key: { type: "Literal", value: "children" },
        value: { type: "ArrayExpression", elements: children },
        kind: "init",
        method: false,
        shorthand: false,
        computed: false,
      });

    return {
      imports,
      route: {
        type: "ObjectExpression",
        properties,
      },
    };
  } else {
    throw new Error(`Unknown node kind: ${(node as any).kind}`);
  }
}
