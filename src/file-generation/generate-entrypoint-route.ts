import { makeLegalIdentifier } from "@rollup/pluginutils";
import { ImportDeclaration, ObjectExpression } from "estree";

export function generateEntryPointRoute(
  id: string,
  entryPointFilePath: string,
): {
  imports: Array<ImportDeclaration>;
  route: ObjectExpression;
} {
  const identifier = makeLegalIdentifier(id);
  const imports: Array<ImportDeclaration> = [
    {
      type: "ImportDeclaration",
      specifiers: [
        {
          type: "ImportDefaultSpecifier",
          local: {
            type: "Identifier",
            name: identifier,
          },
        },
      ],
      source: {
        type: "Literal",
        value: entryPointFilePath,
      },
      attributes: [],
    },
  ];

  return {
    imports,
    route: {
      type: "ObjectExpression",
      properties: [
        {
          type: "Property",
          key: {
            type: "Literal",
            value: "entryPoint",
          },
          value: {
            type: "Identifier",
            name: identifier,
          },
          kind: "init",
          method: false,
          shorthand: false,
          computed: false,
        },
      ],
    },
  };
}
