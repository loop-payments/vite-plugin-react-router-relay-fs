import { routePathForFileName } from "./route-path-mapping.ts";

export type FileInfo = {
  name: string;
  routePath: string | undefined;
  isEntryPoint: boolean;
};

export function parseFileName(fileName: string): FileInfo {
  const entryPointResult = /\.entrypoint\.(t|j)sx?$/.exec(fileName);
  if (entryPointResult != null) {
    const name = fileName.slice(0, entryPointResult.index);
    return { name, routePath: routePathForFileName(name), isEntryPoint: true };
  }

  const nonEntryPointResult = /\.(t|j)sx?$/.exec(fileName);
  if (nonEntryPointResult) {
    const name = fileName.slice(0, nonEntryPointResult.index);
    return {
      name,
      routePath: routePathForFileName(name),
      isEntryPoint: false,
    };
  }

  return {
    name: fileName,
    routePath: routePathForFileName(fileName),
    isEntryPoint: false,
  };
}
