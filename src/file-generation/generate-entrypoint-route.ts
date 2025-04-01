import { makeLegalIdentifier } from "@rollup/pluginutils";
import { ImportDeclaration, ObjectExpression, Property } from "estree";
import { routePathForFileName } from "./route-path-mapping.ts";

export function generateEntryPointRoute(entryPointName: string, path: string, id: string): {
    imports: Array<ImportDeclaration>;
    route: ObjectExpression;
  } {
    const identifier = makeLegalIdentifier(id);
    const imports: Array<ImportDeclaration> = [{
      type: "ImportDeclaration",
      specifiers: [{
        type: "ImportDefaultSpecifier",
        local: {
          type: "Identifier",
          name: identifier,
        },
      }],
      source: {
        type: "Literal",
        value: path,
      },
      attributes: [],
    }];
    const properties: Array<Property> = [{
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
    }];
    const pathValue = routePathForFileName(entryPointName);
    if (pathValue != null) {
      properties.push({
        type: "Property",
        key: {
          type: "Literal",
          value: "path",
        },
        value: {
          type: "Literal",
          value: pathValue,
        },
        kind: "init",
        method: false,
        shorthand: false,
        computed: false,
      });
    }
    if (entryPointName === '_index') {
      properties.push({
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
    }
  
    return {
      imports,
      route: {
        type: "ObjectExpression",
        properties,
      },
    };
  }