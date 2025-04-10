/**
 * Converts a file name to a route path. This applies a few mappings as the
 * naming conventions in the file paths are different from the route path's
 * naming conventions.
 */
export function routePathForFileName(name: string): string | undefined {
  if (name.startsWith("_")) {
    return undefined;
  }
  if (name === "$") {
    return "*";
  }

  let suffix = "";
  if (name.startsWith("(") && name.endsWith(")")) {
    name = name.slice(1, -1);
    suffix = "?";
  }
  if (name.startsWith("$")) {
    return `:${name.slice(1)}${suffix}`;
  }

  return `${name}${suffix}`;
}
