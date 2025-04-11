/**
 * We only pay attention to files that will impact the route generation.
 * Specifically these are only entrypoints. In the future this may also include
 * a different "redirect" type of file.
 */
export function isRoutableFile(id: string): boolean {
  return /\.entrypoint\.(t|j)sx?$/.test(id);
}
