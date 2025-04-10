import { ImportDeclaration, ObjectExpression } from "estree";
import { DirectoryNode } from "../route-ast/ast-types.ts";
import { generateRouteObject } from "./generate-route-object.ts";
import { generateEntryPointRoute } from "./generate-entrypoint-route.ts";

export function generateDirectoryRoute(node: DirectoryNode): {
  imports: Array<ImportDeclaration>;
  route: ObjectExpression;
} {
  const imports: Array<ImportDeclaration> = [];
  const children: Array<ObjectExpression> = [];

  for (const child of node.children) {
    const { imports: childImports, route: childRoute } =
      generateRouteObject(child);
    imports.push(...childImports);
    children.push(childRoute);
  }

  if (node.index != null) {
    const { imports: indexImports, route } = generateEntryPointRoute(
      node.index.id,
      node.index.entrypointFilePath,
    );
    imports.push(...indexImports);
    route.properties.push({
      type: "Property",
      key: {
        type: "Literal",
        value: "index",
      },
      value: {
        type: "Literal",
        value: true,
      },
      kind: "init",
      method: false,
      shorthand: false,
      computed: false,
    });
    children.push(route);
  }

  let route: ObjectExpression;
  if (node.layout != null) {
    const { imports: layoutImports, route: layoutRoute } =
      generateEntryPointRoute(node.layout.id, node.layout.entrypointFilePath);
    imports.push(...layoutImports);
    route = layoutRoute;
  } else {
    route = {
      type: "ObjectExpression",
      properties: [],
    };
  }

  // Set the path on the route
  if (node.path != null) {
    route.properties.push({
      type: "Property",
      key: {
        type: "Literal",
        value: "path",
      },
      value: {
        type: "Literal",
        value: node.path,
      },
      kind: "init",
      method: false,
      shorthand: false,
      computed: false,
    });
  }

  // Add the children to the route
  route.properties.push({
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
    route,
  };
}
