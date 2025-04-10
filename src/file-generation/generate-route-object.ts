import { ImportDeclaration, ObjectExpression } from "estree";
import { RouteNode } from "../route-ast/ast-types.ts";
import { generateLeafRoute } from "./generate-leaf-route.ts";
import { generateDirectoryRoute } from "./generate-directory-route.ts";

/**
 * Build the expressions for the node.
 */
export function generateRouteObject(node: RouteNode): {
  imports: Array<ImportDeclaration>;
  route: ObjectExpression;
} {
  const kind = node.kind;
  switch (kind) {
    case "leaf":
      return generateLeafRoute(node);
    case "directory":
      return generateDirectoryRoute(node);
    default:
      const _exhaustiveCheck: never = kind;
      throw new Error(`Unknown node kind: ${kind}`);
  }
}
