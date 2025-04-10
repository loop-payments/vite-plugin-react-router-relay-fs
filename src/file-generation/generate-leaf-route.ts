import { ImportDeclaration, ObjectExpression } from "estree";
import { LeafNode } from "../route-ast/ast-types.ts";
import { generateEntryPointRoute } from "./generate-entrypoint-route.ts";

export function generateLeafRoute(node: LeafNode): {
  imports: Array<ImportDeclaration>;
  route: ObjectExpression;
} {
  const { imports, route } = generateEntryPointRoute(
    node.id,
    node.entryPointFilePath,
  );

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

  return {
    imports,
    route,
  };
}
